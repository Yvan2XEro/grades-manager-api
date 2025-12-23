import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	createDomainUser,
	createRecapFixture,
	makeTestContext,
	setupTestInstitution,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

	describe("exam grade delegation", () => {
	beforeAll(async () => {
		await setupTestInstitution();
	});
	it("allows teacher to delegate and revoke editors", async () => {
		const { exam, classCourse, student } = await createRecapFixture();
		if (!classCourse.teacher) {
			throw new Error("Class course missing teacher");
		}
		const teacherProfile = await db.query.domainUsers.findFirst({
			where: eq(schema.domainUsers.id, classCourse.teacher),
		});
		if (!teacherProfile) {
			throw new Error("Teacher profile not found");
		}
		const teacherCaller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: teacherProfile,
			}),
		);
		const delegateProfile = await createDomainUser({ businessRole: "staff" });
		const delegateCaller = createCaller(
			makeTestContext({
				role: "staff",
				profileOverrides: delegateProfile,
			}),
		);

		const assigned = await teacherCaller.examGradeEditors.assign({
			examId: exam.id,
			editorProfileId: delegateProfile.id,
		});
		expect(assigned.examId).toBe(exam.id);

		const delegateCourses = await delegateCaller.classCourses.list({
			limit: 50,
		});
		expect(
			delegateCourses.items.some((course) => course.id === classCourse.id),
		).toBe(true);

		const grade = await delegateCaller.grades.upsertNote({
			studentId: student.id,
			examId: exam.id,
			score: 120,
		});
		expect(Number(grade.score)).toBe(120);

		await teacherCaller.examGradeEditors.revoke({
			id: assigned.id,
			examId: exam.id,
		});

		await expect(
			delegateCaller.grades.updateNote({
				id: grade.id,
				score: 90,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("records audit logs whenever delegates edit grades", async () => {
		await db.delete(schema.gradeEditLogs);
		const { exam, classCourse, student } = await createRecapFixture();
		if (!classCourse.teacher) {
			throw new Error("Class course missing teacher");
		}
		const teacherProfile = await db.query.domainUsers.findFirst({
			where: eq(schema.domainUsers.id, classCourse.teacher),
		});
		if (!teacherProfile) {
			throw new Error("Teacher profile not found");
		}
		const teacherCaller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: teacherProfile,
			}),
		);
		const delegateProfile = await createDomainUser({ businessRole: "staff" });
		const delegateCaller = createCaller(
			makeTestContext({
				role: "staff",
				profileOverrides: delegateProfile,
			}),
		);

		await teacherCaller.examGradeEditors.assign({
			examId: exam.id,
			editorProfileId: delegateProfile.id,
		});

		const written = await delegateCaller.grades.upsertNote({
			studentId: student.id,
			examId: exam.id,
			score: 150,
		});
		let logs = await db.query.gradeEditLogs.findMany({
			where: eq(
				schema.gradeEditLogs.actorProfileId,
				delegateProfile.id,
			),
		});
		expect(logs).toHaveLength(1);
		expect(logs[0]?.action).toBe("write");
		expect(logs[0]?.gradeId).toBe(written.id);

		await delegateCaller.grades.updateNote({
			id: written.id,
			score: 160,
		});
		logs = await db.query.gradeEditLogs.findMany({
			where: eq(
				schema.gradeEditLogs.actorProfileId,
				delegateProfile.id,
			),
		});
		expect(logs).toHaveLength(2);

		await delegateCaller.grades.deleteNote({
			id: written.id,
		});
		logs = await db.query.gradeEditLogs.findMany({
			where: eq(
				schema.gradeEditLogs.actorProfileId,
				delegateProfile.id,
			),
		});
		expect(logs).toHaveLength(3);
		expect(logs.some((log) => log.action === "delete")).toBe(true);
	});
});
