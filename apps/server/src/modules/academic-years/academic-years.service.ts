import { and, eq } from "drizzle-orm";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { notFound } from "../_shared/errors";
import * as repo from "./academic-years.repo";

type CreateInput = Parameters<typeof repo.create>[0];
type UpdateInput = Parameters<typeof repo.update>[2];
type ListInput = Parameters<typeof repo.list>[1];

export async function createAcademicYear(
	data: CreateInput,
	institutionId: string,
) {
	return repo.create({ ...data, institutionId });
}

export async function updateAcademicYear(
	id: string,
	institutionId: string,
	data: UpdateInput,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	return repo.update(id, institutionId, data);
}

export async function deleteAcademicYear(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	await repo.remove(id, institutionId);
}

export async function listAcademicYears(
	opts: ListInput,
	institutionId: string,
) {
	return repo.list(institutionId, opts);
}

export async function getAcademicYearById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw notFound();
	return item;
}

export async function setActive(
	id: string,
	isActive: boolean,
	institutionId: string,
) {
	const target = await repo.findById(id, institutionId);
	if (!target) throw notFound();
	await transaction(async (tx) => {
		if (isActive) {
			await tx
				.update(schema.academicYears)
				.set({ isActive: false })
				.where(
					and(
						eq(schema.academicYears.isActive, true),
						eq(schema.academicYears.institutionId, target.institutionId),
					),
				);
		}
		await tx
			.update(schema.academicYears)
			.set({ isActive })
			.where(
				and(
					eq(schema.academicYears.id, id),
					eq(schema.academicYears.institutionId, target.institutionId),
				),
			);
	});
	return repo.findById(id, institutionId);
}
