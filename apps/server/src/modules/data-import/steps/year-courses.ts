import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import { teachersByEmail } from "./foundation-curriculum";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, normalize } from "./workbook";
import { requireYear } from "./year-context";
import { syncCourseEnrollments, unassignedTeacher } from "./year-sync";

const COURSES = "Cours";
const YES = new Set(["oui", "o", "yes", "y", "x", "1"]);

/** Classes of the year and the curriculum of their programs. */
async function loadYear(institutionId: string, academicYearId: string) {
	const classes = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.academicYear, academicYearId),
			eq(schema.classes.institutionId, institutionId),
		),
	});
	const programIds = [...new Set(classes.map((c) => c.program))];
	const classIds = classes.map((c) => c.id);
	const [courses, classCourses, semesters] = await Promise.all([
		programIds.length
			? db
					.select({
						id: schema.courses.id,
						code: schema.courses.code,
						name: schema.courses.name,
						program: schema.courses.program,
						defaultTeacher: schema.courses.defaultTeacher,
						defaultCoefficient: schema.courses.defaultCoefficient,
						unitLevel: schema.teachingUnits.cycleLevelId,
						unitSemester: schema.teachingUnits.semester,
						unitCode: schema.teachingUnits.code,
					})
					.from(schema.courses)
					.innerJoin(
						schema.teachingUnits,
						eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
					)
					.where(inArray(schema.courses.program, programIds))
			: Promise.resolve([]),
		classIds.length
			? db.query.classCourses.findMany({
					where: inArray(schema.classCourses.class, classIds),
				})
			: Promise.resolve([]),
		db.query.semesters.findMany({ orderBy: asc(schema.semesters.orderIndex) }),
	]);
	return { classes, courses, classCourses, semesters };
}

/**
 * Courses taught to each class of the year. Every course of the curriculum
 * whose teaching unit is at the class level is proposed; the file only adds
 * the exceptions: teachers, coefficients, courses outside the curriculum,
 * courses not taught that year.
 */
export const coursesStep: ImportStepDef = {
	key: "year.courses",
	label: "Cours des classes",
	scope: "year",
	sheets: [
		{
			name: COURSES,
			description:
				"Facultatif : chaque classe reçoit déjà les EC de son niveau dans la maquette. Une ligne sert à indiquer l'enseignant, corriger un coefficient, ajouter un EC hors maquette ou retirer un EC non enseigné cette année.",
			columns: [
				{
					key: "classCode",
					header: "Code classe",
					required: true,
					listFrom: "classes",
					aliases: ["Classe", "Class", "Class code"],
				},
				{
					key: "courseCode",
					header: "Code EC",
					required: true,
					listFrom: "courses",
					aliases: ["EC", "Code cours", "Course code", "Matière"],
				},
				{
					key: "teacherEmail",
					header: "E-mail enseignant",
					type: "email",
					width: 28,
					aliases: ["Enseignant", "Teacher email", "Teacher"],
				},
				{
					key: "coefficient",
					header: "Coefficient",
					type: "number",
					aliases: ["Coef", "Coef.", "Coefficient EC"],
				},
				{
					key: "remove",
					header: "Non enseigné",
					hint: "« oui » : l'EC n'est pas créé pour cette classe (un cours existant n'est jamais supprimé).",
					aliases: ["Retirer", "Exclure", "Not taught"],
				},
			],
		},
	],

	async existingRows(ctx) {
		const year = await requireYear(ctx);
		const { classes, courses, classCourses } = await loadYear(
			ctx.institutionId,
			year.id,
		);
		const teachers = await teachersByEmail(ctx.institutionId);
		const emailOf = new Map([...teachers].map(([email, id]) => [id, email]));
		const classCode = new Map(classes.map((c) => [c.id, c.code]));
		const courseOf = new Map(courses.map((c) => [c.id, c]));
		return {
			[COURSES]: classCourses
				.map((cc) => ({ cc, klass: classCode.get(cc.class) ?? "" }))
				.sort(
					(a, b) =>
						a.klass.localeCompare(b.klass) ||
						a.cc.code.localeCompare(b.cc.code),
				)
				.map(({ cc, klass }) => [
					klass,
					courseOf.get(cc.course)?.code ?? cc.code,
					emailOf.get(cc.teacher) ?? "",
					String(Number(cc.coefficient)),
					"",
				]),
		};
	},

	async lists(ctx) {
		const year = await requireYear(ctx);
		const { classes, courses } = await loadYear(ctx.institutionId, year.id);
		return {
			classes: classes.map((c) => c.code).sort(),
			courses: [...new Set(courses.map((c) => c.code))].sort(),
		};
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const sheetRows = rows[COURSES];
		const issues: ImportIssue[] = [
			...findDuplicates(
				COURSES,
				sheetRows,
				(r) => `${r.values.classCode}|${r.values.courseCode}`,
				"Code EC",
			),
		];
		const { classes, courses, classCourses, semesters } = await loadYear(
			ctx.institutionId,
			year.id,
		);
		const teachers = await teachersByEmail(ctx.institutionId);
		const classByCode = new Map(classes.map((c) => [c.code, c]));
		const existing = new Map(
			classCourses.map((cc) => [`${cc.class}|${cc.course}`, cc]),
		);
		const error = (
			row: number,
			column: string,
			code: string,
			params: Record<string, string | number>,
			message: string,
			level: "error" | "warning" = "error",
		) =>
			issues.push({
				sheet: COURSES,
				row,
				column,
				level,
				code,
				params,
				message,
			});

		/** What the file says about a (class, course) pair. */
		type Override = {
			row: number;
			teacher?: string;
			coefficient?: string;
			remove: boolean;
		};
		const overrides = new Map<string, Override>();
		const extra = new Set<string>();
		for (const r of sheetRows) {
			if (r.invalid) continue;
			const v = r.values;
			const klass = classByCode.get(normalizeCode(v.classCode));
			if (!klass) {
				error(
					r.row,
					"Code classe",
					"unknownClass",
					{ value: v.classCode, year: year.name },
					`Class ${v.classCode} unknown for ${year.name}.`,
				);
				continue;
			}
			const course = courses.find(
				(c) =>
					c.program === klass.program &&
					normalize(c.code) === normalize(v.courseCode),
			);
			if (!course) {
				error(
					r.row,
					"Code EC",
					"unknownCourse",
					{ value: v.courseCode, class: klass.code },
					`Course ${v.courseCode} is not in the curriculum of the program of ${klass.code}.`,
				);
				continue;
			}
			let teacher: string | undefined;
			if (v.teacherEmail) {
				teacher = teachers.get(v.teacherEmail.trim().toLowerCase());
				if (!teacher)
					error(
						r.row,
						"E-mail enseignant",
						"unknownTeacher",
						{ value: v.teacherEmail },
						`No teacher with email ${v.teacherEmail}: the course is kept without teacher.`,
						"warning",
					);
			}
			const key = `${klass.id}|${course.id}`;
			overrides.set(key, {
				row: r.row,
				teacher,
				coefficient: v.coefficient
					? Number(v.coefficient.replace(",", ".")).toFixed(2)
					: undefined,
				remove: YES.has(normalize(v.remove ?? "")),
			});
			extra.add(key);
		}
		const badRows = new Set(
			issues.filter((i) => i.level === "error").map((i) => i.row),
		);

		// Proposal from the curriculum: courses of units at the class level
		const unleveled = new Set<string>();
		const wanted = new Set<string>();
		for (const klass of classes) {
			for (const course of courses) {
				if (course.program !== klass.program) continue;
				if (!course.unitLevel) unleveled.add(course.unitCode);
				else if (course.unitLevel === klass.cycleLevelId)
					wanted.add(`${klass.id}|${course.id}`);
			}
		}
		for (const key of extra) {
			const o = overrides.get(key)!;
			if (!badRows.has(o.row)) wanted.add(key);
		}
		if (unleveled.size)
			issues.push({
				sheet: COURSES,
				row: 0,
				level: "warning",
				code: "unitsWithoutLevel",
				params: { units: [...unleveled].sort().join(", ") },
				message: `Teaching units without level, their courses are not proposed: ${[...unleveled].join(", ")}.`,
			});

		const semesterFor = (unitSemester: string) =>
			unitSemester === "fall"
				? semesters[0]?.id
				: unitSemester === "spring"
					? semesters[1]?.id
					: undefined;
		const courseById = new Map(courses.map((c) => [c.id, c]));
		type Change = {
			key: string;
			classId: string;
			courseId: string;
			id?: string;
			teacher?: string;
			coefficient: string;
			semesterId?: string;
			code: string;
		};
		const changes: Change[] = [];
		const summary: SheetSummary = {
			sheet: COURSES,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: badRows.size,
		};
		for (const key of wanted) {
			const [classId, courseId] = key.split("|");
			const course = courseById.get(courseId)!;
			const o = overrides.get(key);
			if (o?.remove) {
				summary.skipped++;
				continue;
			}
			const current = existing.get(key);
			const coefficient =
				o?.coefficient ??
				current?.coefficient ??
				Number(course.defaultCoefficient ?? 1).toFixed(2);
			const teacher =
				o?.teacher ?? current?.teacher ?? course.defaultTeacher ?? undefined;
			if (!current) summary.create++;
			else if (
				Number(current.coefficient) !== Number(coefficient) ||
				(o?.teacher && o.teacher !== current.teacher)
			)
				summary.update++;
			else {
				summary.unchanged++;
				continue;
			}
			changes.push({
				key,
				classId,
				courseId,
				id: current?.id,
				teacher,
				coefficient,
				semesterId: semesterFor(course.unitSemester),
				code: course.code,
			});
		}
		const withoutTeacher = changes.filter((c) => !c.teacher && !c.id).length;
		if (withoutTeacher)
			issues.push({
				sheet: COURSES,
				row: 0,
				level: "warning",
				code: "coursesWithoutTeacher",
				params: { count: withoutTeacher },
				message: `${withoutTeacher} course(s) without teacher: they can be assigned later.`,
			});

		return {
			sheets: [summary],
			issues,
			async apply(log) {
				const placeholder = withoutTeacher
					? await unassignedTeacher(ctx.institutionId)
					: undefined;
				const klassById = new Map(classes.map((c) => [c.id, c]));
				for (const change of changes) {
					if (change.id)
						await db
							.update(schema.classCourses)
							.set({
								coefficient: change.coefficient,
								...(change.teacher ? { teacher: change.teacher } : {}),
							})
							.where(eq(schema.classCourses.id, change.id));
					else
						await db
							.insert(schema.classCourses)
							.values({
								institutionId: ctx.institutionId,
								class: change.classId,
								course: change.courseId,
								code: normalizeCode(change.code),
								teacher: change.teacher ?? placeholder!,
								coefficient: change.coefficient,
								semesterId:
									change.semesterId ??
									klassById.get(change.classId)?.semesterId ??
									null,
							})
							.onConflictDoNothing();
				}
				await log(
					`Class courses: ${summary.create} created, ${summary.update} updated.`,
				);
				const enrolled = await syncCourseEnrollments(
					year.id,
					classes.map((c) => c.id),
				);
				await log(`Course enrollments: ${enrolled} created.`);
			},
		};
	},
};
