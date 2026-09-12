import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { enrollments as enrollmentsTable, termAverages } from "../../db/schema";
import { conflict, notFound } from "../../lib/errors";
import * as repo from "./class-councils.repo";

export async function list(
	institutionId: string,
	classId?: string,
	termId?: string,
	status?: string,
	opts: { page?: number; pageSize?: number } = {},
) {
	const { items, total } = await repo.findAll(
		institutionId,
		classId,
		termId,
		status,
		opts,
	);
	return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 25 };
}

export async function getCouncil(id: string, institutionId: string) {
	const council = await repo.findById(id, institutionId);
	if (!council) throw notFound("COUNCIL_NOT_FOUND");
	return council;
}

export async function createCouncil(
	data: {
		classId: string;
		termId: string;
		status?: string;
		presidentId?: string;
		secretaryId?: string;
		scheduledAt?: string;
	},
	institutionId: string,
) {
	// Check if a council already exists for this class and term
	const existing = await repo.findByClassAndTerm(
		data.classId,
		data.termId,
		institutionId,
	);
	if (existing) {
		throw conflict("COUNCIL_ALREADY_EXISTS");
	}

	return repo.insert({
		institutionId,
		classId: data.classId,
		termId: data.termId,
		status: data.status ?? "draft",
		presidentId: data.presidentId,
		secretaryId: data.secretaryId,
		scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
	});
}

export async function updateCouncil(
	id: string,
	institutionId: string,
	data: {
		status?: string;
		presidentId?: string;
		secretaryId?: string;
		scheduledAt?: string;
		heldAt?: string;
		pvPath?: string;
		globalNote?: string;
	},
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("COUNCIL_NOT_FOUND");

	const updateData: Record<string, unknown> = {};
	if (data.status !== undefined) updateData.status = data.status;
	if (data.presidentId !== undefined) updateData.presidentId = data.presidentId;
	if (data.secretaryId !== undefined) updateData.secretaryId = data.secretaryId;
	if (data.scheduledAt !== undefined) {
		updateData.scheduledAt = data.scheduledAt
			? new Date(data.scheduledAt)
			: null;
	}
	if (data.heldAt !== undefined) {
		updateData.heldAt = data.heldAt ? new Date(data.heldAt) : null;
	}
	if (data.pvPath !== undefined) updateData.pvPath = data.pvPath;
	if (data.globalNote !== undefined) updateData.globalNote = data.globalNote;

	const updated = await repo.update(id, institutionId, updateData as any);
	return updated!;
}

// ─── Council Decisions ───────────────────────────────────────────────

export async function listDecisions(councilId: string, institutionId: string) {
	// Verify council exists
	const council = await repo.findById(councilId, institutionId);
	if (!council) throw notFound("COUNCIL_NOT_FOUND");

	return repo.findAllDecisions(councilId, institutionId);
}

export async function addDecision(
	data: {
		councilId: string;
		enrollmentId: string;
		decision: string;
		note?: string;
	},
	institutionId: string,
) {
	// Verify council exists
	const council = await repo.findById(data.councilId, institutionId);
	if (!council) throw notFound("COUNCIL_NOT_FOUND");

	// Check if decision already exists for this enrollment
	const existing = await repo.findDecisionByCouncilAndEnrollment(
		data.councilId,
		data.enrollmentId,
		institutionId,
	);
	if (existing) {
		throw conflict("COUNCIL_DECISION_EXISTS");
	}

	return repo.insertDecision({
		institutionId,
		councilId: data.councilId,
		enrollmentId: data.enrollmentId,
		decision: data.decision,
		note: data.note,
	});
}

export async function updateDecision(
	id: string,
	institutionId: string,
	data: {
		decision?: string;
		note?: string;
	},
) {
	const existing = await repo.findDecisionById(id, institutionId);
	if (!existing) throw notFound("COUNCIL_DECISION_NOT_FOUND");

	const updateData: Record<string, unknown> = {};
	if (data.decision !== undefined) updateData.decision = data.decision;
	if (data.note !== undefined) updateData.note = data.note;

	const updated = await repo.updateDecision(
		id,
		institutionId,
		updateData as any,
	);
	return updated!;
}

export async function autoAssignDecisions(
	councilId: string,
	institutionId: string,
	thresholds: { min: number; decision: string }[],
	overwrite: boolean,
) {
	const council = await repo.findById(councilId, institutionId);
	if (!council) throw notFound("COUNCIL_NOT_FOUND");

	const avgs = await db
		.select({
			enrollmentId: termAverages.enrollmentId,
			weightedAverage: termAverages.weightedAverage,
		})
		.from(termAverages)
		.innerJoin(
			enrollmentsTable,
			eq(termAverages.enrollmentId, enrollmentsTable.id),
		)
		.where(
			and(
				eq(enrollmentsTable.classId, council.classId),
				eq(termAverages.termId, council.termId),
			),
		);

	const existingDecisions = await repo.findAllDecisions(
		councilId,
		institutionId,
	);

	type DecisionRow = Awaited<typeof existingDecisions>[number];
	const decidedMap = new Map<string, DecisionRow>(
		existingDecisions.map((d) => [d.decision.enrollmentId, d]),
	);

	const sorted = [...thresholds].sort((a, b) => b.min - a.min);

	let assigned = 0;
	for (const row of avgs) {
		if (!overwrite && decidedMap.has(row.enrollmentId)) continue;
		const avg = row.weightedAverage
			? Number.parseFloat(row.weightedAverage)
			: null;
		if (avg === null) continue;

		const match = sorted.find((t) => avg >= t.min);
		if (!match) continue;

		const existing = decidedMap.get(row.enrollmentId);
		if (existing) {
			await repo.updateDecision(existing.decision.id, institutionId, {
				decision: match.decision,
			});
		} else {
			await repo.insertDecision({
				institutionId,
				councilId,
				enrollmentId: row.enrollmentId,
				decision: match.decision,
			});
		}
		assigned++;
	}
	return { assigned };
}
