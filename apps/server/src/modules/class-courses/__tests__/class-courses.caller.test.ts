import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createCourse,
	createDomainUser,
	createFaculty,
	createProgram,
	createStudent,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("class courses router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.classCourses.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("supports CRUD", async () => {
		const klass = await createClass();
		const course = await createCourse({ program: klass.program });
		const teacherId = course.defaultTeacher;
		const admin = createCaller(asAdmin());
		const cc = await admin.classCourses.create({
			code: "CC-CRUD",
			class: klass.id,
			course: course.id,
			teacher: teacherId,
			weeklyHours: 2,
		});
		expect(cc.class).toBe(klass.id);

		const updated = await admin.classCourses.update({
			id: cc.id,
			weeklyHours: 3,
		});
		expect(updated.weeklyHours).toBe(3);

		await admin.classCourses.delete({ id: cc.id });
		const list = await admin.classCourses.list({ classId: klass.id });
		expect(list.items.length).toBe(0);
	});

	it("returns roster with enrolled students only", async () => {
		const klass = await createClass();
		const course = await createCourse({ program: klass.program });
		const teacherId = course.defaultTeacher;
		const admin = createCaller(asAdmin());
		const cc = await admin.classCourses.create({
			code: "CC-ROSTER",
			class: klass.id,
			course: course.id,
			teacher: teacherId,
			weeklyHours: 2,
		});
		const enrolled = await createStudent({ class: klass.id });
		await ensureStudentCourseEnrollment(enrolled.id, cc.id, "active");
		await createStudent({ class: klass.id });
		const roster = await admin.classCourses.roster({ id: cc.id });
		expect(roster.students).toHaveLength(1);
		expect(roster.students[0].id).toBe(enrolled.id);
	});

	it("prevents accessing class courses from another institution", async () => {
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
		const course = await createCourse({ program: program.id });
		const teacher = await createDomainUser({ businessRole: "teacher" });
		const [classCourse] = await db
			.insert(schema.classCourses)
			.values({
				code: `CC-${randomUUID().slice(0, 4)}`,
				class: klass.id,
				course: course.id,
				teacher: teacher.id,
				weeklyHours: 2,
				institutionId: foreignInstitution.id,
			})
			.returning();
		await expect(
			admin.classCourses.getById({ id: classCourse.id }),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});
});
