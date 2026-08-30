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
	if (!council) throw notFound("Class council not found");
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
		throw conflict("A council already exists for this class and term");
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
	if (!existing) throw notFound("Class council not found");

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
	if (!council) throw notFound("Class council not found");

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
	if (!council) throw notFound("Class council not found");

	// Check if decision already exists for this enrollment
	const existing = await repo.findDecisionByCouncilAndEnrollment(
		data.councilId,
		data.enrollmentId,
		institutionId,
	);
	if (existing) {
		throw conflict(
			"A decision already exists for this student in this council",
		);
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
	if (!existing) throw notFound("Council decision not found");

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
