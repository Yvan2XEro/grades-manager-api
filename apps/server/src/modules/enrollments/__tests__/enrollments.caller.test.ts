import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createFaculty,
	createProgram,
	createStudent,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("enrollments router", () => {
	it("requires auth to list", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.enrollments.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("creates and updates enrollments", async () => {
		const admin = createCaller(asAdmin());
		const klass = await createClass();
		const student = await createStudent({ class: klass.id });
		const year = await createAcademicYear();
		const enrollment = await admin.enrollments.create({
			studentId: student.id,
			classId: klass.id,
			academicYearId: year.id,
			status: "active",
		});
		expect(enrollment.studentId).toBe(student.id);

		const updated = await admin.enrollments.updateStatus({
			id: enrollment.id,
			status: "completed",
		});
		expect(updated?.status).toBe("completed");

		const list = await admin.enrollments.list({ studentId: student.id });
		expect(list.items.length).toBeGreaterThan(0);
	});

	it("prevents accessing enrollments from another institution", async () => {
		const admin = createCaller(asAdmin());
		const [foreignInstitution] = await db
			.insert(schema.institutions)
			.values({
				code: `OTH-${randomUUID().slice(0, 6)}`,
				shortName: "OTHER",
				nameFr: "Institution étrangère",
				nameEn: "Foreign Institution",
			})
			.returning();
		const faculty = await createFaculty({
			institutionId: foreignInstitution.id,
		});
		const program = await createProgram({
			faculty: faculty.id,
			institutionId: foreignInstitution.id,
		});
		const academicYear = await createAcademicYear({
			institutionId: foreignInstitution.id,
		});
		const klass = await createClass({
			program: program.id,
			academicYear: academicYear.id,
			institutionId: foreignInstitution.id,
		});
		const student = await createStudent({ class: klass.id });
		const [enrollment] = await db
			.insert(schema.enrollments)
			.values({
				studentId: student.id,
				classId: klass.id,
				academicYearId: academicYear.id,
				status: "active",
				institutionId: foreignInstitution.id,
			})
			.returning();
		await expect(
			admin.enrollments.getById({ id: enrollment.id }),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});
});
