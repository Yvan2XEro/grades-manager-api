import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import { transaction } from "@/modules/_shared/db-transaction";
import * as classesRepo from "@/modules/classes/classes.repo";
import * as registrationRepo from "@/modules/registration-numbers/registration-numbers.repo";
import { issueRegistrationNumber } from "@/modules/registration-numbers/registration-numbers.service";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, normalize, validRows } from "./workbook";
import { isPastYear, requireYear } from "./year-context";

const STUDENTS = "Étudiants";

type ProfileFields = {
	lastName: string;
	firstName: string;
	primaryEmail?: string;
	phone?: string;
	dateOfBirth?: string;
	placeOfBirth?: string;
	gender?: schema.Gender;
	nationality?: string;
};

const GENDERS: Record<string, schema.Gender> = {
	m: "male",
	h: "male",
	masculin: "male",
	homme: "male",
	male: "male",
	f: "female",
	feminin: "female",
	femme: "female",
	female: "female",
};

const regKey = (value: string) => value.trim().toUpperCase();
const nameKey = (last: string, first: string, birth?: string | null) =>
	`${normalize(last)}|${normalize(first)}|${birth ?? ""}`;

/** Students of the institution with their profile and their enrollment in the year. */
async function loadStudents(institutionId: string, academicYearId: string) {
	const students = await db.query.students.findMany({
		where: eq(schema.students.institutionId, institutionId),
		with: { profile: true },
	});
	const enrollments = await db.query.enrollments.findMany({
		where: and(
			eq(schema.enrollments.institutionId, institutionId),
			eq(schema.enrollments.academicYearId, academicYearId),
		),
	});
	// Prefer the open enrollment of the year, else the latest closed one
	const enrollmentOf = new Map<string, schema.Enrollment>();
	for (const e of enrollments) {
		const current = enrollmentOf.get(e.studentId);
		const open = (x: schema.Enrollment) =>
			x.status === "pending" || x.status === "active";
		if (
			!current ||
			(open(e) && !open(current)) ||
			(open(e) === open(current) && e.enrolledAt > current.enrolledAt)
		)
			enrollmentOf.set(e.studentId, e);
	}
	return { students, enrollmentOf };
}

type StudentRecord = Awaited<
	ReturnType<typeof loadStudents>
>["students"][number];

/** Students of an academic year: identity and class of the year (enrollment). */
export const studentsStep: ImportStepDef = {
	key: "year.students",
	label: "Étudiants & inscriptions",
	scope: "year",
	sheets: [
		{
			name: STUDENTS,
			description:
				"Un étudiant par ligne, avec sa classe de l'année. Un étudiant déjà connu est retrouvé par son matricule, son e-mail ou ses nom, prénom et date de naissance.",
			columns: [
				{
					key: "registrationNumber",
					header: "Matricule",
					hint: "Vide : généré selon le format de matricule de l'institution.",
					aliases: [
						"N° matricule",
						"No matricule",
						"Numéro matricule",
						"Mat.",
						"Registration number",
					],
				},
				{
					key: "lastName",
					header: "Nom",
					required: true,
					width: 24,
					aliases: ["Noms", "Last name", "Surname"],
				},
				{
					key: "firstName",
					header: "Prénom",
					required: true,
					width: 24,
					aliases: ["Prénoms", "First name"],
				},
				{
					key: "dateOfBirth",
					header: "Date de naissance",
					type: "date",
					hint: "jj/mm/aaaa",
					aliases: ["Né le", "Date naissance", "Date of birth", "Birth date"],
				},
				{
					key: "placeOfBirth",
					header: "Lieu de naissance",
					width: 20,
					aliases: ["Né à", "Place of birth"],
				},
				{
					key: "gender",
					header: "Sexe",
					hint: "M ou F",
					aliases: ["Genre", "Gender", "Sex"],
				},
				{
					key: "email",
					header: "E-mail",
					type: "email",
					width: 28,
					aliases: ["Email", "Mail", "Adresse e-mail"],
				},
				{
					key: "phone",
					header: "Téléphone",
					aliases: ["Tel", "Tél.", "Phone", "Contact"],
				},
				{
					key: "nationality",
					header: "Nationalité",
					aliases: ["Nationality"],
				},
				{
					key: "classCode",
					header: "Code classe",
					required: true,
					listFrom: "classes",
					hint: "Classe de l'étudiant pour l'année importée.",
					aliases: ["Classe", "Class", "Class code"],
				},
			],
		},
	],

	async existingRows(ctx) {
		const year = await requireYear(ctx);
		const [{ students, enrollmentOf }, classes] = await Promise.all([
			loadStudents(ctx.institutionId, year.id),
			db.query.classes.findMany({
				where: eq(schema.classes.academicYear, year.id),
			}),
		]);
		const classCode = new Map(classes.map((c) => [c.id, c.code]));
		const genderLetter = { male: "M", female: "F", other: "" } as const;
		return {
			[STUDENTS]: students
				.filter((s) => enrollmentOf.has(s.id))
				.map((s) => ({
					s,
					code: classCode.get(enrollmentOf.get(s.id)!.classId),
				}))
				.sort(
					(a, b) =>
						(a.code ?? "").localeCompare(b.code ?? "") ||
						a.s.profile.lastName.localeCompare(b.s.profile.lastName),
				)
				.map(({ s, code }) => [
					s.registrationNumber,
					s.profile.lastName,
					s.profile.firstName,
					s.profile.dateOfBirth ?? "",
					s.profile.placeOfBirth ?? "",
					s.profile.gender ? genderLetter[s.profile.gender] : "",
					s.profile.primaryEmail ?? "",
					s.profile.phone ?? "",
					s.profile.nationality ?? "",
					code ?? "",
				]),
		};
	},

	async lists(ctx) {
		const year = await requireYear(ctx);
		const classes = await db.query.classes.findMany({
			where: eq(schema.classes.academicYear, year.id),
		});
		return { classes: classes.map((c) => c.code).sort() };
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const sheetRows = rows[STUDENTS];
		const issues: ImportIssue[] = [
			...findDuplicates(
				STUDENTS,
				sheetRows,
				(r) => r.values.registrationNumber,
				"Matricule",
			),
			...findDuplicates(STUDENTS, sheetRows, (r) => r.values.email, "E-mail"),
		];
		const [{ students, enrollmentOf }, classes, format] = await Promise.all([
			loadStudents(ctx.institutionId, year.id),
			db.query.classes.findMany({
				where: and(
					eq(schema.classes.academicYear, year.id),
					eq(schema.classes.institutionId, ctx.institutionId),
				),
			}),
			registrationRepo.findActive(ctx.institutionId),
		]);
		const classByCode = new Map(classes.map((c) => [c.code, c]));
		const byReg = new Map(
			students.map((s) => [regKey(s.registrationNumber), s]),
		);
		const byEmail = new Map<string, StudentRecord[]>();
		const byName = new Map<string, StudentRecord[]>();
		for (const s of students) {
			const email = s.profile.primaryEmail?.trim().toLowerCase();
			if (email) byEmail.set(email, [...(byEmail.get(email) ?? []), s]);
			if (s.profile.dateOfBirth) {
				const key = nameKey(
					s.profile.lastName,
					s.profile.firstName,
					s.profile.dateOfBirth,
				);
				byName.set(key, [...(byName.get(key) ?? []), s]);
			}
		}
		// Start date of the year of each student's current class: the current
		// class only moves forward, never back to an older imported year
		const currentClassIds = [
			...new Set(students.map((s) => s.class).filter(Boolean)),
		];
		const currentClasses = currentClassIds.length
			? await db
					.select({
						id: schema.classes.id,
						startDate: schema.academicYears.startDate,
					})
					.from(schema.classes)
					.innerJoin(
						schema.academicYears,
						eq(schema.academicYears.id, schema.classes.academicYear),
					)
					.where(inArray(schema.classes.id, currentClassIds))
			: [];
		const classStart = new Map(
			currentClasses.map((c) => [c.id, new Date(c.startDate).getTime()]),
		);
		const yearStart = new Date(year.startDate).getTime();

		const issue = (
			row: number,
			column: string,
			level: "error" | "warning",
			code: string,
			params: Record<string, string | number>,
			message: string,
		) =>
			issues.push({
				sheet: STUDENTS,
				row,
				column,
				level,
				code,
				params,
				message,
			});
		const describe = (s: StudentRecord) =>
			`${s.registrationNumber} ${s.profile.lastName} ${s.profile.firstName}`;

		type Change = {
			row: number;
			student?: StudentRecord;
			registrationNumber?: string;
			profile: ProfileFields;
			profileChanged: boolean;
			classId: string;
			enrollment?: schema.Enrollment;
			enrollmentChanged: boolean;
			moveCurrentClass: boolean;
		};
		const resolved = new Map<number, Change>();

		for (const r of sheetRows) {
			if (r.invalid) continue;
			const v = r.values;
			const klass = classByCode.get(normalizeCode(v.classCode));
			if (!klass) {
				issue(
					r.row,
					"Code classe",
					"error",
					"unknownClass",
					{ value: v.classCode, year: year.name },
					`Class ${v.classCode} unknown for ${year.name}: import it at the Classes step.`,
				);
				continue;
			}
			let gender: schema.Gender | undefined;
			if (v.gender) {
				gender = GENDERS[normalize(v.gender)];
				if (!gender)
					issue(
						r.row,
						"Sexe",
						"warning",
						"unknownGender",
						{ value: v.gender },
						`"${v.gender}" is not M or F: left empty.`,
					);
			}
			const email = v.email?.trim().toLowerCase() || undefined;

			// Find the person: registration number, then email, then name + birth date
			let student: StudentRecord | undefined;
			const reg = v.registrationNumber ? regKey(v.registrationNumber) : "";
			if (reg) student = byReg.get(reg);
			if (!student) {
				const candidates =
					(email && byEmail.get(email)) ||
					(v.dateOfBirth &&
						byName.get(nameKey(v.lastName, v.firstName, v.dateOfBirth))) ||
					[];
				if (candidates.length > 1) {
					issue(
						r.row,
						"Matricule",
						"error",
						"ambiguousStudent",
						{ candidates: candidates.map(describe).join(" ; ") },
						`Several known students match this row: ${candidates.map(describe).join("; ")}. Give the registration number.`,
					);
					continue;
				}
				const [match] = candidates;
				if (match && reg && regKey(match.registrationNumber) !== reg) {
					issue(
						r.row,
						"Matricule",
						"error",
						"registrationMismatch",
						{ value: v.registrationNumber, student: describe(match) },
						`This person is already known as ${describe(match)}: registration number ${v.registrationNumber} does not match.`,
					);
					continue;
				}
				student = match;
			}
			if (!student && !reg && !format) {
				issue(
					r.row,
					"Matricule",
					"error",
					"noRegistrationFormat",
					{},
					"No registration number given and no active registration number format to generate one.",
				);
				continue;
			}

			const profile: ProfileFields = {
				lastName: v.lastName.trim(),
				firstName: v.firstName.trim(),
				primaryEmail: email,
				phone: v.phone || undefined,
				dateOfBirth: v.dateOfBirth || undefined,
				placeOfBirth: v.placeOfBirth || undefined,
				gender,
				nationality: v.nationality || undefined,
			};
			// An empty cell never erases what is already known
			const profileChanged =
				!student ||
				(Object.keys(profile) as (keyof ProfileFields)[]).some(
					(key) =>
						profile[key] !== undefined &&
						(student.profile[key] ?? undefined) !== profile[key],
				);
			const enrollment = student ? enrollmentOf.get(student.id) : undefined;
			const moveCurrentClass =
				!student ||
				(student.class !== klass.id &&
					(!student.class ||
						yearStart >= (classStart.get(student.class) ?? 0)));
			resolved.set(r.row, {
				row: r.row,
				student,
				registrationNumber: reg ? v.registrationNumber.trim() : undefined,
				profile,
				profileChanged,
				classId: klass.id,
				enrollment,
				enrollmentChanged: !enrollment || enrollment.classId !== klass.id,
				moveCurrentClass,
			});
		}

		const valid = validRows(STUDENTS, sheetRows, issues);
		const changes = valid
			.map((r) => resolved.get(r.row))
			.filter((c): c is Change => Boolean(c));
		const isChanged = (c: Change) =>
			c.profileChanged || c.enrollmentChanged || c.moveCurrentClass;
		const summary: SheetSummary = {
			sheet: STUDENTS,
			create: changes.filter((c) => !c.student).length,
			update: changes.filter((c) => c.student && isChanged(c)).length,
			unchanged: changes.filter((c) => c.student && !isChanged(c)).length,
			skipped: sheetRows.length - changes.length,
		};
		const enrollmentStatus: schema.EnrollmentStatus = isPastYear(year)
			? "completed"
			: "active";

		return {
			sheets: [summary],
			issues,
			async apply(log) {
				const klassRecords = new Map<string, classesRepo.KlassRecord>();
				const klassRecord = async (id: string) => {
					let record = klassRecords.get(id);
					if (!record) {
						record = await classesRepo.findById(id, ctx.institutionId);
						if (!record) throw new Error(`Class ${id} not found`);
						klassRecords.set(id, record);
					}
					return record;
				};
				let done = 0;
				for (const change of changes) {
					if (!isChanged(change) && change.student) continue;
					// Loaded before the transaction: inside it, only `tx` may query
					const klass =
						change.student || change.registrationNumber
							? undefined
							: await klassRecord(change.classId);
					await transaction(async (tx) => {
						let studentId = change.student?.id;
						if (!change.student) {
							const registrationNumber =
								change.registrationNumber ??
								(await issueRegistrationNumber({
									// biome-ignore lint/style/noNonNullAssertion: loaded above when no number is given
									klass: klass!,
									profile: {
										firstName: change.profile.firstName,
										lastName: change.profile.lastName,
										nationality: change.profile.nationality,
									},
									tx,
								}));
							const [profile] = await tx
								.insert(schema.domainUsers)
								.values({
									...change.profile,
									primaryEmail: change.profile.primaryEmail ?? "",
									institutionId: ctx.institutionId,
								})
								.returning();
							const [created] = await tx
								.insert(schema.students)
								.values({
									registrationNumber,
									domainUserId: profile.id,
									class: change.classId,
									institutionId: ctx.institutionId,
								})
								.returning();
							studentId = created.id;
						} else {
							if (change.profileChanged) {
								const set = Object.fromEntries(
									Object.entries(change.profile).filter(
										([, value]) => value !== undefined,
									),
								);
								await tx
									.update(schema.domainUsers)
									.set({ ...set, updatedAt: new Date() })
									.where(
										eq(schema.domainUsers.id, change.student.domainUserId),
									);
							}
							if (change.moveCurrentClass)
								await tx
									.update(schema.students)
									.set({ class: change.classId })
									.where(eq(schema.students.id, change.student.id));
						}
						if (!studentId) return;
						if (change.enrollment) {
							if (change.enrollmentChanged)
								await tx
									.update(schema.enrollments)
									.set({ classId: change.classId })
									.where(eq(schema.enrollments.id, change.enrollment.id));
						} else
							await tx.insert(schema.enrollments).values({
								studentId,
								classId: change.classId,
								academicYearId: year.id,
								institutionId: ctx.institutionId,
								status: enrollmentStatus,
								enrolledAt: new Date(year.startDate),
								exitedAt:
									enrollmentStatus === "completed"
										? new Date(year.endDate)
										: null,
							});
					});
					done++;
					if (done % 200 === 0)
						await log(`Students: ${done}/${changes.length} processed.`);
				}
				await log(
					`Students: ${summary.create} created, ${summary.update} updated.`,
				);
			},
		};
	},
};
