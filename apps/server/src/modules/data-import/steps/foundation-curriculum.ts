import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { member } from "@/db/schema/auth";
import { normalizeCode } from "@/lib/strings";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, normalize, validRows } from "./workbook";

/** Levels of the institution's cycles. */
async function loadLevels(institutionId: string) {
	const cycles = await db.query.studyCycles.findMany({
		where: eq(schema.studyCycles.institutionId, institutionId),
		with: { levels: true },
	});
	return cycles.flatMap((c) => c.levels);
}

const UNITS = "UE";
const COURSES = "EC";

/** Semester labels of the file ↔ stored values. */
const SEMESTERS = { S1: "fall", S2: "spring", Annuel: "annual" } as const;
const semesterLabel = (value: string) =>
	Object.entries(SEMESTERS).find(([, v]) => v === value)?.[0] ?? "Annuel";

/** Teachers of the institution, by lower-cased e-mail. */
export async function teachersByEmail(institutionId: string) {
	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
	});
	if (!institution?.organizationId) return new Map<string, string>();
	const rows = await db
		.select({
			id: schema.domainUsers.id,
			email: schema.domainUsers.primaryEmail,
		})
		.from(schema.domainUsers)
		.innerJoin(member, eq(member.id, schema.domainUsers.memberId))
		.where(eq(member.organizationId, institution.organizationId));
	return new Map(
		rows.filter((r) => r.email).map((r) => [r.email!.toLowerCase(), r.id]),
	);
}

async function loadCurriculum(institutionId: string) {
	const programs = await db.query.programs.findMany({
		where: eq(schema.programs.institutionId, institutionId),
	});
	const programIds = programs.map((p) => p.id);
	const [units, courses] = programIds.length
		? await Promise.all([
				db.query.teachingUnits.findMany({
					where: inArray(schema.teachingUnits.programId, programIds),
				}),
				db.query.courses.findMany({
					where: inArray(schema.courses.program, programIds),
				}),
			])
		: [[], []];
	return { programs, units, courses };
}

/** Teaching units (UE) and their courses (EC, éléments constitutifs). */
export const curriculumStep: ImportStepDef = {
	key: "foundation.curriculum",
	label: "UE & EC",
	sheets: [
		{
			name: UNITS,
			description: "Les unités d'enseignement de chaque programme.",
			columns: [
				{
					key: "programCode",
					header: "Code programme",
					required: true,
					listFrom: "programs",
				},
				{ key: "code", header: "Code UE", required: true, hint: "Ex. INF111" },
				{ key: "name", header: "Nom", required: true, width: 32 },
				{ key: "credits", header: "Crédits", required: true, type: "integer" },
				{
					key: "semester",
					header: "Semestre",
					required: true,
					enum: Object.keys(SEMESTERS),
				},
				{ key: "description", header: "Description", width: 28 },
				{
					key: "levelCode",
					header: "Code niveau",
					listFrom: "levels",
					hint: "Niveau où l'UE est enseignée (ex. L1) : ses EC sont proposés aux classes de ce niveau.",
					aliases: ["Niveau", "Level"],
				},
			],
		},
		{
			name: COURSES,
			description: "Les éléments constitutifs (matières) de chaque UE.",
			columns: [
				{
					key: "programCode",
					header: "Code programme",
					required: true,
					listFrom: "programs",
				},
				{ key: "unitCode", header: "Code UE", required: true },
				{
					key: "code",
					header: "Code EC",
					required: true,
					hint: "Ex. INF111-EC1",
				},
				{ key: "name", header: "Nom", required: true, width: 32 },
				{ key: "hours", header: "Heures", required: true, type: "integer" },
				{
					key: "coefficient",
					header: "Coefficient",
					type: "number",
					hint: "1 par défaut",
				},
				{
					key: "teacherEmail",
					header: "E-mail enseignant",
					type: "email",
					width: 28,
					hint: "Enseignant par défaut (compte existant)",
				},
			],
		},
	],

	async existingRows({ institutionId }) {
		const { programs, units, courses } = await loadCurriculum(institutionId);
		const teachers = await teachersByEmail(institutionId);
		const emailOf = new Map([...teachers].map(([email, id]) => [id, email]));
		const programCode = new Map(programs.map((p) => [p.id, p.code]));
		const unitCode = new Map(units.map((u) => [u.id, u.code]));
		const levelCode = new Map(
			(await loadLevels(institutionId)).map((l) => [l.id, l.code]),
		);
		const byProgram =
			<T extends { code: string }>(key: (x: T) => string) =>
			(a: T, b: T) =>
				key(a).localeCompare(key(b)) || a.code.localeCompare(b.code);
		return {
			[UNITS]: units
				.sort(byProgram((u) => programCode.get(u.programId) ?? ""))
				.map((u) => [
					programCode.get(u.programId) ?? "",
					u.code,
					u.name,
					String(u.credits),
					semesterLabel(u.semester),
					u.description ?? "",
					u.cycleLevelId ? (levelCode.get(u.cycleLevelId) ?? "") : "",
				]),
			[COURSES]: courses
				.sort(
					byProgram(
						(c) =>
							`${programCode.get(c.program)}|${unitCode.get(c.teachingUnitId)}`,
					),
				)
				.map((c) => [
					programCode.get(c.program) ?? "",
					unitCode.get(c.teachingUnitId) ?? "",
					c.code,
					c.name,
					String(c.hours),
					String(Number(c.defaultCoefficient)),
					c.defaultTeacher ? (emailOf.get(c.defaultTeacher) ?? "") : "",
				]),
		};
	},

	async lists({ institutionId }) {
		const programs = await db.query.programs.findMany({
			where: eq(schema.programs.institutionId, institutionId),
		});
		const levels = await loadLevels(institutionId);
		return {
			programs: programs.map((p) => p.code).sort(),
			levels: [...new Set(levels.map((l) => l.code))].sort(),
		};
	},

	async plan(rows, { institutionId }) {
		const issues: ImportIssue[] = [
			...findDuplicates(
				UNITS,
				rows[UNITS],
				(r) => `${r.values.programCode}|${r.values.code}`,
				"Code UE",
			),
			...findDuplicates(
				COURSES,
				rows[COURSES],
				(r) => `${r.values.programCode}|${r.values.code}`,
				"Code EC",
			),
		];
		const { programs, units, courses } = await loadCurriculum(institutionId);
		const teachers = await teachersByEmail(institutionId);
		const programByCode = new Map(programs.map((p) => [p.code, p]));
		const unknownProgram = (
			sheet: string,
			r: { row: number; values: Record<string, string> },
		) => {
			if (
				r.values.programCode &&
				!programByCode.has(normalizeCode(r.values.programCode))
			)
				issues.push({
					sheet,
					row: r.row,
					column: "Code programme",
					level: "error",
					message: `Programme « ${r.values.programCode} » inconnu : importez-le d'abord à l'étape « Programmes & options ».`,
				});
		};
		rows[UNITS].forEach((r) => unknownProgram(UNITS, r));
		rows[COURSES].forEach((r) => unknownProgram(COURSES, r));

		// Units
		const unitRows = validRows(UNITS, rows[UNITS], issues);
		const unitSummary: SheetSummary = {
			sheet: UNITS,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: rows[UNITS].length - unitRows.length,
		};
		const levels = await loadLevels(institutionId);
		for (const r of unitRows) {
			if (!r.values.levelCode) continue;
			const program = programByCode.get(normalizeCode(r.values.programCode))!;
			const level = levels.find(
				(l) =>
					l.cycleId === program.cycleId &&
					normalize(l.code) === normalize(r.values.levelCode),
			);
			if (!level)
				issues.push({
					sheet: UNITS,
					row: r.row,
					column: "Code niveau",
					level: "error",
					code: "unknownLevel",
					params: {
						value: r.values.levelCode,
						cycle: program.code,
						allowed: levels
							.filter((l) => l.cycleId === program.cycleId)
							.map((l) => l.code)
							.join(", "),
					},
					message: `Level "${r.values.levelCode}" is not a level of program ${program.code}.`,
				});
		}
		const leveledRows = validRows(UNITS, rows[UNITS], issues);
		unitSummary.skipped = rows[UNITS].length - leveledRows.length;
		const unitChanges = leveledRows.map((r) => {
			const program = programByCode.get(normalizeCode(r.values.programCode))!;
			const code = normalizeCode(r.values.code);
			const data = {
				name: r.values.name,
				credits: Number.parseInt(r.values.credits, 10),
				semester: SEMESTERS[r.values.semester as keyof typeof SEMESTERS],
				description: r.values.description || null,
				// An empty cell keeps the level already set
				cycleLevelId: r.values.levelCode
					? (levels.find(
							(l) =>
								l.cycleId === program.cycleId &&
								normalize(l.code) === normalize(r.values.levelCode),
						)?.id ?? null)
					: undefined,
			};
			const current = units.find(
				(u) => u.programId === program.id && u.code === code,
			);
			const changed =
				!current ||
				current.name !== data.name ||
				current.credits !== data.credits ||
				current.semester !== data.semester ||
				(current.description ?? null) !== data.description ||
				(data.cycleLevelId !== undefined &&
					current.cycleLevelId !== data.cycleLevelId);
			if (!current) unitSummary.create++;
			else if (changed) unitSummary.update++;
			else unitSummary.unchanged++;
			return { programId: program.id, code, data, id: current?.id, changed };
		});
		const knownUnits = new Set([
			...units.map((u) => `${u.programId}|${u.code}`),
			...unitChanges.map((u) => `${u.programId}|${u.code}`),
		]);

		// Courses
		for (const r of rows[COURSES]) {
			const program = programByCode.get(normalizeCode(r.values.programCode));
			if (
				program &&
				r.values.unitCode &&
				!knownUnits.has(`${program.id}|${normalizeCode(r.values.unitCode)}`)
			)
				issues.push({
					sheet: COURSES,
					row: r.row,
					column: "Code UE",
					level: "error",
					message: `UE « ${r.values.unitCode} » inconnue pour ce programme : ajoutez-la dans la feuille « ${UNITS} ».`,
				});
			if (
				r.values.teacherEmail &&
				!teachers.has(r.values.teacherEmail.toLowerCase())
			)
				issues.push({
					sheet: COURSES,
					row: r.row,
					column: "E-mail enseignant",
					level: "warning",
					message: `Aucun compte « ${r.values.teacherEmail} » : l'EC sera importé sans enseignant par défaut.`,
				});
		}
		const courseRows = validRows(COURSES, rows[COURSES], issues);
		const courseSummary: SheetSummary = {
			sheet: COURSES,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: rows[COURSES].length - courseRows.length,
		};
		const courseChanges = courseRows.map((r) => {
			const program = programByCode.get(normalizeCode(r.values.programCode))!;
			const code = normalizeCode(r.values.code);
			const unitKey = `${program.id}|${normalizeCode(r.values.unitCode)}`;
			const coefficient = r.values.coefficient
				? Number(r.values.coefficient.replace(",", "."))
				: 1;
			const data = {
				name: r.values.name,
				hours: Number.parseInt(r.values.hours, 10),
				defaultCoefficient: coefficient.toFixed(2),
				defaultTeacher: r.values.teacherEmail
					? (teachers.get(r.values.teacherEmail.toLowerCase()) ?? null)
					: null,
			};
			const current = courses.find(
				(c) => c.program === program.id && c.code === code,
			);
			const currentUnit = current
				? units.find((u) => u.id === current.teachingUnitId)
				: undefined;
			const changed =
				!current ||
				current.name !== data.name ||
				current.hours !== data.hours ||
				Number(current.defaultCoefficient) !== coefficient ||
				(current.defaultTeacher ?? null) !== data.defaultTeacher ||
				`${currentUnit?.programId}|${currentUnit?.code}` !== unitKey;
			if (!current) courseSummary.create++;
			else if (changed) courseSummary.update++;
			else courseSummary.unchanged++;
			return {
				programId: program.id,
				unitKey,
				code,
				data,
				id: current?.id,
				changed,
			};
		});

		return {
			sheets: [unitSummary, courseSummary],
			issues,
			async apply(log) {
				const unitIds = new Map(
					units.map((u) => [`${u.programId}|${u.code}`, u.id]),
				);
				for (const change of unitChanges) {
					if (!change.changed) continue;
					if (change.id)
						await db
							.update(schema.teachingUnits)
							.set(change.data)
							.where(eq(schema.teachingUnits.id, change.id));
					else {
						const [created] = await db
							.insert(schema.teachingUnits)
							.values({
								...change.data,
								code: change.code,
								programId: change.programId,
							})
							.returning({ id: schema.teachingUnits.id });
						unitIds.set(`${change.programId}|${change.code}`, created.id);
					}
				}
				await log(
					`UE : ${unitSummary.create} créée(s), ${unitSummary.update} mise(s) à jour.`,
				);
				for (const change of courseChanges) {
					if (!change.changed) continue;
					const teachingUnitId = unitIds.get(change.unitKey);
					if (!teachingUnitId) continue;
					if (change.id)
						await db
							.update(schema.courses)
							.set({ ...change.data, teachingUnitId })
							.where(eq(schema.courses.id, change.id));
					else
						await db
							.insert(schema.courses)
							.values({
								...change.data,
								code: change.code,
								program: change.programId,
								teachingUnitId,
							})
							.onConflictDoNothing();
				}
				await log(
					`EC : ${courseSummary.create} créé(s), ${courseSummary.update} mis à jour.`,
				);
			},
		};
	},
};
