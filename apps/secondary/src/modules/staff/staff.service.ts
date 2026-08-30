import { conflict, notFound } from "../../lib/errors";
import * as repo from "./staff.repo";

export async function list(
	institutionId: string,
	opts: {
		search?: string;
		role?: string;
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
		firstName: string;
		lastName: string;
		email: string;
		phone?: string;
		role?: string;
	},
	institutionId: string,
) {
	const existing = await repo.findByEmail(data.email, institutionId);
	if (existing) throw conflict(`Staff email "${data.email}" already exists`);
	return repo.insert({
		institutionId,
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		phone: data.phone,
		role: data.role ?? "teacher",
	});
}

export async function get(id: string, institutionId: string) {
	const member = await repo.findById(id, institutionId);
	if (!member) throw notFound("Staff member not found");
	return member;
}

export async function updateStaff(
	id: string,
	institutionId: string,
	data: {
		firstName?: string;
		lastName?: string;
		email?: string;
		phone?: string;
		role?: string;
	},
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Staff member not found");
	if (data.email && data.email !== existing.email) {
		const duplicate = await repo.findByEmail(data.email, institutionId);
		if (duplicate) throw conflict(`Email "${data.email}" already taken`);
	}
	const updated = await repo.update(id, institutionId, data);
	return updated!;
}

export async function count(institutionId: string) {
	return repo.countAll(institutionId);
}
