import { and, eq, gt, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
	type BusinessRole,
	type DomainUserStatus,
	domainUsers,
	type NewDomainUser,
} from "@/db/schema/app-schema";
import { user } from "@/db/schema/auth";

export async function create(data: NewDomainUser) {
	const [profile] = await db.insert(domainUsers).values(data).returning();
	return profile;
}

export async function remove(id: string) {
	await db.delete(domainUsers).where(eq(domainUsers.id, id));
}

export async function update(id: string, data: Partial<NewDomainUser>) {
	const [profile] = await db
		.update(domainUsers)
		.set(data)
		.where(eq(domainUsers.id, id))
		.returning();
	return profile;
}

export async function findById(id: string) {
	return db.query.domainUsers.findFirst({
		where: eq(domainUsers.id, id),
	});
}

export async function getDomainsByAuthUserId(id: string) {
	return db.query.domainUsers.findMany({
		where: eq(domainUsers.authUserId, id),
	});
}

export async function findByAuthUserId(authUserId: string) {
	return db.query.domainUsers.findFirst({
		where: eq(domainUsers.authUserId, authUserId),
	});
}

type ListOpts = {
	cursor?: string | null;
	limit?: number;
	role?: BusinessRole;
	status?: DomainUserStatus;
	roles?: BusinessRole[];
	banned?: boolean;
	emailVerified?: boolean;
};

export async function list(opts: ListOpts) {
	const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
	let condition: SQL<unknown> | undefined;
	if (opts.role) {
		condition = eq(domainUsers.businessRole, opts.role);
	}
	if (opts.roles && opts.roles.length > 0) {
		const rolesCond = inArray(domainUsers.businessRole, opts.roles);
		condition = condition ? and(condition, rolesCond) : rolesCond;
	}
	if (opts.status) {
		const statusCond = eq(domainUsers.status, opts.status);
		condition = condition ? and(condition, statusCond) : statusCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(domainUsers.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	if (opts.banned !== undefined) {
		const bannedCond = eq(user.banned, opts.banned);
		condition = condition ? and(condition, bannedCond) : bannedCond;
	}
	if (opts.emailVerified !== undefined) {
		const verifiedCond = eq(user.emailVerified, opts.emailVerified);
		condition = condition ? and(condition, verifiedCond) : verifiedCond;
	}

	const rows = await db
		.select({
			profileId: domainUsers.id,
			businessRole: domainUsers.businessRole,
			firstName: domainUsers.firstName,
			lastName: domainUsers.lastName,
			primaryEmail: domainUsers.primaryEmail,
			phone: domainUsers.phone,
			dateOfBirth: domainUsers.dateOfBirth,
			placeOfBirth: domainUsers.placeOfBirth,
			gender: domainUsers.gender,
			nationality: domainUsers.nationality,
			status: domainUsers.status,
			authUserId: domainUsers.authUserId,
			authUser: {
				id: user.id,
				email: user.email,
				role: user.role,
				banned: user.banned,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
			},
		})
		.from(domainUsers)
		.leftJoin(user, eq(user.id, domainUsers.authUserId))
		.where(condition)
		.orderBy(domainUsers.id)
		.limit(limit + 1);

	let nextCursor: string | undefined;
	let items = rows;
	if (rows.length > limit) {
		items = rows.slice(0, limit);
		nextCursor = items[items.length - 1]?.profileId;
	}

	return { items, nextCursor };
}
