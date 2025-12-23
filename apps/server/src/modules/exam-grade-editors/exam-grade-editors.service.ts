import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { ADMIN_ROLES, type MemberRole, roleSatisfies } from "@/modules/authz";
import { notFound } from "@/modules/_shared/errors";
import * as repo from "./exam-grade-editors.repo";

export type ExamEditorActor = {
	profileId: string | null;
	memberRole: MemberRole | null;
};

export type ExamActorAccess = "admin" | "teacher" | "delegate";

export async function ensureActorCanEditExam(options: {
	examId: string;
	institutionId: string;
	actor: ExamEditorActor;
}) {
	const exam = await db.query.exams.findFirst({
		where: and(
			eq(schema.exams.id, options.examId),
			eq(schema.exams.institutionId, options.institutionId),
		),
		with: {
			classCourseRef: true,
		},
	});
	if (!exam) {
		throw notFound("Exam not found");
	}
	const access = await resolveActorAccess({
		exam,
		actor: options.actor,
	});
	if (!access) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return { exam, access };
}

export async function canActorEditExam(params: {
	exam: schema.Exam & { classCourseRef?: schema.ClassCourse | null };
	actor: ExamEditorActor;
}) {
	const access = await resolveActorAccess(params);
	return Boolean(access);
}

async function resolveActorAccess(params: {
	exam: schema.Exam & { classCourseRef?: schema.ClassCourse | null };
	actor: ExamEditorActor;
}) {
	const isAdmin = roleSatisfies(params.actor.memberRole, ADMIN_ROLES);
	if (isAdmin) return "admin";
	const profileId = params.actor.profileId;
	if (!profileId) return null;
	if (params.exam.classCourseRef?.teacher === profileId) {
		return "teacher";
	}
	const delegated = await repo.findByExamAndEditor(params.exam.id, profileId);
	return delegated ? "delegate" : null;
}

async function requireEditorCandidate(
	editorProfileId: string,
	institutionId: string,
) {
	const row = await db
		.select({
			id: schema.domainUsers.id,
			memberOrg: authSchema.member.organizationId,
		})
		.from(schema.domainUsers)
		.leftJoin(
			authSchema.member,
			eq(authSchema.member.id, schema.domainUsers.memberId),
		)
		.where(eq(schema.domainUsers.id, editorProfileId))
		.limit(1)
		.then((rows) => rows[0]);
	if (!row) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Editor not found" });
	}
	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
		columns: { organizationId: true },
	});
	if (!institution) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
	}
	if (row.memberOrg && row.memberOrg !== institution.organizationId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Editor does not belong to this institution",
		});
	}
	return row.id;
}

export async function assignEditor(opts: {
	examId: string;
	editorProfileId: string;
	grantedByProfileId: string | null;
	actor: ExamEditorActor;
	institutionId: string;
}) {
	await ensureActorCanEditExam({
		examId: opts.examId,
		institutionId: opts.institutionId,
		actor: opts.actor,
	});
	const editorProfileId = await requireEditorCandidate(
		opts.editorProfileId,
		opts.institutionId,
	);
	const grantedBy = opts.grantedByProfileId ?? opts.actor.profileId;
	try {
		return await repo.createEditor({
			examId: opts.examId,
			editorProfileId,
			grantedByProfileId: grantedBy,
		});
	} catch (error) {
		throw new TRPCError({ code: "CONFLICT", message: "Editor already assigned" });
	}
}

export async function listEditors(opts: {
	examId: string;
	institutionId: string;
}) {
	const exam = await db.query.exams.findFirst({
		where: and(
			eq(schema.exams.id, opts.examId),
			eq(schema.exams.institutionId, opts.institutionId),
		),
	});
	if (!exam) {
		throw notFound("Exam not found");
	}
	return repo.listByExam(opts.examId);
}

export async function revokeEditor(opts: {
	id: string;
	examId: string;
	institutionId: string;
	actor: ExamEditorActor;
}) {
	await ensureActorCanEditExam({
		examId: opts.examId,
		institutionId: opts.institutionId,
		actor: opts.actor,
	});
	const deleted = await repo.deleteEditor(opts.id, opts.examId);
	if (!deleted) {
		throw notFound("Delegate not found");
	}
	return deleted;
}
