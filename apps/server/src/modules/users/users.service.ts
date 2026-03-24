import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { DomainUserStatus, Gender } from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { domainUsersRepo } from "@/modules/domain-users";
import type { CreateUserWithAuthInput } from "./users.zod";
import * as repo from "./users.repo";

type CreateProfileInput = {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	dateOfBirth?: Date;
	placeOfBirth?: string;
	gender?: Gender;
	nationality?: string;
	status?: DomainUserStatus;
	authUserId?: string;
	memberId?: string;
};

type UpdateProfileInput = {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string | null;
	dateOfBirth?: Date | null;
	placeOfBirth?: string | null;
	gender?: Gender;
	nationality?: string | null;
	status?: DomainUserStatus;
	authUserId?: string | null;
	memberId?: string | null;
};

const normalizeDate = (value?: Date | null) => {
	if (!value) return null;
	return value.toISOString().split("T")[0];
};

export async function listUsers(opts: Parameters<typeof repo.list>[0]) {
	const result = await repo.list(opts);
	return {
		...result,
		items: result.items.map((item) => ({
			...item,
			id: item.profileId,
		})),
	};
}

export async function createUserProfile(data: CreateProfileInput) {
	return domainUsersRepo.create({
		firstName: data.firstName,
		lastName: data.lastName,
		primaryEmail: data.email,
		phone: data.phone ?? null,
		dateOfBirth: normalizeDate(data.dateOfBirth),
		placeOfBirth: data.placeOfBirth ?? null,
		gender: data.gender ?? "other",
		nationality: data.nationality ?? null,
		status: data.status ?? "active",
		authUserId: data.authUserId ?? null,
		memberId: data.memberId ?? null,
	});
}

export async function updateUserProfile(id: string, data: UpdateProfileInput) {
	const payload: Record<string, unknown> = {};
	if (data.firstName !== undefined) payload.firstName = data.firstName;
	if (data.lastName !== undefined) payload.lastName = data.lastName;
	if (data.email !== undefined) payload.primaryEmail = data.email;
	if (data.phone !== undefined) payload.phone = data.phone ?? null;
	if (data.dateOfBirth !== undefined)
		payload.dateOfBirth = normalizeDate(data.dateOfBirth);
	if (data.placeOfBirth !== undefined)
		payload.placeOfBirth = data.placeOfBirth ?? null;
	if (data.gender !== undefined) payload.gender = data.gender;
	if (data.nationality !== undefined)
		payload.nationality = data.nationality ?? null;
	if (data.status !== undefined) payload.status = data.status;
	if (data.authUserId !== undefined)
		payload.authUserId = data.authUserId ?? null;
	if (data.memberId !== undefined) payload.memberId = data.memberId ?? null;
	if (!Object.keys(payload).length) {
		return domainUsersRepo.findById(id);
	}
	await domainUsersRepo.update(id, payload);
	return domainUsersRepo.findById(id);
}

export async function deleteUserProfile(id: string) {
	await domainUsersRepo.remove(id);
}

export class UserAlreadyExistsError extends Error {
	constructor(email: string) {
		super(`A user with email "${email}" already exists`);
		this.name = "UserAlreadyExistsError";
	}
}

/**
 * Creates a user profile, optionally provisioning a Better-Auth account and org membership.
 *
 * - canConnect=false: creates a domain-only profile (no login access)
 * - canConnect=true: creates auth user + org member + domain profile, all linked.
 *   Rolls back any created records on partial failure to avoid orphaned data.
 */
export async function createUserWithAuth(
	data: CreateUserWithAuthInput,
	{ organizationId }: { organizationId: string },
) {
	if (!data.canConnect) {
		return createUserProfile(data);
	}

	// password and memberRole are guaranteed by schema superRefine when canConnect=true
	const password = data.password as string;
	const memberRole = data.memberRole as string;

	// db.query types are inferred via union (pg | pglite); cast mirrors the
	// existing pattern in lib/auth.ts which has the same structural constraint.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const existing = await (db as any).query.user.findFirst({
		where: eq(authSchema.user.email, data.email),
		columns: { id: true },
	});
	if (existing) {
		throw new UserAlreadyExistsError(data.email);
	}

	const fullName = `${data.firstName} ${data.lastName}`.trim();
	// auth.api.createUser is provided by the Better-Auth admin plugin; the
	// TypeScript return type is only fully inferred when the plugin is included
	// in the betterAuth() call. Cast to avoid the spurious compile error.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const authResult = await (auth.api as any).createUser({
		body: { name: fullName, email: data.email, password, role: "user" },
	});
	const authUserId = (authResult as { user: { id: string } }).user.id;

	let memberId: string | null = null;
	try {
		const [member] = await db
			.insert(authSchema.member)
			.values({
				id: randomUUID(),
				organizationId,
				userId: authUserId,
				role: memberRole,
				createdAt: new Date(),
			})
			.returning();
		memberId = member.id;
	} catch (err) {
		await db.delete(authSchema.user).where(eq(authSchema.user.id, authUserId));
		throw err;
	}

	try {
		return await createUserProfile({ ...data, authUserId, memberId });
	} catch (err) {
		await db
			.delete(authSchema.member)
			.where(eq(authSchema.member.id, memberId));
		await db.delete(authSchema.user).where(eq(authSchema.user.id, authUserId));
		throw err;
	}
}

export async function getMyProfile(profileId: string) {
	return domainUsersRepo.findById(profileId);
}

export async function updateMyProfile(
	profileId: string,
	data: {
		firstName?: string;
		lastName?: string;
		phone?: string | null;
		dateOfBirth?: Date | null;
		placeOfBirth?: string | null;
		gender?: Gender;
		nationality?: string | null;
	},
) {
	const payload: Record<string, unknown> = {};
	if (data.firstName !== undefined) payload.firstName = data.firstName;
	if (data.lastName !== undefined) payload.lastName = data.lastName;
	if (data.phone !== undefined) payload.phone = data.phone ?? null;
	if (data.dateOfBirth !== undefined)
		payload.dateOfBirth = normalizeDate(data.dateOfBirth);
	if (data.placeOfBirth !== undefined)
		payload.placeOfBirth = data.placeOfBirth ?? null;
	if (data.gender !== undefined) payload.gender = data.gender;
	if (data.nationality !== undefined)
		payload.nationality = data.nationality ?? null;
	if (!Object.keys(payload).length) {
		return domainUsersRepo.findById(profileId);
	}
	await domainUsersRepo.update(profileId, payload);
	return domainUsersRepo.findById(profileId);
}
