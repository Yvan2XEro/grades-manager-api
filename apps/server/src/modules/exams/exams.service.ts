import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { notFound } from "../_shared/errors";
import * as repo from "./exams.repo";

export async function createExam(data: Parameters<typeof repo.create>[0]) {
	let created: schema.Exam | undefined;
	await transaction(async (tx) => {
		const [{ total }] = await tx
			.select({
				total: sql<number>`coalesce(sum(${schema.exams.percentage}),0)`,
			})
			.from(schema.exams)
			.where(eq(schema.exams.classCourse, data.classCourse));
		if (Number(total) + Number(data.percentage) > 100) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Percentage exceeds 100",
			});
		}
		[created] = await tx.insert(schema.exams).values(data).returning();
	});
	return created;
}

export async function updateExam(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	if (existing.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
	if (data.percentage !== undefined) {
		await transaction(async (tx) => {
			const [{ total }] = await tx
				.select({
					total: sql<number>`coalesce(sum(${schema.exams.percentage}),0)`,
				})
				.from(schema.exams)
				.where(eq(schema.exams.classCourse, existing.classCourse));
			const newTotal =
				Number(total) - Number(existing.percentage) + Number(data.percentage);
			if (newTotal > 100) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Percentage exceeds 100",
				});
			}
			await tx.update(schema.exams).set(data).where(eq(schema.exams.id, id));
		});
		return repo.findById(id);
	}
	return repo.update(id, data);
}

export async function deleteExam(id: string) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	if (existing.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
	await repo.remove(id);
}

export async function listExams(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getExamById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw notFound();
	return item;
}

export async function setLock(examId: string, lock: boolean) {
	const existing = await repo.findById(examId);
	if (!existing) throw notFound();
	return repo.setLock(examId, lock);
}
