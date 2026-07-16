import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type { DomainUserStatus, Gender } from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { conflict, notFound } from "@/modules/_shared/errors";
import { domainUsersRepo } from "@/modules/domain-users";
import * as pagedRepo from "./users.listpaged.repo";
import * as repo from "./users.repo";
import type { CreateUserWithAuthInput } from "./users.zod";

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
	memberId?: string;
	institutionId?: string;
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
		memberId: data.memberId ?? null,
		institutionId: data.institutionId ?? null,
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
	{
		organizationId,
		institutionId,
	}: { organizationId: string; institutionId?: string },
) {
	if (!data.canConnect) {
		return createUserProfile({ ...data, institutionId });
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
		return await createUserProfile({ ...data, memberId, institutionId });
	} catch (err) {
		await db
			.delete(authSchema.member)
			.where(eq(authSchema.member.id, memberId));
		await db.delete(authSchema.user).where(eq(authSchema.user.id, authUserId));
		throw err;
	}
}

export async function listUsersPaged(opts: pagedRepo.ListPagedOpts) {
	return pagedRepo.listPaged(opts);
}

/**
 * Links an existing auth account (identified by email) to a profile.
 * The auth user must already be a member of the organization.
 */
export async function linkAuthAccount(
	profileId: string,
	authUserEmail: string,
	organizationId: string,
) {
	const profile = await domainUsersRepo.findById(profileId);
	if (!profile) throw notFound("Profile not found");
	if (profile.memberId)
		throw conflict("This profile is already linked to an auth account");

	const [authUser] = await db
		.select({ id: authSchema.user.id })
		.from(authSchema.user)
		.where(eq(authSchema.user.email, authUserEmail))
		.limit(1);
	if (!authUser)
		throw notFound(`No account found with email "${authUserEmail}"`);

	const [orgMember] = await db
		.select({ id: authSchema.member.id })
		.from(authSchema.member)
		.where(
			and(
				eq(authSchema.member.userId, authUser.id),
				eq(authSchema.member.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!orgMember)
		throw notFound("This user is not a member of this organization");

	const alreadyLinked = await domainUsersRepo.findByMemberId(orgMember.id);
	if (alreadyLinked && alreadyLinked.id !== profileId)
		throw conflict("This account is already linked to another profile");

	await domainUsersRepo.update(profileId, { memberId: orgMember.id });
	return domainUsersRepo.findById(profileId);
}

/**
 * Creates a Better-Auth account for an existing profile that has no account yet.
 * Rolls back auth records on partial failure.
 */
export async function createAuthForProfile(
	profileId: string,
	data: { email: string; password: string; memberRole: string },
	{
		organizationId,
		institutionId,
	}: { organizationId: string; institutionId?: string },
) {
	const profile = await domainUsersRepo.findById(profileId);
	if (!profile) throw notFound("Profile not found");
	if (profile.memberId)
		throw conflict("This profile is already linked to an auth account");

	const [existing] = await db
		.select({ id: authSchema.user.id })
		.from(authSchema.user)
		.where(eq(authSchema.user.email, data.email))
		.limit(1);
	if (existing) throw new UserAlreadyExistsError(data.email);

	const fullName = `${profile.firstName} ${profile.lastName}`.trim();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const authResult = await (auth.api as any).createUser({
		body: {
			name: fullName,
			email: data.email,
			password: data.password,
			role: "user",
		},
	});
	const authUserId = (authResult as { user: { id: string } }).user.id;

	let memberId: string | null = null;
	try {
		const [newMember] = await db
			.insert(authSchema.member)
			.values({
				id: randomUUID(),
				organizationId,
				userId: authUserId,
				role: data.memberRole,
				createdAt: new Date(),
			})
			.returning();
		memberId = newMember.id;
	} catch (err) {
		await db.delete(authSchema.user).where(eq(authSchema.user.id, authUserId));
		throw err;
	}

	try {
		const updates: Record<string, unknown> = { memberId };
		if (institutionId) updates.institutionId = institutionId;
		await domainUsersRepo.update(profileId, updates);
		return domainUsersRepo.findById(profileId);
	} catch (err) {
		await db
			.delete(authSchema.member)
			.where(eq(authSchema.member.id, memberId!));
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
