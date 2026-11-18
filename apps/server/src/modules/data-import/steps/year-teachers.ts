import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { teachersByEmail } from "./foundation-curriculum";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { diff, findDuplicates, normalize, validRows } from "./workbook";
import { requireYear } from "./year-context";

const TEACHERS = "Enseignants";
const GENDERS: Record<string, schema.Gender> = {
	m: "male",
	h: "male",
	masculin: "male",
	male: "male",
	f: "female",
	feminin: "female",
	female: "female",
};

/** Teacher profiles of the institution (with or without account). */
async function loadTeachers(institutionId: string) {
	const ids = [...(await teachersByEmail(institutionId)).values()];
	const withoutEmail = await db
		.select({ id: schema.domainUsers.id })
		.from(schema.domainUsers)
		.leftJoin(
			schema.students,
			eq(schema.students.domainUserId, schema.domainUsers.id),
		)
		.where(
			and(
				eq(schema.domainUsers.institutionId, institutionId),
				eq(schema.domainUsers.primaryEmail, ""),
				isNull(schema.students.id),
			),
		);
	const all = [...new Set([...ids, ...withoutEmail.map((r) => r.id)])];
	return all.length
		? db.query.domainUsers.findMany({
				where: inArray(schema.domainUsers.id, all),
			})
		: [];
}

/**
 * Teachers, created as profiles without account (an account can be given
 * later from the users page). Found again by email, else by name. Optional:
 * a course without teacher keeps a placeholder until one is given.
 */
export const teachersStep: ImportStepDef = {
	key: "year.teachers",
	label: "Enseignants",
	scope: "year",
	sheets: [
		{
			name: TEACHERS,
			description:
				"Facultatif : un enseignant par ligne. Il est retrouvé par son e-mail, sinon par ses nom et prénom ; il est créé sans compte (un compte peut lui être donné ensuite).",
			columns: [
				{
					key: "lastName",
					header: "Nom",
					required: true,
					width: 22,
					aliases: ["Noms", "Last name"],
				},
				{
					key: "firstName",
					header: "Prénom",
					required: true,
					width: 22,
					aliases: ["Prénoms", "First name"],
				},
				{
					key: "email",
					header: "E-mail",
					type: "email",
					width: 28,
					aliases: ["Email", "Mail"],
				},
				{
					key: "phone",
					header: "Téléphone",
					aliases: ["Tel", "Tél.", "Phone"],
				},
				{ key: "gender", header: "Sexe", aliases: ["Genre", "Gender"] },
			],
		},
	],

	async existingRows(ctx) {
		const teachers = await loadTeachers(ctx.institutionId);
		const letter = { male: "M", female: "F", other: "" } as const;
		return {
			[TEACHERS]: teachers
				.filter((t) => !t.primaryEmail.endsWith(".invalid"))
				.sort((a, b) => a.lastName.localeCompare(b.lastName))
				.map((t) => [
					t.lastName,
					t.firstName,
					t.primaryEmail,
					t.phone ?? "",
					t.gender ? letter[t.gender] : "",
				]),
		};
	},

	async plan(rows, ctx) {
		await requireYear(ctx);
		const sheetRows = rows[TEACHERS];
		const issues: ImportIssue[] = [
			...findDuplicates(TEACHERS, sheetRows, (r) => r.values.email, "E-mail"),
		];
		const teachers = await loadTeachers(ctx.institutionId);
		const byEmail = new Map(
			teachers.map((t) => [t.primaryEmail.toLowerCase(), t]),
		);
		const nameKey = (last: string, first: string) =>
			`${normalize(last)}|${normalize(first)}`;
		const byName = new Map<string, schema.DomainUser[]>();
		for (const t of teachers) {
			const key = nameKey(t.lastName, t.firstName);
			byName.set(key, [...(byName.get(key) ?? []), t]);
		}

		type Change = {
			row: number;
			current?: schema.DomainUser;
			set: Record<string, string>;
		};
		const changes = new Map<number, Change>();
		for (const r of sheetRows) {
			if (r.invalid) continue;
			const v = r.values;
			const email = v.email?.trim().toLowerCase() || undefined;
			let current = email ? byEmail.get(email) : undefined;
			if (!current) {
				const homonyms = byName.get(nameKey(v.lastName, v.firstName)) ?? [];
				if (homonyms.length > 1) {
					issues.push({
						sheet: TEACHERS,
						row: r.row,
						column: "E-mail",
						level: "error",
						code: "ambiguousTeacher",
						params: { name: `${v.lastName} ${v.firstName}` },
						message: `Several teachers are named ${v.lastName} ${v.firstName}: give the email.`,
					});
					continue;
				}
				// Same name with another email: a different person
				if (homonyms[0] && (!email || !homonyms[0].primaryEmail))
					current = homonyms[0];
			}
			const gender = v.gender ? GENDERS[normalize(v.gender)] : undefined;
			const set = Object.fromEntries(
				Object.entries({
					lastName: v.lastName.trim(),
					firstName: v.firstName.trim(),
					primaryEmail: email,
					phone: v.phone || undefined,
					gender,
				}).filter(([, value]) => value !== undefined),
			) as Record<string, string>;
			changes.set(r.row, { row: r.row, current, set });
		}
		const valid = validRows(TEACHERS, sheetRows, issues)
			.map((r) => changes.get(r.row))
			.filter((c): c is Change => Boolean(c));
		const before = (t: schema.DomainUser) =>
			Object.fromEntries(
				Object.keys({
					lastName: 1,
					firstName: 1,
					primaryEmail: 1,
					phone: 1,
					gender: 1,
				}).map((k) => [k, String(t[k as keyof schema.DomainUser] ?? "")]),
			);
		const updates = valid.filter(
			(c) => c.current && Object.keys(diff(c.set, before(c.current))).length,
		);
		const summary: SheetSummary = {
			sheet: TEACHERS,
			create: valid.filter((c) => !c.current).length,
			update: updates.length,
			unchanged:
				valid.length - updates.length - valid.filter((c) => !c.current).length,
			skipped: sheetRows.length - valid.length,
		};

		return {
			sheets: [summary],
			issues,
			changes: [...valid.filter((c) => !c.current), ...updates].map((c) => ({
				sheet: TEACHERS,
				row: c.row,
				action: c.current ? ("update" as const) : ("create" as const),
				label: `${c.set.lastName} ${c.set.firstName}`,
				before: c.current ? diff(before(c.current), c.set) : undefined,
				after: c.current ? diff(c.set, before(c.current)) : c.set,
			})),
			async apply(log, journal) {
				for (const change of valid) {
					if (!change.current) {
						const [created] = await db
							.insert(schema.domainUsers)
							.values({
								firstName: change.set.firstName,
								lastName: change.set.lastName,
								primaryEmail: change.set.primaryEmail ?? "",
								phone: change.set.phone ?? null,
								gender: (change.set.gender as schema.Gender) ?? null,
								institutionId: ctx.institutionId,
							})
							.returning({ id: schema.domainUsers.id });
						journal.created("domainUsers", [created.id]);
						continue;
					}
					const set = diff(change.set, before(change.current));
					if (!Object.keys(set).length) continue;
					journal.updated(
						"domainUsers",
						change.current.id,
						change.current,
						set,
					);
					await db
						.update(schema.domainUsers)
						.set({ ...set, updatedAt: new Date() } as never)
						.where(eq(schema.domainUsers.id, change.current.id));
				}
				await log(
					`Teachers: ${summary.create} created, ${summary.update} updated.`,
				);
			},
		};
	},
};
