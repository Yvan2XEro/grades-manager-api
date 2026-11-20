/**
 * Object-level access to student records inside one institution.
 *
 * - Admins, deans, staff and grade editors read every record.
 * - Holders of an institution-wide grade access grant read every record.
 * - Teachers read the records of their class courses (class course teacher or
 *   per-exam delegate) and of the students enrolled in them.
 * - Students read their own records only.
 *
 * Denials throw FORBIDDEN. Callers check institution ownership separately
 * (NOT_FOUND) before or after these guards.
 */
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import * as gradeAccessRepo from "@/modules/grade-access-grants/grade-access-grants.repo";
import {
	hasInstitutionWideRecordAccess,
	isStaffRole,
	type MemberRole,
	roleSatisfies,
} from "./index";

export type RecordActor = {
	profileId: string | null;
	memberRole: MemberRole | null;
};

type ActorContext = {
	profile?: { id: string } | null;
	memberRole?: MemberRole | null;
};

export const recordActorFromCtx = (ctx: ActorContext): RecordActor => ({
	profileId: ctx.profile?.id ?? null,
	memberRole: ctx.memberRole ?? null,
});

const forbidden = () =>
	new TRPCError({
		code: "FORBIDDEN",
		message: "You do not have access to this record",
	});

/** Throws FORBIDDEN unless the actor is an employee (not a student/guest). */
export function assertStaff(actor: RecordActor) {
	if (!isStaffRole(actor.memberRole)) throw forbidden();
}

async function hasFullAccess(actor: RecordActor, institutionId: string) {
	if (hasInstitutionWideRecordAccess(actor.memberRole)) return true;
	if (!actor.profileId || !isStaffRole(actor.memberRole)) return false;
	const grant = await gradeAccessRepo.findByProfileAndInstitution(
		actor.profileId,
		institutionId,
	);
	return Boolean(grant);
}

/** Class course ids a teacher/delegate works on (teacher or exam delegate). */
async function scopedClassCourseIds(
	profileId: string,
	institutionId: string,
): Promise<string[]> {
	const taught = await db
		.select({ id: schema.classCourses.id })
		.from(schema.classCourses)
		.where(
			and(
				eq(schema.classCourses.teacher, profileId),
				eq(schema.classCourses.institutionId, institutionId),
			),
		);
	const delegated = await db
		.selectDistinct({ id: schema.exams.classCourse })
		.from(schema.examGradeEditors)
		.innerJoin(
			schema.exams,
			eq(schema.exams.id, schema.examGradeEditors.examId),
		)
		.where(
			and(
				eq(schema.examGradeEditors.editorProfileId, profileId),
				eq(schema.exams.institutionId, institutionId),
			),
		);
	return Array.from(new Set([...taught, ...delegated].map((row) => row.id)));
}

/** Student record id linked to the actor's profile, if any. */
export async function findOwnStudentId(
	profileId: string | null,
	institutionId: string,
) {
	if (!profileId) return null;
	const row = await db.query.students.findFirst({
		where: and(
			eq(schema.students.domainUserId, profileId),
			eq(schema.students.institutionId, institutionId),
		),
		columns: { id: true },
	});
	return row?.id ?? null;
}

/**
 * Personal records of one student (grades, transcript, credits, course
 * enrollments): the student themselves, institution-wide readers, or a
 * teacher of one of the student's class courses.
 */
export async function assertCanReadStudent(
	actor: RecordActor,
	studentId: string,
	institutionId: string,
) {
	if (await hasFullAccess(actor, institutionId)) return;
	if (!isStaffRole(actor.memberRole)) {
		const own = await findOwnStudentId(actor.profileId, institutionId);
		if (own && own === studentId) return;
		throw forbidden();
	}
	if (!actor.profileId) throw forbidden();
	const classCourseIds = await scopedClassCourseIds(
		actor.profileId,
		institutionId,
	);
	if (classCourseIds.length === 0) throw forbidden();
	const classIds = await db
		.select({ classId: schema.classCourses.class })
		.from(schema.classCourses)
		.where(inArray(schema.classCourses.id, classCourseIds));
	const [link] = await db
		.select({ id: schema.students.id })
		.from(schema.students)
		.leftJoin(
			schema.studentCourseEnrollments,
			and(
				eq(schema.studentCourseEnrollments.studentId, schema.students.id),
				inArray(schema.studentCourseEnrollments.classCourseId, classCourseIds),
			),
		)
		.where(
			and(
				eq(schema.students.id, studentId),
				or(
					inArray(
						schema.students.class,
						classIds.map((row) => row.classId),
					),
					eq(schema.studentCourseEnrollments.studentId, studentId),
				),
			),
		)
		.limit(1);
	if (!link) throw forbidden();
}

/** Grades/roster of a class course: institution-wide readers or its teacher/delegates. */
export async function assertCanReadClassCourse(
	actor: RecordActor,
	classCourseId: string,
	institutionId: string,
) {
	if (await hasFullAccess(actor, institutionId)) return;
	if (!actor.profileId || !isStaffRole(actor.memberRole)) throw forbidden();
	const ids = await scopedClassCourseIds(actor.profileId, institutionId);
	if (!ids.includes(classCourseId)) throw forbidden();
}

/** Grades of an exam: same rule as its class course. */
export async function assertCanReadExam(
	actor: RecordActor,
	examId: string,
	institutionId: string,
) {
	if (await hasFullAccess(actor, institutionId)) return;
	const exam = await db.query.exams.findFirst({
		where: and(
			eq(schema.exams.id, examId),
			eq(schema.exams.institutionId, institutionId),
		),
		columns: { classCourse: true },
	});
	if (!exam) throw forbidden();
	await assertCanReadClassCourse(actor, exam.classCourse, institutionId);
}

/** Class-wide grades: institution-wide readers or a teacher of one of its courses. */
export async function assertCanReadClass(
	actor: RecordActor,
	classId: string,
	institutionId: string,
) {
	if (await hasFullAccess(actor, institutionId)) return;
	if (!actor.profileId || !isStaffRole(actor.memberRole)) throw forbidden();
	const ids = await scopedClassCourseIds(actor.profileId, institutionId);
	if (ids.length === 0) throw forbidden();
	const [row] = await db
		.select({ id: schema.classCourses.id })
		.from(schema.classCourses)
		.where(
			and(
				inArray(schema.classCourses.id, ids),
				eq(schema.classCourses.class, classId),
			),
		)
		.limit(1);
	if (!row) throw forbidden();
}

/**
 * Grade delegation (per exam or institution-wide) never goes to a student:
 * refused when the profile's account holds a non-staff role, or — for a
 * profile without account yet — when it is a student record.
 */
export async function assertGradeDelegationCandidate(
	profileId: string,
	memberRole: string | null | undefined,
) {
	const isStudent = memberRole
		? !isStaffRole(memberRole as MemberRole)
		: Boolean(
				await db.query.students.findFirst({
					where: eq(schema.students.domainUserId, profileId),
					columns: { id: true },
				}),
			);
	if (isStudent) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Grade access can only be delegated to staff",
		});
	}
}

// ── Role ceilings for account management ────────────────────────────────────

/**
 * An actor may only hand out a role they hold themselves (directly or through
 * the hierarchy): a dean cannot create an administrator, an administrator
 * cannot create a super admin.
 */
export function assertCanAssignRole(
	actorRole: MemberRole | null | undefined,
	targetRole: string,
) {
	if (!roleSatisfies(actorRole, [targetRole as MemberRole])) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You cannot assign a role above your own",
		});
	}
}

/**
 * Editing, deleting or banning a profile whose account holds a higher role
 * than the actor's is refused (a dean on an administrator, an administrator
 * on a super admin).
 */
export async function assertCanManageProfile(
	actorRole: MemberRole | null | undefined,
	profileId: string,
) {
	const [row] = await db
		.select({ role: authSchema.member.role })
		.from(schema.domainUsers)
		.innerJoin(
			authSchema.member,
			eq(authSchema.member.id, schema.domainUsers.memberId),
		)
		.where(eq(schema.domainUsers.id, profileId))
		.limit(1);
	if (!row) return;
	assertCanAssignRole(actorRole, row.role);
}

/** Course-wide grade averages: institution-wide readers or a teacher of that course. */
export async function assertCanReadCourse(
	actor: RecordActor,
	courseId: string,
	institutionId: string,
) {
	if (await hasFullAccess(actor, institutionId)) return;
	if (!actor.profileId || !isStaffRole(actor.memberRole)) throw forbidden();
	const ids = await scopedClassCourseIds(actor.profileId, institutionId);
	if (ids.length === 0) throw forbidden();
	const [row] = await db
		.select({ id: schema.classCourses.id })
		.from(schema.classCourses)
		.where(
			and(
				inArray(schema.classCourses.id, ids),
				eq(schema.classCourses.course, courseId),
			),
		)
		.limit(1);
	if (!row) throw forbidden();
}
