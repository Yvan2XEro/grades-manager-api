import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export type RosterRow = {
	id: string;
	studentId: string;
	studentName: string | null;
	studentRegistrationNumber: string | null;
	eligible: boolean;
	reason: string | null;
	exempted: boolean;
	lockedAt: Date | null;
};

export async function getRoster(
	examId: string,
	institutionId: string,
): Promise<RosterRow[]> {
	const rows = await db.query.examParticipationRosters.findMany({
		where: and(
			eq(schema.examParticipationRosters.examId, examId),
			eq(schema.examParticipationRosters.institutionId, institutionId),
		),
		with: {
			student: {
				columns: { id: true, registrationNumber: true },
				with: {
					profile: { columns: { firstName: true, lastName: true } },
				},
			},
		},
		orderBy: (t, { asc }) => [asc(t.studentId)],
	});

	return rows.map((r) => {
		const p = r.student?.profile;
		const studentName = p ? `${p.firstName} ${p.lastName}`.trim() : null;
		return {
			id: r.id,
			studentId: r.studentId,
			studentName,
			studentRegistrationNumber: r.student?.registrationNumber ?? null,
			eligible: r.eligible,
			reason: r.reason,
			exempted: r.exempted,
			lockedAt: r.lockedAt,
		};
	});
}

export async function isRosterLocked(
	examId: string,
	institutionId: string,
): Promise<boolean> {
	const row = await db.query.examParticipationRosters.findFirst({
		where: and(
			eq(schema.examParticipationRosters.examId, examId),
			eq(schema.examParticipationRosters.institutionId, institutionId),
		),
		columns: { lockedAt: true },
	});
	// No roster → not locked
	if (!row) return false;
	return row.lockedAt !== null;
}

export async function rosterExists(
	examId: string,
	institutionId: string,
): Promise<boolean> {
	const row = await db.query.examParticipationRosters.findFirst({
		where: and(
			eq(schema.examParticipationRosters.examId, examId),
			eq(schema.examParticipationRosters.institutionId, institutionId),
		),
		columns: { id: true },
	});
	return !!row;
}

export type UpsertRosterRow = {
	examId: string;
	studentId: string;
	institutionId: string;
	eligible: boolean;
	reason: string | null;
	exempted: boolean;
};

export async function upsertRosterRows(rows: UpsertRosterRow[]) {
	if (rows.length === 0) return;
	await db
		.insert(schema.examParticipationRosters)
		.values(
			rows.map((r) => ({
				...r,
				lockedAt: null,
				lockedBy: null,
			})),
		)
		.onConflictDoUpdate({
			target: [
				schema.examParticipationRosters.examId,
				schema.examParticipationRosters.studentId,
			],
			set: {
				eligible: sql`excluded.eligible`,
				reason: sql`excluded.reason`,
				exempted: sql`excluded.exempted`,
				lockedAt: null,
				lockedBy: null,
				updatedAt: sql`now()`,
			},
		});
}

export async function lockRosterRows(
	examId: string,
	institutionId: string,
	actorId: string | null,
) {
	const now = new Date();
	await db
		.update(schema.examParticipationRosters)
		.set({ lockedAt: now, lockedBy: actorId, updatedAt: now })
		.where(
			and(
				eq(schema.examParticipationRosters.examId, examId),
				eq(schema.examParticipationRosters.institutionId, institutionId),
				isNull(schema.examParticipationRosters.lockedAt),
			),
		);
}

export async function overrideRow(
	examId: string,
	studentId: string,
	institutionId: string,
	eligible: boolean,
	reason: string | null,
) {
	const [row] = await db
		.update(schema.examParticipationRosters)
		.set({ eligible, reason, updatedAt: new Date() })
		.where(
			and(
				eq(schema.examParticipationRosters.examId, examId),
				eq(schema.examParticipationRosters.studentId, studentId),
				eq(schema.examParticipationRosters.institutionId, institutionId),
				isNull(schema.examParticipationRosters.lockedAt),
			),
		)
		.returning({ id: schema.examParticipationRosters.id });
	return row ?? null;
}
