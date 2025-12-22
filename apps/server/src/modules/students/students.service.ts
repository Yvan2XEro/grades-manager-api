import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import * as classesRepo from "../classes/classes.repo";
import * as enrollmentsRepo from "../enrollments/enrollments.repo";
import * as registrationNumbersService from "../registration-numbers/registration-numbers.service";
import * as studentCreditLedgerService from "../student-credit-ledger/student-credit-ledger.service";
import * as repo from "./students.repo";

type StudentProfileInput = Pick<
	schema.NewDomainUser,
	| "firstName"
	| "lastName"
	| "primaryEmail"
	| "dateOfBirth"
	| "placeOfBirth"
	| "gender"
	| "phone"
	| "nationality"
	| "authUserId"
>;

type CreateStudentInput = {
	classId: string;
	registrationNumber?: string;
	registrationFormatId?: string;
	profile: StudentProfileInput;
	admissionType?: schema.AdmissionType;
	transferInstitution?: string;
	transferCredits?: number;
	transferLevel?: string;
	admissionJustification?: string;
	admissionDate?: Date;
};

const conflictMarkers = [
	"uq_students_registration",
	"uq_domain_users_email",
	"duplicate key value",
];

const buildProfilePayload = (p: StudentProfileInput) => ({
	authUserId: p.authUserId ?? null,
	businessRole: "student" as schema.BusinessRole,
	firstName: p.firstName,
	lastName: p.lastName,
	primaryEmail: p.primaryEmail,
	phone: p.phone ?? null,
	dateOfBirth: p.dateOfBirth ?? null,
	placeOfBirth: p.placeOfBirth ?? null,
	gender: p.gender ?? null,
	nationality: p.nationality ?? null,
	status: "active" as schema.DomainUserStatus,
});

const toRegistrationProfile = (p: StudentProfileInput) => ({
	firstName: p.firstName,
	lastName: p.lastName,
	nationality: p.nationality,
});

const extractErrorMessage = (error: unknown): string => {
	if (!error) return "";
	if (error instanceof Error) {
		const causeMessage =
			error.cause && typeof (error.cause as Error)?.message === "string"
				? (error.cause as Error).message
				: "";
		return `${error.message} ${causeMessage}`.trim();
	}
	if (typeof error === "object" && error !== null && "message" in error) {
		return String((error as { message?: unknown }).message ?? "");
	}
	return String(error ?? "");
};

const mapConflict = (error: unknown) => {
	const message = extractErrorMessage(error);
	return conflictMarkers.some((marker) => message.includes(marker));
};

export async function createStudent(
	input: CreateStudentInput,
	institutionId: string,
) {
	const klass = await classesRepo.findById(input.classId, institutionId);
	if (!klass)
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	const registrationProfile = toRegistrationProfile(input.profile);
	try {
		const studentId = await transaction(async (tx) => {
			const registrationNumber =
				input.registrationNumber ??
				(await registrationNumbersService.issueRegistrationNumber({
					klass,
					profile: registrationProfile,
					tx,
					formatId: input.registrationFormatId,
				}));
			const [profile] = await tx
				.insert(schema.domainUsers)
				.values(buildProfilePayload(input.profile))
				.returning();
			const [student] = await tx
				.insert(schema.students)
				.values({
					class: input.classId,
					registrationNumber,
					domainUserId: profile.id,
					institutionId: klass.institutionId,
				})
				.returning();
			await tx.insert(schema.enrollments).values({
				studentId: student.id,
				classId: input.classId,
				academicYearId: klass.academicYear,
				institutionId: klass.institutionId,
				status: "active",
				// External admission fields stored in enrollment
				admissionType: input.admissionType ?? "normal",
				transferInstitution: input.transferInstitution ?? null,
				transferCredits: input.transferCredits ?? 0,
				transferLevel: input.transferLevel ?? null,
				admissionJustification: input.admissionJustification ?? null,
				admissionDate: input.admissionDate ?? null,
				// Keep metadata for backward compatibility
				admissionMetadata:
					input.admissionType && input.admissionType !== "normal"
						? {
								admissionType: input.admissionType,
								transferInstitution: input.transferInstitution,
								transferCredits: input.transferCredits,
								transferLevel: input.transferLevel,
								justification: input.admissionJustification,
							}
						: {},
			});
			return student.id;
		});

		// Register transfer credits in student credit ledger if any
		if (input.transferCredits && input.transferCredits > 0) {
			await studentCreditLedgerService.applyDelta(
				studentId,
				klass.academicYear,
				0, // deltaProgress = 0 (transfer credits are already earned, not in progress)
				input.transferCredits, // deltaEarned = transfer credits
				60, // Default required credits (will be updated based on class requirements)
			);
		}
		const created = await repo.findById(studentId, institutionId);
		if (!created) {
			throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
		}
		return created;
	} catch (error) {
		if (mapConflict(error)) {
			throw new TRPCError({ code: "CONFLICT" });
		}
		throw error;
	}
}

export async function bulkCreateStudents(
	data: {
		classId: string;
		registrationFormatId?: string;
		students: Array<{
			registrationNumber?: string;
			profile: StudentProfileInput;
		}>;
	},
	institutionId: string,
) {
	const klass = await classesRepo.findById(data.classId, institutionId);
	if (!klass) throw new TRPCError({ code: "NOT_FOUND" });

	const conflicts: Array<{
		row: number;
		email?: string;
		registrationNumber?: string;
		reason: string;
	}> = [];
	const errors: Array<{ row: number; reason: string }> = [];
	let createdCount = 0;

	await transaction(async (tx) => {
		for (let i = 0; i < data.students.length; i++) {
			const s = data.students[i];
			let profileId: string | undefined;
			let attemptedRegistration: string | undefined;
			try {
				const registrationProfile = toRegistrationProfile(s.profile);
				const registrationNumber =
					s.registrationNumber ??
					(await registrationNumbersService.issueRegistrationNumber({
						klass,
						profile: registrationProfile,
						tx,
						formatId: data.registrationFormatId,
					}));
				attemptedRegistration = registrationNumber;
				const [profile] = await tx
					.insert(schema.domainUsers)
					.values(buildProfilePayload(s.profile))
					.returning();
				profileId = profile.id;
				const [student] = await tx
					.insert(schema.students)
					.values({
						class: data.classId,
						registrationNumber,
						domainUserId: profile.id,
						institutionId: klass.institutionId,
					})
					.returning();
				await tx.insert(schema.enrollments).values({
					studentId: student.id,
					classId: data.classId,
					academicYearId: klass.academicYear,
					institutionId: klass.institutionId,
					status: "active",
				});
				createdCount++;
			} catch (error) {
				if (profileId) {
					await tx
						.delete(schema.domainUsers)
						.where(eq(schema.domainUsers.id, profileId));
				}
				const message = String((error as Error)?.message ?? "");
				let reason = "Unknown error";
				if (message.includes("uq_domain_users_email")) {
					reason = "Email already exists";
				} else if (message.includes("uq_students_registration")) {
					reason = "Registration number already exists";
				}
				conflicts.push({
					row: i + 1,
					email: s.profile.primaryEmail,
					registrationNumber: attemptedRegistration ?? s.registrationNumber,
					reason,
				});
			}
		}
	});

	return { createdCount, conflicts, errors };
}

export async function updateStudent(
	id: string,
	data: {
		classId?: string;
		registrationNumber?: string;
		profile?: Partial<StudentProfileInput>;
	},
	institutionId: string,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

	if (data.profile) {
		await db
			.update(schema.domainUsers)
			.set({
				firstName: data.profile.firstName ?? existing.profile.firstName,
				lastName: data.profile.lastName ?? existing.profile.lastName,
				primaryEmail:
					data.profile.primaryEmail ?? existing.profile.primaryEmail,
				dateOfBirth: data.profile.dateOfBirth ?? existing.profile.dateOfBirth,
				placeOfBirth:
					data.profile.placeOfBirth ?? existing.profile.placeOfBirth,
				gender: data.profile.gender ?? existing.profile.gender,
				phone:
					data.profile.phone !== undefined
						? data.profile.phone
						: existing.profile.phone,
				nationality:
					data.profile.nationality !== undefined
						? data.profile.nationality
						: existing.profile.nationality,
			})
			.where(eq(schema.domainUsers.id, existing.profile.id));
	}

	if (data.classId || data.registrationNumber) {
		const payload: Partial<schema.NewStudent> = {};
		if (data.classId) payload.class = data.classId;
		if (data.registrationNumber) {
			payload.registrationNumber = data.registrationNumber;
		}
		if (data.classId) {
			const newClass = await classesRepo.findById(data.classId, institutionId);
			if (!newClass) throw new TRPCError({ code: "NOT_FOUND" });
			payload.institutionId = newClass.institutionId;
			await repo.update(id, payload, institutionId);
			await enrollmentsRepo.closeActive(id, "completed", institutionId);
			await enrollmentsRepo.create({
				studentId: id,
				classId: data.classId,
				academicYearId: newClass.academicYear,
				institutionId: newClass.institutionId,
				status: "active",
			});
		} else {
			await repo.update(id, payload, institutionId);
		}
	}

	const updated = await repo.findById(id, institutionId);
	if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
	return updated;
}

export async function listStudents(
	opts: Parameters<typeof repo.list>[0],
	institutionId: string,
) {
	return repo.list({ ...opts, institutionId });
}

export async function getStudentById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function admitExternalStudent(
	data: {
		classId: string;
		registrationNumber?: string;
		registrationFormatId?: string;
		profile: StudentProfileInput;
		admissionType: schema.AdmissionType;
		transferInstitution: string;
		transferCredits: number;
		transferLevel: string;
		admissionJustification: string;
		admissionDate: Date;
	},
	institutionId: string,
) {
	// Validate admission type (must not be "normal")
	if (data.admissionType === "normal") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Use createStudent for normal admissions. admissionType must be transfer, direct, or equivalence.",
		});
	}

	// Use the standard createStudent function with external admission fields
	return createStudent(
		{
			classId: data.classId,
			registrationNumber: data.registrationNumber,
			registrationFormatId: data.registrationFormatId,
			profile: data.profile,
			admissionType: data.admissionType,
			transferInstitution: data.transferInstitution,
			transferCredits: data.transferCredits,
			transferLevel: data.transferLevel,
			admissionJustification: data.admissionJustification,
			admissionDate: data.admissionDate,
		},
		institutionId,
	);
}
