import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { GuardianCommunicationType } from "@/db/schema/app-schema";
import { notFound } from "../_shared/errors";
import * as repo from "./guardians.repo";
import type {
	createGuardianSchema,
	linkStudentSchema,
	recordCommunicationEventSchema,
	updatePreferencesSchema,
} from "./guardians.zod";

const eventPreferenceMap: Record<GuardianCommunicationType, string> = {
	results_published: "resultsPublished",
	attendance_threshold: "attendanceThreshold",
	fee_clearance: "feeClearance",
	document_available: "documentsAvailable",
};

function generateAccessToken() {
	return `gdn_${randomBytes(24).toString("hex")}`;
}

export async function createGuardian(
	institutionId: string,
	input: z.infer<typeof createGuardianSchema>,
) {
	const student = await repo.findStudent(institutionId, input.studentId);
	if (!student) throw notFound("Student not found");

	const email = input.email.trim().toLowerCase();
	let guardian = await repo.findGuardianByEmail(institutionId, email);
	if (!guardian) {
		guardian = await repo.createGuardian({
			institutionId,
			firstName: input.firstName.trim(),
			lastName: input.lastName.trim(),
			email,
			phone: input.phone ?? null,
			accessToken: generateAccessToken(),
			preferences: input.preferences ?? {},
			isActive: true,
		});
	}

	await repo.upsertStudentLink({
		institutionId,
		studentId: input.studentId,
		guardianId: guardian.id,
		relationshipType: input.relationshipType,
		isPrimary: input.isPrimary,
		isEmergencyContact: input.isEmergencyContact,
	});

	return guardian;
}

export async function linkStudent(
	institutionId: string,
	input: z.infer<typeof linkStudentSchema>,
) {
	const [guardian, student] = await Promise.all([
		repo.findGuardianById(institutionId, input.guardianId),
		repo.findStudent(institutionId, input.studentId),
	]);
	if (!guardian) throw notFound("Guardian not found");
	if (!student) throw notFound("Student not found");

	return repo.upsertStudentLink({
		institutionId,
		studentId: input.studentId,
		guardianId: input.guardianId,
		relationshipType: input.relationshipType,
		isPrimary: input.isPrimary,
		isEmergencyContact: input.isEmergencyContact,
	});
}

export async function listByStudent(institutionId: string, studentId: string) {
	const student = await repo.findStudent(institutionId, studentId);
	if (!student) throw notFound("Student not found");
	return repo.listByStudent(institutionId, studentId);
}

export async function portal(accessToken: string) {
	const guardian = await repo.findGuardianByAccessToken(accessToken);
	if (!guardian) throw notFound("Guardian portal access not found");

	const links = await repo.listLinksByGuardian(
		guardian.institutionId,
		guardian.id,
	);

	return {
		guardian: {
			id: guardian.id,
			firstName: guardian.firstName,
			lastName: guardian.lastName,
			email: guardian.email,
			phone: guardian.phone,
			preferences: guardian.preferences,
		},
		students: links.map((link) => ({
			id: link.studentId,
			registrationNumber: link.registrationNumber,
			classId: link.classId,
			firstName: link.profile.firstName,
			lastName: link.profile.lastName,
			email: link.profile.primaryEmail,
			relationshipType: link.relationshipType,
			isPrimary: link.isPrimary,
			isEmergencyContact: link.isEmergencyContact,
		})),
	};
}

export async function updatePreferences(
	institutionId: string,
	input: z.infer<typeof updatePreferencesSchema>,
) {
	const updated = await repo.updateGuardianPreferences(
		institutionId,
		input.guardianId,
		input.preferences,
	);
	if (!updated) throw notFound("Guardian not found");
	return updated;
}

export async function recordCommunicationEvent(
	institutionId: string,
	input: z.infer<typeof recordCommunicationEventSchema>,
) {
	const [guardian, student] = await Promise.all([
		repo.findGuardianById(institutionId, input.guardianId),
		repo.findStudent(institutionId, input.studentId),
	]);
	if (!guardian) throw notFound("Guardian not found");
	if (!student) throw notFound("Student not found");

	const links = await repo.listLinksByGuardian(institutionId, guardian.id);
	if (!links.some((link) => link.studentId === input.studentId)) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Guardian is not linked to this student",
		});
	}

	const preferenceKey = eventPreferenceMap[input.type];
	const enabled =
		guardian.preferences?.[
			preferenceKey as keyof typeof guardian.preferences
		] !== false;

	return repo.createCommunicationEvent({
		institutionId,
		guardianId: guardian.id,
		studentId: input.studentId,
		type: input.type,
		channel: input.channel,
		status: enabled ? "queued" : "skipped",
		reason: enabled ? null : "preference_disabled",
		payload: input.payload,
	});
}
