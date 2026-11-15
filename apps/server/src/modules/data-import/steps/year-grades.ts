import { and, eq, inArray, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import { recomputeForStudent } from "@/modules/student-credit-ledger/student-credit-ledger.service";
import type {
	ImportIssue,
	ImportStepDef,
	RowChange,
	SheetRow,
	SheetSummary,
} from "./types";
import { cellText, normalize } from "./workbook";
import { requireYear } from "./year-context";

const LONG = "Notes";
const MAX_SCORE = 20;
const ABSENT = new Set(["abs", "absent", "absente", "aj"]);
const REG_HEADERS = [
	"Matricule",
	"N° matricule",
	"No matricule",
	"Mat.",
	"Registration number",
].map(normalize);
const LONG_HEADERS: Record<string, string[]> = {
	registrationNumber: REG_HEADERS,
	classCode: ["Code classe", "Classe", "Class"].map(normalize),
	courseCode: ["Code EC", "EC", "Course code"].map(normalize),
	type: ["Type d'examen", "Examen", "Type", "Exam type"].map(normalize),
	score: ["Note", "Score", "Grade"].map(normalize),
};
/** Header of a grid column: course code and exam type ("INF111 | CC"). */
const examHeader = (courseCode: string, type: string) =>
	`${courseCode} | ${type}`;
const splitHeader = (header: string) => {
	const parts = header.split(/\s*[|·]\s*/);
	return parts.length === 2 ? { course: parts[0], type: parts[1] } : null;
};

/** Class courses of the year with their exams and the students of each class. */
async function loadYear(institutionId: string, academicYearId: string) {
	const classes = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.academicYear, academicYearId),
			eq(schema.classes.institutionId, institutionId),
		),
		orderBy: schema.classes.code,
	});
	const classIds = classes.map((c) => c.id);
	if (!classIds.length)
		return {
			classes,
			classCourses: [],
			exams: [],
			students: [],
			courseEnrollments: new Set<string>(),
		};
	const [classCourses, students] = await Promise.all([
		db
			.select({
				id: schema.classCourses.id,
				classId: schema.classCourses.class,
				courseCode: schema.courses.code,
				courseName: schema.courses.name,
			})
			.from(schema.classCourses)
			.innerJoin(
				schema.courses,
				eq(schema.courses.id, schema.classCourses.course),
			)
			.where(inArray(schema.classCourses.class, classIds)),
		db
			.select({
				id: schema.students.id,
				classId: schema.enrollments.classId,
				registrationNumber: schema.students.registrationNumber,
				lastName: schema.domainUsers.lastName,
				firstName: schema.domainUsers.firstName,
			})
			.from(schema.enrollments)
			.innerJoin(
				schema.students,
				eq(schema.students.id, schema.enrollments.studentId),
			)
			.innerJoin(
				schema.domainUsers,
				eq(schema.domainUsers.id, schema.students.domainUserId),
			)
			.where(
				and(
					eq(schema.enrollments.academicYearId, academicYearId),
					inArray(schema.enrollments.classId, classIds),
					sql`${schema.enrollments.status} <> 'withdrawn'`,
				),
			),
	]);
	const classCourseIds = classCourses.map((cc) => cc.id);
	const [exams, courseEnrollments] = classCourseIds.length
		? await Promise.all([
				db.query.exams.findMany({
					where: inArray(schema.exams.classCourse, classCourseIds),
				}),
				db
					.select({
						studentId: schema.studentCourseEnrollments.studentId,
						classCourseId: schema.studentCourseEnrollments.classCourseId,
					})
					.from(schema.studentCourseEnrollments)
					.where(
						inArray(
							schema.studentCourseEnrollments.classCourseId,
							classCourseIds,
						),
					),
			])
		: [[], []];
	return {
		classes,
		classCourses,
		exams,
		students,
		courseEnrollments: new Set(
			courseEnrollments.map((e) => `${e.studentId}|${e.classCourseId}`),
		),
	};
}

/** Exams of a class course, main exams first, then retakes. */
const examsOf = (exams: schema.Exam[], classCourseId: string) =>
	exams
		.filter((e) => e.classCourse === classCourseId)
		.sort(
			(a, b) =>
				Number(a.sessionType === "retake") -
					Number(b.sessionType === "retake") || a.type.localeCompare(b.type),
		);

/**
 * Grades of the year, as on a results report: one sheet per class (named by
 * its code), one row per student, one column per course and exam
 * ("INF111 | CC"). A long "Notes" sheet (registration number, class, course,
 * exam type, grade) is accepted too, for exports of other software.
 */
export const gradesStep: ImportStepDef = {
	key: "year.grades",
	label: "Notes",
	scope: "year",
	sheets: [
		{
			name: "<Code classe>",
			description:
				"Une feuille par classe, nommée par son code : une ligne par étudiant (matricule), une colonne par EC et examen (« INF111 | CC »). Note de 0 à 20, virgule ou point ; ABS pour un absent (compte 0) ; vide = pas de note.",
			columns: [
				{ key: "registrationNumber", header: "Matricule", required: true },
				{ key: "lastName", header: "Nom" },
				{ key: "firstName", header: "Prénom" },
				{ key: "exam", header: "<Code EC> | <Type d'examen>" },
			],
		},
		{
			name: LONG,
			description:
				"Autre format accepté : une note par ligne, pour les exports d'autres logiciels.",
			columns: [
				{ key: "registrationNumber", header: "Matricule", required: true },
				{ key: "classCode", header: "Code classe", required: true },
				{ key: "courseCode", header: "Code EC", required: true },
				{ key: "type", header: "Type d'examen", required: true },
				{ key: "score", header: "Note", required: true },
			],
		},
	],

	async existingRows() {
		return {};
	},

	async template(ctx) {
		const year = await requireYear(ctx);
		const { classes, classCourses, exams, students } = await loadYear(
			ctx.institutionId,
			year.id,
		);
		const examIds = exams.map((e) => e.id);
		const grades = examIds.length
			? await db.query.grades.findMany({
					where: inArray(schema.grades.exam, examIds),
				})
			: [];
		const score = new Map(
			grades.map((g) => [`${g.student}|${g.exam}`, Number(g.score)]),
		);
		const wb = new ExcelJS.Workbook();
		const headerStyle = (row: ExcelJS.Row) => {
			row.font = { bold: true, color: { argb: "FFFFFFFF" } };
			row.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FF1E40AF" },
			};
		};
		for (const klass of classes) {
			const courses = classCourses
				.filter((cc) => cc.classId === klass.id)
				.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
			const columns = courses.flatMap((cc) =>
				examsOf(exams, cc.id).map((exam) => ({ cc, exam })),
			);
			const ws = wb.addWorksheet(klass.code.slice(0, 31), {
				views: [{ state: "frozen", xSplit: 3, ySplit: 1 }],
			});
			ws.columns = [
				{ header: "Matricule", width: 16 },
				{ header: "Nom", width: 20 },
				{ header: "Prénom", width: 20 },
				...columns.map(({ cc, exam }) => ({
					header: examHeader(cc.courseCode, exam.type),
					width: 14,
				})),
			];
			headerStyle(ws.getRow(1));
			columns.forEach(({ cc, exam }, index) => {
				ws
					.getRow(1)
					.getCell(
						index + 4,
					).note = `${cc.courseName} — ${exam.type} (${Number(exam.percentage)} %)`;
			});
			for (const student of students
				.filter((s) => s.classId === klass.id)
				.sort((a, b) => a.lastName.localeCompare(b.lastName)))
				ws.addRow([
					student.registrationNumber,
					student.lastName,
					student.firstName,
					...columns.map(
						({ exam }) => score.get(`${student.id}|${exam.id}`) ?? null,
					),
				]);
		}
		const long = wb.addWorksheet(LONG);
		long.columns = [
			{ header: "Matricule", width: 16 },
			{ header: "Code classe", width: 14 },
			{ header: "Code EC", width: 14 },
			{ header: "Type d'examen", width: 16 },
			{ header: "Note", width: 8 },
		];
		headerStyle(long.getRow(1));
		const out = await wb.xlsx.writeBuffer();
		return Buffer.from(out as ArrayBuffer);
	},

	/** One SheetRow per grade cell: { registrationNumber, classCode, courseCode, type, score, column }. */
	async read(buffer, ctx) {
		const year = await requireYear(ctx);
		const { classes } = await loadYear(ctx.institutionId, year.id);
		const classByCode = new Map(classes.map((c) => [c.code, c]));
		const wb = new ExcelJS.Workbook();
		await wb.xlsx.load(buffer as unknown as ArrayBuffer);
		const rows: Record<string, SheetRow[]> = {};
		const issues: ImportIssue[] = [];
		for (const ws of wb.worksheets) {
			if (ws.state !== "visible") continue;
			const headers = new Map<number, string>();
			ws.getRow(1).eachCell((cell, index) => {
				headers.set(index, cellText(cell));
			});
			const findColumn = (names: string[]) =>
				[...headers].find(([, h]) => names.includes(normalize(h)))?.[0];
			const regColumn = findColumn(REG_HEADERS);
			const isLong = normalize(ws.name) === normalize(LONG);
			const klass = classByCode.get(normalizeCode(ws.name));
			if (!isLong && !klass) {
				issues.push({
					sheet: ws.name,
					row: 0,
					level: "warning",
					code: "sheetNotAClass",
					params: { sheet: ws.name, year: year.name },
					message: `Sheet "${ws.name}" is not a class of ${year.name}: ignored.`,
				});
				continue;
			}
			if (!regColumn) {
				issues.push({
					sheet: ws.name,
					row: 1,
					column: "Matricule",
					level: "error",
					code: "missingColumn",
					params: { column: "Matricule" },
					message: 'Required column "Matricule" not found in the header.',
				});
				continue;
			}
			rows[ws.name] = [];
			if (isLong) {
				const index = Object.fromEntries(
					Object.entries(LONG_HEADERS).map(([key, names]) => [
						key,
						findColumn(names),
					]),
				);
				ws.eachRow((row, rowNumber) => {
					if (rowNumber === 1) return;
					const values = Object.fromEntries(
						Object.entries(index).map(([key, col]) => [
							key,
							col ? cellText(row.getCell(col)) : "",
						]),
					);
					if (!values.registrationNumber && !values.score) return;
					rows[ws.name].push({
						row: rowNumber,
						values: { ...values, column: "Note" },
					});
				});
				continue;
			}
			const examColumns = [...headers]
				.filter(([index]) => index !== regColumn)
				.map(([index, header]) => ({
					index,
					header,
					parts: splitHeader(header),
				}))
				.filter((c) => c.parts);
			ws.eachRow((row, rowNumber) => {
				if (rowNumber === 1) return;
				const reg = cellText(row.getCell(regColumn));
				for (const col of examColumns) {
					const value = cellText(row.getCell(col.index));
					if (!value) continue;
					rows[ws.name].push({
						row: rowNumber,
						values: {
							registrationNumber: reg,
							classCode: klass!.code,
							courseCode: col.parts!.course,
							type: col.parts!.type,
							score: value,
							column: col.header,
						},
					});
				}
			});
		}
		return { rows, issues };
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const { classes, classCourses, exams, students, courseEnrollments } =
			await loadYear(ctx.institutionId, year.id);
		const classByCode = new Map(classes.map((c) => [c.code, c]));
		const studentByReg = new Map(
			students.map((s) => [
				`${s.classId}|${s.registrationNumber.trim().toUpperCase()}`,
				s,
			]),
		);
		const examIds = exams.map((e) => e.id);
		const existing = examIds.length
			? await db.query.grades.findMany({
					where: inArray(schema.grades.exam, examIds),
				})
			: [];
		const current = new Map(
			existing.map((g) => [`${g.student}|${g.exam}`, Number(g.score)]),
		);
		const issues: ImportIssue[] = [];
		const sheets: SheetSummary[] = [];
		const writes = new Map<
			string,
			{ studentId: string; examId: string; score: number }
		>();
		let absences = 0;
		const changes: RowChange[] = [];

		for (const [sheet, sheetRows] of Object.entries(rows)) {
			const summary: SheetSummary = {
				sheet,
				create: 0,
				update: 0,
				unchanged: 0,
				skipped: 0,
			};
			const error = (
				r: SheetRow,
				code: string,
				params: Record<string, string | number>,
				message: string,
			) => {
				summary.skipped++;
				issues.push({
					sheet,
					row: r.row,
					column: r.values.column,
					level: "error",
					code,
					params,
					message,
				});
			};
			for (const r of sheetRows) {
				const v = r.values;
				const klass = classByCode.get(normalizeCode(v.classCode ?? ""));
				if (!klass) {
					error(
						r,
						"unknownClass",
						{ value: v.classCode, year: year.name },
						`Class ${v.classCode} unknown for ${year.name}.`,
					);
					continue;
				}
				const cc = classCourses.find(
					(c) =>
						c.classId === klass.id &&
						normalize(c.courseCode) === normalize(v.courseCode ?? ""),
				);
				if (!cc) {
					error(
						r,
						"unknownClassCourse",
						{ class: klass.code, course: v.courseCode },
						`Course ${v.courseCode} is not taught in class ${klass.code}.`,
					);
					continue;
				}
				const exam = exams.find(
					(e) =>
						e.classCourse === cc.id &&
						normalize(e.type) === normalize(v.type ?? ""),
				);
				if (!exam) {
					error(
						r,
						"unknownExam",
						{ course: cc.courseCode, value: v.type },
						`Course ${cc.courseCode} has no "${v.type}" exam: add it at the Exams step.`,
					);
					continue;
				}
				const student = studentByReg.get(
					`${klass.id}|${(v.registrationNumber ?? "").trim().toUpperCase()}`,
				);
				if (!student) {
					error(
						r,
						"studentNotInClass",
						{ value: v.registrationNumber, class: klass.code },
						`No student ${v.registrationNumber} enrolled in ${klass.code} this year.`,
					);
					continue;
				}
				if (!courseEnrollments.has(`${student.id}|${cc.id}`)) {
					error(
						r,
						"notEnrolledInCourse",
						{ value: v.registrationNumber, course: cc.courseCode },
						`${v.registrationNumber} is not enrolled in ${cc.courseCode}.`,
					);
					continue;
				}
				if (exam.isLocked) {
					error(
						r,
						"examLocked",
						{ course: cc.courseCode, type: exam.type },
						`The ${exam.type} exam of ${cc.courseCode} is locked.`,
					);
					continue;
				}
				const raw = (v.score ?? "").trim();
				let score: number;
				if (ABSENT.has(normalize(raw))) {
					score = 0;
					absences++;
				} else {
					score = Number(raw.replace(",", "."));
					if (!/^\d+([.,]\d+)?$/.test(raw) || score > MAX_SCORE) {
						error(
							r,
							"invalidScore",
							{ value: raw, max: MAX_SCORE },
							`"${raw}" is not a grade between 0 and ${MAX_SCORE} (or ABS).`,
						);
						continue;
					}
				}
				const key = `${student.id}|${exam.id}`;
				if (writes.has(key)) {
					error(
						r,
						"duplicateGrade",
						{ value: v.registrationNumber, type: exam.type },
						"This grade is given twice in the file.",
					);
					continue;
				}
				const before = current.get(key);
				if (before === undefined) summary.create++;
				else if (before !== score) summary.update++;
				else {
					summary.unchanged++;
					continue;
				}
				writes.set(key, { studentId: student.id, examId: exam.id, score });
				changes.push({
					sheet,
					row: r.row,
					action: before === undefined ? "create" : "update",
					label: `${student.registrationNumber} ${student.lastName} — ${cc.courseCode} | ${exam.type}`,
					before: before === undefined ? undefined : { Note: String(before) },
					after: { Note: String(score) },
				});
			}
			sheets.push(summary);
		}
		if (absences)
			issues.push({
				sheet: "",
				row: 0,
				level: "warning",
				code: "absencesAsZero",
				params: { count: absences },
				message: `${absences} absence(s) (ABS) recorded as 0.`,
			});

		return {
			sheets,
			issues,
			changes,
			async apply(log) {
				const list = [...writes.values()];
				for (let i = 0; i < list.length; i += 500) {
					await db
						.insert(schema.grades)
						.values(
							list.slice(i, i + 500).map((w) => ({
								student: w.studentId,
								exam: w.examId,
								score: w.score.toFixed(2),
							})),
						)
						.onConflictDoUpdate({
							target: [schema.grades.student, schema.grades.exam],
							set: {
								score: sql`excluded.score`,
								updatedAt: new Date(),
							},
						});
					await log(
						`Grades: ${Math.min(i + 500, list.length)}/${list.length} saved.`,
					);
				}
				// One credit recompute per student, not one per grade
				const studentIds = [...new Set(list.map((w) => w.studentId))];
				for (const studentId of studentIds)
					await recomputeForStudent(studentId, year.id);
				await log(`Credits recomputed for ${studentIds.length} student(s).`);
			},
		};
	},
};
