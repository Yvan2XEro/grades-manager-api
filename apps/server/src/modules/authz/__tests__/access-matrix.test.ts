/**
 * Role-based and object-level access inside one institution.
 *
 * Each role is tested against what it must NOT be able to do: another
 * student's records (IDOR), another teacher's exams, admin-only and
 * super-admin-only operations, and role escalation.
 */
import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { BusinessRole } from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import type { Context } from "@/lib/context";
import { db } from "@/lib/test-db";
import {
	asAdmin,
	asSuperAdmin,
	createDomainUser,
	createOrganizationMember,
	createRecapFixture,
	createUser,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";
import { buildPermissions } from "..";

const call = (ctx: Context) => appRouter.createCaller(ctx);

const DENIED = ["FORBIDDEN", "UNAUTHORIZED", "NOT_FOUND"];

async function expectDenied(promise: Promise<unknown>) {
	let error: unknown = null;
	try {
		await promise;
	} catch (err) {
		error = err;
	}
	expect(error).not.toBeNull();
	expect(DENIED).toContain((error as { code?: string }).code ?? "");
}

/** Rejected one way or another (role check or input validation). */
async function expectRejected(promise: Promise<unknown>) {
	await expect(promise).rejects.toBeDefined();
}

/** Admin context whose profile exists in the database (FK-safe audit rows). */
async function asPersistedAdmin() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

async function expectCode(promise: Promise<unknown>, code: string) {
	await expect(promise).rejects.toHaveProperty("code", code);
}

/**
 * Two classes A and B of the same institution. The teacher teaches the
 * course of class A only; studentA belongs to class A, studentB to class B.
 */
async function buildWorld() {
	const teacherProfile = await createDomainUser({ firstName: "Teacher" });
	const a = await createRecapFixture({
		classCourse: { teacher: teacherProfile.id },
	});
	const b = await createRecapFixture();
	const studentA = a.student;
	const studentB = b.student;
	const asStudentA = () =>
		makeTestContext({
			role: "student",
			profileOverrides: { id: studentA.domainUserId },
		});
	const asTeacher = () =>
		makeTestContext({
			role: "teacher",
			profileOverrides: { id: teacherProfile.id },
		});
	return { a, b, studentA, studentB, teacherProfile, asStudentA, asTeacher };
}

describe("buildPermissions matrix", () => {
	const roles: (BusinessRole | null)[] = [
		null,
		"student",
		"staff",
		"grade_editor",
		"teacher",
		"dean",
		"administrator",
		"super_admin",
	];
	const expected: Record<string, { grade: boolean; admin: boolean }> = {
		guest: { grade: false, admin: false },
		student: { grade: false, admin: false },
		staff: { grade: false, admin: false },
		grade_editor: { grade: true, admin: false },
		teacher: { grade: true, admin: false },
		dean: { grade: true, admin: true },
		administrator: { grade: true, admin: true },
		super_admin: { grade: true, admin: true },
	};
	for (const role of roles) {
		it(`${role ?? "guest"} gets the expected permissions`, () => {
			const permissions = buildPermissions(role);
			const want = expected[role ?? "guest"];
			expect(permissions.canGrade).toBe(want.grade);
			expect(permissions.canManageCatalog).toBe(want.admin);
			expect(permissions.canManageStudents).toBe(want.admin);
			expect(permissions.canManageFees).toBe(want.admin);
			expect(permissions.canRecordPayments).toBe(want.admin);
			expect(permissions.canAccessAnalytics).toBe(want.admin);
		});
	}
});

describe("unauthenticated caller", () => {
	it("is refused by every non-public procedure sampled", async () => {
		const guest = call(makeTestContext());
		await expectCode(
			guest.grades.listByStudent({ studentId: randomUUID() }),
			"UNAUTHORIZED",
		);
		await expectCode(guest.students.list({}), "UNAUTHORIZED");
		await expectCode(guest.users.list({}), "UNAUTHORIZED");
		await expectCode(
			guest.profiles.results({ profileId: randomUUID() }),
			"UNAUTHORIZED",
		);
		await expectCode(guest.notifications.unreadCount(), "UNAUTHORIZED");
		await expectCode(
			guest.studentCreditLedger.summary({ studentId: randomUUID() }),
			"UNAUTHORIZED",
		);
		await expectCode(guest.deliberations.list({}), "UNAUTHORIZED");
		await expectCode(guest.diplomationKeys.list(), "UNAUTHORIZED");
	});
});

describe("student", () => {
	it("reads their own grades, transcript and credits", async () => {
		const { studentA, asStudentA } = await buildWorld();
		const me = call(asStudentA());
		const transcript = await me.grades.consolidatedByStudent({
			studentId: studentA.id,
		});
		expect(transcript).toBeTruthy();
		const grades = await me.grades.listByStudent({ studentId: studentA.id });
		expect(grades.items.length).toBeGreaterThan(0);
		await me.studentCreditLedger.summary({ studentId: studentA.id });
		const courses = await me.studentCourseEnrollments.list({
			studentId: studentA.id,
		});
		expect(courses.items.length).toBeGreaterThan(0);
	});

	it("cannot read another student's records (IDOR)", async () => {
		const { b, studentB, asStudentA } = await buildWorld();
		const me = call(asStudentA());
		await expectDenied(me.grades.listByStudent({ studentId: studentB.id }));
		await expectDenied(
			me.grades.consolidatedByStudent({ studentId: studentB.id }),
		);
		await expectDenied(
			me.grades.avgForStudentInCourse({
				studentId: studentB.id,
				courseId: b.course.id,
			}),
		);
		await expectDenied(me.grades.listByExam({ examId: b.exam.id }));
		await expectDenied(
			me.grades.listByClassCourse({ classCourseId: b.classCourse.id }),
		);
		await expectDenied(me.grades.listByClass({ classId: b.klass.id }));
		await expectDenied(me.grades.avgForExam({ examId: b.exam.id }));
		await expectDenied(me.grades.avgForCourse({ courseId: b.course.id }));
		await expectDenied(
			me.studentCreditLedger.summary({ studentId: studentB.id }),
		);
		await expectDenied(me.studentCreditLedger.list({ studentId: studentB.id }));
		await expectDenied(
			me.studentCourseEnrollments.list({ studentId: studentB.id }),
		);
		await expectDenied(me.studentCourseEnrollments.list({}));
		await expectDenied(
			me.profiles.results({ profileId: studentB.domainUserId }),
		);
		await expectDenied(
			me.profiles.finances({ profileId: studentB.domainUserId }),
		);
		await expectDenied(me.profiles.get({ profileId: studentB.domainUserId }));
	});

	it("cannot list institution-wide personal data", async () => {
		const { b, studentB, asStudentA } = await buildWorld();
		const me = call(asStudentA());
		await expectDenied(me.students.list({}));
		await expectDenied(me.students.getById({ id: studentB.id }));
		await expectDenied(me.enrollments.list({}));
		await expectDenied(me.users.list({}));
		await expectDenied(me.classCourses.roster({ id: b.classCourse.id }));
		await expectDenied(me.deliberations.list({}));
		await expectDenied(me.deliberations.listPaged({}));
		await expectDenied(me.examGradeEditors.list({ examId: b.exam.id }));
		await expectDenied(
			me.classes.promotionPreview({ sourceClassId: b.klass.id }),
		);
	});

	it("cannot grade, approve or reach admin procedures", async () => {
		const { a, studentA, asStudentA } = await buildWorld();
		const me = call(asStudentA());
		await expectDenied(
			me.grades.upsertNote({
				studentId: studentA.id,
				examId: a.exam.id,
				score: 20,
			}),
		);
		await expectDenied(me.grades.updateNote({ id: a.grade.id, score: 20 }));
		await expectDenied(me.grades.deleteNote({ id: a.grade.id }));
		await expectDenied(
			me.exams.validate({ examId: a.exam.id, status: "approved" }),
		);
		await expectDenied(me.exams.lock({ examId: a.exam.id, lock: true }));
		await expectDenied(
			me.workflows.attendanceAlert({
				classCourseId: a.classCourse.id,
				message: "Spoofed alert",
			}),
		);
		await expectDenied(me.feeClearance.listStructures({}));
		await expectDenied(me.diplomationKeys.list());
		await expectDenied(
			me.academicYears.setActive({ id: a.academicYear.id, isActive: true }),
		);
	});
});

describe("teacher", () => {
	it("grades the exams of their own course", async () => {
		const { a, asTeacher } = await buildWorld();
		const teacher = call(asTeacher());
		const grade = await teacher.grades.upsertNote({
			studentId: a.student.id,
			examId: a.exam.id,
			score: 12,
		});
		expect(Number(grade.score)).toBe(12);
		const list = await teacher.grades.listByExam({ examId: a.exam.id });
		expect(list.items.length).toBe(1);
		await teacher.grades.consolidatedByStudent({ studentId: a.student.id });
		await teacher.classCourses.roster({ id: a.classCourse.id });
	});

	it("cannot grade or read the exams of another teacher's course", async () => {
		const { b, asTeacher } = await buildWorld();
		const teacher = call(asTeacher());
		await expectCode(
			teacher.grades.upsertNote({
				studentId: b.student.id,
				examId: b.exam.id,
				score: 1,
			}),
			"FORBIDDEN",
		);
		await expectCode(
			teacher.grades.updateNote({ id: b.grade.id, score: 1 }),
			"FORBIDDEN",
		);
		await expectCode(
			teacher.grades.deleteNote({ id: b.grade.id }),
			"FORBIDDEN",
		);
		await expectDenied(teacher.grades.listByExam({ examId: b.exam.id }));
		await expectDenied(
			teacher.grades.listByClassCourse({ classCourseId: b.classCourse.id }),
		);
		await expectDenied(teacher.grades.listByClass({ classId: b.klass.id }));
		await expectDenied(
			teacher.grades.consolidatedByStudent({ studentId: b.student.id }),
		);
		await expectDenied(teacher.classCourses.roster({ id: b.classCourse.id }));
		await expectCode(
			teacher.exams.create({
				name: "Intruder exam",
				type: "WRITTEN",
				date: new Date(),
				percentage: 10,
				classCourseId: b.classCourse.id,
			}),
			"FORBIDDEN",
		);
		await expectCode(teacher.exams.delete({ id: b.exam.id }), "FORBIDDEN");
		// Exports of another class/course/exam
		await expectCode(
			teacher.exports.getPVData({
				classId: b.klass.id,
				semesterId: b.klass.semesterId as string,
				academicYearId: b.academicYear.id,
			}),
			"FORBIDDEN",
		);
		await expectCode(
			teacher.exports.previewEvaluation({ examId: b.exam.id }),
			"FORBIDDEN",
		);
		await expectCode(
			teacher.exports.previewEc({
				classCourseId: b.classCourse.id,
				classId: b.klass.id,
			}),
			"FORBIDDEN",
		);
		await expectCode(teacher.exports.bulkExportEcs({}), "FORBIDDEN");
		await expectCode(
			teacher.exports.getDeliberationData({ deliberationId: randomUUID() }),
			"FORBIDDEN",
		);
		await expectCode(teacher.exams.submit({ examId: b.exam.id }), "FORBIDDEN");
		await expectDenied(
			teacher.grades.exportClassCourseCsv({ classCourseId: b.classCourse.id }),
		);
	});

	it("grades another course once granted institution-wide access", async () => {
		const { b, asTeacher } = await buildWorld();
		const ctx = asTeacher();
		const [org] = await db
			.select()
			.from(authSchema.organization)
			.where(eq(authSchema.organization.id, ctx.organizationId as string));
		const member = await createOrganizationMember({
			organizationId: org.id,
			role: "teacher",
		});
		await db
			.update(schema.domainUsers)
			.set({ memberId: member.id })
			.where(eq(schema.domainUsers.id, ctx.profile?.id as string));
		await call(await asPersistedAdmin()).gradeAccessGrants.grant({
			profileId: ctx.profile?.id as string,
		});
		const grade = await call(ctx).grades.upsertNote({
			studentId: b.student.id,
			examId: b.exam.id,
			score: 14,
		});
		expect(Number(grade.score)).toBe(14);
	});

	it("cannot edit a locked exam, approve or lock exams", async () => {
		const { a, asTeacher } = await buildWorld();
		const teacher = call(asTeacher());
		await expectCode(
			teacher.exams.validate({ examId: a.exam.id, status: "approved" }),
			"FORBIDDEN",
		);
		await expectCode(
			teacher.exams.lock({ examId: a.exam.id, lock: true }),
			"FORBIDDEN",
		);
		await call(asAdmin()).exams.lock({ examId: a.exam.id, lock: true });
		await expectCode(
			teacher.grades.updateNote({ id: a.grade.id, score: 3 }),
			"FORBIDDEN",
		);
	});

	it("cannot delegate grading to a student", async () => {
		const { a, b, asTeacher } = await buildWorld();
		const studentUser = await createUser({ memberRole: "student" });
		await expectCode(
			call(asTeacher()).examGradeEditors.assign({
				examId: a.exam.id,
				editorProfileId: studentUser.profile.id,
			}),
			"BAD_REQUEST",
		);
		// Nor grant institution-wide access to one (admin side)
		await expectCode(
			call(await asPersistedAdmin()).gradeAccessGrants.grant({
				profileId: studentUser.profile.id,
			}),
			"BAD_REQUEST",
		);
		// A student with a delegation row still cannot grade
		await db.insert(schema.examGradeEditors).values({
			examId: b.exam.id,
			editorProfileId: studentUser.profile.id,
		});
		await expectCode(
			call(
				makeTestContext({
					role: "student",
					profileOverrides: { id: studentUser.profile.id },
				}),
			).grades.upsertNote({
				studentId: b.student.id,
				examId: b.exam.id,
				score: 20,
			}),
			"FORBIDDEN",
		);
	});

	it("cannot touch deliberations, fees, users or settings", async () => {
		const { a, asTeacher } = await buildWorld();
		const teacher = call(asTeacher());
		await expectCode(teacher.deliberations.list({}), "FORBIDDEN");
		await expectCode(teacher.feeClearance.listStructures({}), "FORBIDDEN");
		await expectCode(
			teacher.users.createWithAuth({
				firstName: "X",
				lastName: "Y",
				email: `x-${randomUUID()}@example.com`,
				canConnect: true,
				password: "password123",
				memberRole: "administrator",
			}),
			"FORBIDDEN",
		);
		await expectCode(
			teacher.institutions.update({
				id: a.institution.id,
				data: { nameFr: "Hacked" },
			}),
			"FORBIDDEN",
		);
		await expectCode(teacher.diplomationKeys.list(), "FORBIDDEN");
		// Official documents are issued by the administration
		await expectCode(
			teacher.academicDocuments.studentOptions({ studentId: a.student.id }),
			"FORBIDDEN",
		);
		await expectCode(
			teacher.academicDocuments.classRoster({
				classId: a.klass.id,
				kind: "transcript",
			}),
			"FORBIDDEN",
		);
	});
});

describe("grade_editor and staff", () => {
	it("grade_editor grades any exam but cannot approve or manage", async () => {
		const { b } = await buildWorld();
		const editorProfile = await createDomainUser();
		const editor = call(
			makeTestContext({
				role: "grade_editor",
				profileOverrides: { id: editorProfile.id },
			}),
		);
		await editor.grades.upsertNote({
			studentId: b.student.id,
			examId: b.exam.id,
			score: 11,
		});
		await expectCode(
			editor.exams.validate({ examId: b.exam.id, status: "approved" }),
			"FORBIDDEN",
		);
		await expectCode(editor.deliberations.list({}), "FORBIDDEN");
		await expectCode(editor.feeClearance.listStructures({}), "FORBIDDEN");
	});

	it("staff reads student files but cannot grade", async () => {
		const { b } = await buildWorld();
		const staff = call(makeTestContext({ role: "staff" }));
		await staff.students.list({});
		await staff.grades.consolidatedByStudent({ studentId: b.student.id });
		await expectCode(
			staff.grades.upsertNote({
				studentId: b.student.id,
				examId: b.exam.id,
				score: 11,
			}),
			"FORBIDDEN",
		);
		await expectCode(
			staff.exams.create({
				name: "x",
				type: "WRITTEN",
				date: new Date(),
				percentage: 10,
				classCourseId: b.classCourse.id,
			}),
			"FORBIDDEN",
		);
		await expectCode(staff.feeClearance.listStructures({}), "FORBIDDEN");
	});
});

describe("dean vs administrator vs super_admin", () => {
	const roles = ["dean", "administrator"] as const;

	for (const role of roles) {
		it(`${role} cannot run super-admin-only operations`, async () => {
			const { a } = await buildWorld();
			const actor = call(makeTestContext({ role }));
			await expectCode(
				actor.academicYears.setActive({
					id: a.academicYear.id,
					isActive: true,
				}),
				"FORBIDDEN",
			);
			await expectCode(
				actor.diplomationKeys.create({ label: "ext" }),
				"FORBIDDEN",
			);
			await expectCode(
				actor.institutions.create({
					code: `ROOT-${randomUUID().slice(0, 4)}`,
					shortName: "R",
					nameFr: "Racine",
					nameEn: "Root",
					type: "institution",
				}),
				"FORBIDDEN",
			);
			await expectCode(
				actor.institutions.delete({ id: a.institution.id }),
				"FORBIDDEN",
			);
		});

		it(`${role} cannot create a super_admin account`, async () => {
			const actor = call(makeTestContext({ role }));
			// super_admin is not an assignable role: refused at input validation
			await expectRejected(
				actor.users.createWithAuth({
					firstName: "Esc",
					lastName: "Alation",
					email: `esc-${randomUUID()}@example.com`,
					canConnect: true,
					password: "password123",
					memberRole: "super_admin",
				}),
			);
		});
	}

	it("a dean cannot create an administrator account", async () => {
		await expectCode(
			call(makeTestContext({ role: "dean" })).users.createWithAuth({
				firstName: "Esc",
				lastName: "Alation",
				email: `esc-${randomUUID()}@example.com`,
				canConnect: true,
				password: "password123",
				memberRole: "administrator",
			}),
			"FORBIDDEN",
		);
	});

	it("a dean cannot edit institution identity or audit API keys", async () => {
		const { a } = await buildWorld();
		const dean = call(makeTestContext({ role: "dean" }));
		await expectCode(
			dean.institutions.update({
				id: a.institution.id,
				data: { nameFr: "Renamed" },
			}),
			"FORBIDDEN",
		);
		await expectCode(dean.diplomationKeys.list(), "FORBIDDEN");
	});

	it("admins cannot edit, delete or ban a super admin's profile", async () => {
		const superUser = await createUser({ memberRole: "super_admin" });
		const admin = call(asAdmin());
		await expectCode(
			admin.users.updateProfile({
				id: superUser.profile.id,
				firstName: "Pwned",
			}),
			"FORBIDDEN",
		);
		await expectCode(
			admin.users.deleteProfile({ id: superUser.profile.id }),
			"FORBIDDEN",
		);
		await expectCode(
			admin.profiles.setBanStatus({
				profileId: superUser.profile.id,
				banned: true,
			}),
			"FORBIDDEN",
		);
		// A super admin can
		await call(asSuperAdmin()).users.updateProfile({
			id: superUser.profile.id,
			firstName: "Renamed",
		});
	});

	it("super_admin runs super-admin-only operations", async () => {
		const sa = call(asSuperAdmin());
		const key = await sa.diplomationKeys.create({ label: "ext" });
		expect(key).toBeTruthy();
		await call(asAdmin()).diplomationKeys.list();
	});
});
