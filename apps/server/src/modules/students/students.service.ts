import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import * as classesRepo from "../classes/classes.repo";
import * as repo from "./students.repo";

type StudentProfileInput = {
	firstName: string;
	lastName: string;
	email: string;
	dateOfBirth: Date;
	placeOfBirth: string;
	gender: schema.Gender;
	phone?: string | null;
	nationality?: string | null;
	authUserId?: string | null;
};

type CreateStudentInput = {
	classId: string;
	registrationNumber: string;
	profile: StudentProfileInput;
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
	primaryEmail: p.email,
	phone: p.phone ?? null,
	dateOfBirth: p.dateOfBirth,
	placeOfBirth: p.placeOfBirth,
	gender: p.gender,
	nationality: p.nationality ?? null,
	status: "active" as schema.DomainUserStatus,
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

export async function createStudent(input: CreateStudentInput) {
	try {
		const studentId = await transaction(async (tx) => {
			const [profile] = await tx
				.insert(schema.domainUsers)
				.values(buildProfilePayload(input.profile))
				.returning();
			const [student] = await tx
				.insert(schema.students)
				.values({
					class: input.classId,
					registrationNumber: input.registrationNumber,
					domainUserId: profile.id,
				})
				.returning();
			return student.id;
		});
		const created = await repo.findById(studentId);
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

export async function bulkCreateStudents(data: {
	classId: string;
	students: Array<{
		registrationNumber: string;
		profile: StudentProfileInput;
	}>;
}) {
	const klass = await classesRepo.findById(data.classId);
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
			try {
				const [profile] = await tx
					.insert(schema.domainUsers)
					.values(buildProfilePayload(s.profile))
					.returning();
				profileId = profile.id;
				await tx.insert(schema.students).values({
					class: data.classId,
					registrationNumber: s.registrationNumber,
					domainUserId: profile.id,
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
					email: s.profile.email,
					registrationNumber: s.registrationNumber,
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
) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

	if (data.profile) {
		await db
			.update(schema.domainUsers)
			.set({
				firstName: data.profile.firstName ?? existing.profile.firstName,
				lastName: data.profile.lastName ?? existing.profile.lastName,
				primaryEmail: data.profile.email ?? existing.profile.primaryEmail,
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
		await repo.update(id, payload);
	}

	const updated = await repo.findById(id);
	if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
	return updated;
}

export async function listStudents(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getStudentById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}
