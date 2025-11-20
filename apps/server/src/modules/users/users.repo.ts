import { and, eq, gt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
	type BusinessRole,
	type DomainUserStatus,
	domainUsers,
} from "@/db/schema/app-schema";
import { user } from "@/db/schema/auth";

type ListOpts = {
	cursor?: string | null;
	limit?: number;
	role?: BusinessRole;
	status?: DomainUserStatus;
	banned?: boolean;
	emailVerified?: boolean;
};

export async function list(opts: ListOpts) {
	const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
	let condition: SQL<unknown> | undefined;
	if (opts.role) {
		condition = eq(domainUsers.businessRole, opts.role);
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
			authUserId: domainUsers.authUserId,
			businessRole: domainUsers.businessRole,
			firstName: domainUsers.firstName,
			lastName: domainUsers.lastName,
			email: domainUsers.primaryEmail,
			phone: domainUsers.phone,
			status: domainUsers.status,
			gender: domainUsers.gender,
			dateOfBirth: domainUsers.dateOfBirth,
			placeOfBirth: domainUsers.placeOfBirth,
			nationality: domainUsers.nationality,
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
	if (rows.length > limit) {
		const next = rows.pop();
		nextCursor = next?.profileId;
	}

	return { items: rows, nextCursor };
}
