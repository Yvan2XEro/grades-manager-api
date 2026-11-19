import { and, eq, inArray, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { conflict, notFound } from "../_shared/errors";
import * as repo from "./academic-years.repo";

type CreateInput = Omit<Parameters<typeof repo.create>[0], "institutionId">;
type UpdateInput = Partial<CreateInput>;
type ListInput = Parameters<typeof repo.list>[1];

/** Year names are unique per institution; a duplicate is a CONFLICT, not a 500. */
async function assertNameFree(
	name: string,
	institutionId: string,
	exceptId?: string,
) {
	const taken = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.institutionId, institutionId),
			eq(schema.academicYears.name, name),
		),
		columns: { id: true },
	});
	if (taken && taken.id !== exceptId) {
		throw conflict(`The academic year ${name} already exists`);
	}
}

export async function createAcademicYear(
	data: CreateInput,
	institutionId: string,
) {
	await assertNameFree(data.name, institutionId);
	return repo.create({ ...data, institutionId });
}

export async function updateAcademicYear(
	id: string,
	institutionId: string,
	data: UpdateInput,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	if (data.name) await assertNameFree(data.name, institutionId, id);
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
	await assertNameFree(name, institutionId);

	return repo.create({
		institutionId,
		name,
		startDate: nextStart.toISOString(),
		endDate: nextEnd.toISOString(),
	});
}

export async function listAcademicYearsPaged(
	input: { page: number; pageSize: number },
	institutionId: string,
) {
	return repo.listPaged(institutionId, input);
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

/**
 * What is still open in the active year before `id` becomes the active one:
 * classes of the active year without a closed or signed annual jury, and
 * students still active in it with no enrollment in `id`. Empty when `id` is
 * the active year or does not come after it. A warning, never a block.
 */
export async function activationChecklist(id: string, institutionId: string) {
	const target = await repo.findById(id, institutionId);
	if (!target) throw notFound();
	const current = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.institutionId, institutionId),
			eq(schema.academicYears.isActive, true),
		),
	});
	const empty = {
		fromYear: null as { id: string; name: string } | null,
		classCount: 0,
		classesWithoutJury: [] as Array<{ id: string; code: string; name: string }>,
		unplacedStudentCount: 0,
	};
	if (
		!current ||
		current.id === target.id ||
		new Date(target.startDate) <= new Date(current.startDate)
	) {
		return empty;
	}

	const classes = await db
		.selectDistinct({
			id: schema.classes.id,
			code: schema.classes.code,
			name: schema.classes.name,
		})
		.from(schema.classes)
		.innerJoin(
			schema.enrollments,
			eq(schema.enrollments.classId, schema.classes.id),
		)
		.where(
			and(
				eq(schema.classes.institutionId, institutionId),
				eq(schema.classes.academicYear, current.id),
			),
		);
	const juries =
		classes.length === 0
			? []
			: await db.query.deliberations.findMany({
					where: and(
						eq(schema.deliberations.institutionId, institutionId),
						eq(schema.deliberations.academicYearId, current.id),
						eq(schema.deliberations.type, "annual"),
						inArray(schema.deliberations.status, ["closed", "signed"]),
						inArray(
							schema.deliberations.classId,
							classes.map((c) => c.id),
						),
					),
					columns: { classId: true },
				});
	const withJury = new Set(juries.map((d) => d.classId));

	const nextEnrollment = alias(schema.enrollments, "next_enrollment");
	const unplaced = await db
		.selectDistinct({ studentId: schema.enrollments.studentId })
		.from(schema.enrollments)
		.where(
			and(
				eq(schema.enrollments.institutionId, institutionId),
				eq(schema.enrollments.academicYearId, current.id),
				eq(schema.enrollments.status, "active"),
				notExists(
					db
						.select({ id: nextEnrollment.id })
						.from(nextEnrollment)
						.where(
							and(
								eq(nextEnrollment.academicYearId, target.id),
								eq(nextEnrollment.studentId, schema.enrollments.studentId),
							),
						),
				),
			),
		);

	return {
		fromYear: { id: current.id, name: current.name },
		classCount: classes.length,
		classesWithoutJury: classes
			.filter((c) => !withJury.has(c.id))
			.sort((a, b) => a.name.localeCompare(b.name)),
		unplacedStudentCount: unplaced.length,
	};
}
