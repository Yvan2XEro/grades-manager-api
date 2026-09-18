import {
	type InstitutionType,
	isClassLevelAllowed,
} from "../../lib/academic-levels";
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
	institutionType: InstitutionType,
) {
	if (!isClassLevelAllowed(institutionType, data.level)) {
		throw conflict("CLASS_LEVEL_NOT_ALLOWED");
	}
	const existing = await repo.findByCode(
		data.code,
		data.academicYearId,
		institutionId,
	);
	if (existing) throw conflict("CLASS_CODE_EXISTS");
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
	if (!cls) throw notFound("CLASS_NOT_FOUND");
	return cls;
}

export async function getRoster(classId: string, institutionId: string) {
	const cls = await repo.findById(classId, institutionId);
	if (!cls) throw notFound("CLASS_NOT_FOUND");
	return repo.getRoster(classId, institutionId);
}

export async function update(
	id: string,
	data: {
		name?: string;
		code?: string;
		level?: string;
		room?: string | null;
		maxCapacity?: number | null;
		trackId?: string | null;
	},
	institutionId: string,
	institutionType: InstitutionType,
) {
	if (data.level && !isClassLevelAllowed(institutionType, data.level)) {
		throw conflict("CLASS_LEVEL_NOT_ALLOWED");
	}
	const cls = await repo.updateClass(id, institutionId, data);
	if (!cls) throw notFound("CLASS_NOT_FOUND");
	return cls;
}

export async function remove(id: string, institutionId: string) {
	const count = await repo.countEnrollments(id);
	if (count > 0) throw conflict("CLASS_HAS_ENROLLMENTS");
	const cls = await repo.deleteClass(id, institutionId);
	if (!cls) throw notFound("CLASS_NOT_FOUND");
	return cls;
}

export async function bulkCreate(
	rows: {
		name: string;
		code: string;
		level: string;
		academicYearId: string;
		trackId?: string;
		room?: string;
		maxCapacity?: number;
	}[],
	institutionId: string,
	institutionType: InstitutionType,
) {
	if (rows.some((row) => !isClassLevelAllowed(institutionType, row.level))) {
		throw conflict("CLASS_LEVEL_NOT_ALLOWED");
	}
	const values = rows.map((r) => ({
		institutionId,
		academicYearId: r.academicYearId,
		trackId: r.trackId,
		name: r.name,
		code: r.code,
		level: r.level,
		room: r.room,
		maxCapacity: r.maxCapacity,
	}));
	return repo.bulkInsert(values);
}
