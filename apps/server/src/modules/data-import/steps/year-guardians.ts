import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { normalize, validRows } from "./workbook";
import { requireYear } from "./year-context";

const GUARDIANS = "Parents";
const YES = new Set(["oui", "o", "yes", "y", "x", "1"]);
const RELATIONSHIPS: Record<string, schema.GuardianRelationshipType> = {
	mere: "mother",
	mother: "mother",
	pere: "father",
	father: "father",
	tuteur: "guardian",
	tutrice: "guardian",
	guardian: "guardian",
	oncle: "uncle",
	uncle: "uncle",
	tante: "aunt",
	aunt: "aunt",
	autre: "other",
	other: "other",
};
/** A guardian needs a unique email; one known by phone only gets a stand-in. */
const standInEmail = (phone: string) =>
	`phone-${phone.replace(/\D/g, "")}@guardians.invalid`;

/**
 * Parents and guardians of the students of the year, with their link to the
 * student. A guardian is found again by email (or phone); a student may have
 * several, and one guardian several students.
 */
export const guardiansStep: ImportStepDef = {
	key: "year.guardians",
	label: "Parents",
	scope: "year",
	sheets: [
		{
			name: GUARDIANS,
			description:
				"Facultatif : une ligne par lien parent ↔ étudiant. Un parent est retrouvé par son e-mail, sinon par son téléphone ; il faut l'un des deux.",
			columns: [
				{
					key: "registrationNumber",
					header: "Matricule",
					required: true,
					aliases: ["Matricule étudiant", "Registration number"],
				},
				{
					key: "lastName",
					header: "Nom du parent",
					required: true,
					width: 22,
					aliases: ["Nom", "Parent last name"],
				},
				{
					key: "firstName",
					header: "Prénom du parent",
					required: true,
					width: 22,
					aliases: ["Prénom", "Parent first name"],
				},
				{
					key: "relationship",
					header: "Lien",
					required: true,
					hint: "Père, Mère, Tuteur, Oncle, Tante, Autre",
					aliases: ["Lien de parenté", "Relationship"],
				},
				{
					key: "email",
					header: "E-mail",
					type: "email",
					width: 26,
					aliases: ["Email"],
				},
				{
					key: "phone",
					header: "Téléphone",
					aliases: ["Tel", "Tél.", "Phone"],
				},
				{
					key: "primary",
					header: "Contact principal",
					hint: "« oui » pour le parent à contacter en premier.",
					aliases: ["Principal", "Primary"],
				},
			],
		},
	],

	async existingRows() {
		return {};
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const sheetRows = rows[GUARDIANS];
		const issues: ImportIssue[] = [];
		const [guardians, students] = await Promise.all([
			db.query.guardians.findMany({
				where: eq(schema.guardians.institutionId, ctx.institutionId),
			}),
			db
				.select({
					id: schema.students.id,
					registrationNumber: schema.students.registrationNumber,
				})
				.from(schema.enrollments)
				.innerJoin(
					schema.students,
					eq(schema.students.id, schema.enrollments.studentId),
				)
				.where(
					and(
						eq(schema.enrollments.academicYearId, year.id),
						eq(schema.enrollments.institutionId, ctx.institutionId),
					),
				),
		]);
		const studentByReg = new Map(
			students.map((s) => [s.registrationNumber.trim().toUpperCase(), s.id]),
		);
		const links = students.length
			? await db.query.studentGuardians.findMany({
					where: inArray(
						schema.studentGuardians.studentId,
						students.map((s) => s.id),
					),
				})
			: [];
		const guardianByEmail = new Map(
			guardians.map((g) => [g.email.toLowerCase(), g]),
		);
		const error = (
			row: number,
			column: string,
			code: string,
			params: Record<string, string | number>,
			message: string,
		) =>
			issues.push({
				sheet: GUARDIANS,
				row,
				column,
				level: "error",
				code,
				params,
				message,
			});

		type Change = {
			row: number;
			email: string;
			guardian?: schema.Guardian;
			fields: { firstName: string; lastName: string; phone: string | null };
			studentId: string;
			relationshipType: schema.GuardianRelationshipType;
			isPrimary: boolean;
			linked: boolean;
		};
		const resolved = new Map<number, Change>();
		for (const r of sheetRows) {
			if (r.invalid) continue;
			const v = r.values;
			const studentId = studentByReg.get(
				v.registrationNumber.trim().toUpperCase(),
			);
			if (!studentId) {
				error(
					r.row,
					"Matricule",
					"studentNotInYear",
					{ value: v.registrationNumber, year: year.name },
					`No student ${v.registrationNumber} enrolled in ${year.name}.`,
				);
				continue;
			}
			const relationshipType = RELATIONSHIPS[normalize(v.relationship)];
			if (!relationshipType) {
				error(
					r.row,
					"Lien",
					"unknownRelationship",
					{ value: v.relationship },
					`"${v.relationship}" is not a known relationship.`,
				);
				continue;
			}
			const email =
				v.email?.trim().toLowerCase() || (v.phone ? standInEmail(v.phone) : "");
			if (!email) {
				error(
					r.row,
					"E-mail",
					"guardianContactMissing",
					{},
					"An email or a phone number is required.",
				);
				continue;
			}
			const guardian = guardianByEmail.get(email);
			resolved.set(r.row, {
				row: r.row,
				email,
				guardian,
				fields: {
					firstName: v.firstName.trim(),
					lastName: v.lastName.trim(),
					phone: v.phone || guardian?.phone || null,
				},
				studentId,
				relationshipType,
				isPrimary: YES.has(normalize(v.primary ?? "")),
				linked: links.some(
					(l) => l.studentId === studentId && l.guardianId === guardian?.id,
				),
			});
		}
		const changes = validRows(GUARDIANS, sheetRows, issues)
			.map((r) => resolved.get(r.row))
			.filter((c): c is Change => Boolean(c));
		const summary: SheetSummary = {
			sheet: GUARDIANS,
			create: changes.filter((c) => !c.linked).length,
			update: 0,
			unchanged: changes.filter((c) => c.linked).length,
			skipped: sheetRows.length - changes.length,
		};

		return {
			sheets: [summary],
			issues,
			changes: changes
				.filter((c) => !c.linked)
				.map((c) => ({
					sheet: GUARDIANS,
					row: c.row,
					action: "create" as const,
					label: `${c.fields.lastName} ${c.fields.firstName}`,
					after: { Lien: c.relationshipType, "E-mail": c.email },
				})),
			async apply(log, journal) {
				const ids = new Map(
					guardians.map((g) => [g.email.toLowerCase(), g.id]),
				);
				for (const change of changes) {
					if (change.linked) continue;
					let guardianId = ids.get(change.email);
					if (!guardianId) {
						const [created] = await db
							.insert(schema.guardians)
							.values({
								institutionId: ctx.institutionId,
								...change.fields,
								email: change.email,
								accessToken: `gdn_${randomBytes(24).toString("hex")}`,
							})
							.returning({ id: schema.guardians.id });
						guardianId = created.id;
						ids.set(change.email, guardianId);
						journal.created("guardians", [guardianId]);
					}
					const inserted = await db
						.insert(schema.studentGuardians)
						.values({
							institutionId: ctx.institutionId,
							studentId: change.studentId,
							guardianId,
							relationshipType: change.relationshipType,
							isPrimary: change.isPrimary,
						})
						.onConflictDoNothing()
						.returning({ id: schema.studentGuardians.id });
					journal.created(
						"studentGuardians",
						inserted.map((row) => row.id),
					);
				}
				await log(`Parents: ${summary.create} link(s) created.`);
			},
		};
	},
};
