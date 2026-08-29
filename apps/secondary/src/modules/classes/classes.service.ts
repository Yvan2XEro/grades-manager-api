import { conflict, notFound } from "../../lib/errors";
import * as repo from "./classes.repo";

export async function list(
	academicYearId: string | undefined,
	institutionId: string,
	opts: {
		search?: string;
		level?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	const { items, total } = await repo.findByYear(
		academicYearId,
		institutionId,
		opts,
	);
	return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 25 };
}

export async function create(
	data: {
		name: string;
		code: string;
		level: string;
		academicYearId: string;
		trackId?: string;
		classMasterId?: string;
		room?: string;
		maxCapacity?: number;
	},
	institutionId: string,
) {
	const existing = await repo.findByCode(
		data.code,
		data.academicYearId,
		institutionId,
	);
	if (existing)
		throw conflict(
			`Class code "${data.code}" already exists in this academic year`,
		);
	return repo.insert({
		institutionId,
		academicYearId: data.academicYearId,
		trackId: data.trackId,
		classMasterId: data.classMasterId,
		name: data.name,
		code: data.code,
		level: data.level,
		room: data.room,
		maxCapacity: data.maxCapacity,
	});
}

export async function get(id: string, institutionId: string) {
	const cls = await repo.findById(id, institutionId);
	if (!cls) throw notFound("Class not found");
	return cls;
}

export async function getRoster(classId: string, institutionId: string) {
	const cls = await repo.findById(classId, institutionId);
	if (!cls) throw notFound("Class not found");
	return repo.getRoster(classId, institutionId);
}
