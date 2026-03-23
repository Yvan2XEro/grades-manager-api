import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { conflict, notFound } from "../_shared/errors";
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
	const classCount = await repo.countClasses(id);
	if (classCount > 0) {
		throw conflict(
			`Cannot delete academic year: it has ${classCount} class(es) attached. Remove them first.`,
		);
	}
	// Clean up child records with RESTRICT FK references before deleting
	await db
		.delete(schema.examScheduleRuns)
		.where(eq(schema.examScheduleRuns.academicYearId, id));
	await db
		.delete(schema.promotionExecutions)
		.where(eq(schema.promotionExecutions.academicYearId, id));
	await db
		.delete(schema.deliberations)
		.where(eq(schema.deliberations.academicYearId, id));
	await db
		.delete(schema.studentCourseEnrollments)
		.where(eq(schema.studentCourseEnrollments.academicYearId, id));
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

export async function createNextYear(
	sourceYearId: string,
	institutionId: string,
) {
	const source = await repo.findById(sourceYearId, institutionId);
	if (!source) throw notFound();

	const start = new Date(source.startDate);
	const end = new Date(source.endDate);
	const nextStart = new Date(start);
	nextStart.setFullYear(nextStart.getFullYear() + 1);
	const nextEnd = new Date(end);
	nextEnd.setFullYear(nextEnd.getFullYear() + 1);

	const startY = nextStart.getFullYear();
	const endY = nextEnd.getFullYear();
	const name = `${startY}-${endY}`;

	return repo.create({
		institutionId,
		name,
		startDate: nextStart.toISOString(),
		endDate: nextEnd.toISOString(),
	});
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
