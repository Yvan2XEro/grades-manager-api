import { conflict, notFound } from "../../lib/errors";
import * as repo from "./tracks.repo";

export async function get(id: string, institutionId: string) {
	const track = await repo.findById(id, institutionId);
	if (!track) throw notFound("Track not found");
	return track;
}

export async function list(
	institutionId: string,
	opts: {
		orderBy?: string;
		orderDir?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	const { items, total } = await repo.findAll(institutionId, opts);
	return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 25 };
}

export async function create(
	data: {
		name: string;
		code: string;
		cycleLevel: "first_cycle" | "second_cycle" | "technical";
		isOfficial?: boolean;
	},
	institutionId: string,
) {
	const existing = await repo.findByCode(data.code, institutionId);
	if (existing) throw conflict(`Track code "${data.code}" already exists`);
	return repo.insert({
		institutionId,
		name: data.name,
		code: data.code,
		cycleLevel: data.cycleLevel,
		isOfficial: data.isOfficial ?? false,
	});
}

export async function upsertCoefficient(
	data: {
		trackId: string;
		subjectId: string;
		coefficient: number;
		isOfficialExamSubject?: boolean;
	},
	institutionId: string,
) {
	const track = await repo.findById(data.trackId, institutionId);
	if (!track) throw notFound("Track not found in this institution");
	return repo.upsertCoefficient({
		trackId: data.trackId,
		subjectId: data.subjectId,
		coefficient: data.coefficient,
		isOfficialExamSubject: data.isOfficialExamSubject ?? false,
	});
}

export async function bulkCreate(
	rows: {
		name: string;
		code: string;
		cycleLevel: "first_cycle" | "second_cycle" | "technical";
		isOfficial?: boolean;
	}[],
	institutionId: string,
) {
	const values = rows.map((r) => ({
		institutionId,
		name: r.name,
		code: r.code,
		cycleLevel: r.cycleLevel,
		isOfficial: r.isOfficial ?? false,
	}));
	return repo.bulkInsert(values);
}

export async function bulkUpsertCoefficients(
	rows: {
		trackId: string;
		subjectId: string;
		coefficient: number;
		isOfficialExamSubject?: boolean;
	}[],
) {
	const values = rows.map((r) => ({
		trackId: r.trackId,
		subjectId: r.subjectId,
		coefficient: r.coefficient,
		isOfficialExamSubject: r.isOfficialExamSubject ?? false,
	}));
	return repo.bulkUpsertCoefficients(values);
}

export async function getCoefficientsGrid(
	trackId: string,
	institutionId: string,
) {
	const track = await repo.findById(trackId, institutionId);
	if (!track) throw notFound("Track not found in this institution");
	return repo.getCoefficientsGrid(trackId);
}
