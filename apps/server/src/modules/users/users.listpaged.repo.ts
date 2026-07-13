import {
	and,
	count,
	countDistinct,
	eq,
	ilike,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
	type BusinessRole,
	classes,
	type DomainUserStatus,
	domainUsers,
	enrollments,
	students,
} from "@/db/schema/app-schema";
import { member } from "@/db/schema/auth";

export type ListPagedOpts = {
	page: number;
	pageSize: number;
	role?: BusinessRole;
	status?: DomainUserStatus;
	search?: string;
	classId?: string;
	academicYearId?: string;
};

export async function listPaged(opts: ListPagedOpts) {
	const size = Math.min(Math.max(opts.pageSize ?? 25, 1), 100);
	const offset = (Math.max(opts.page ?? 1, 1) - 1) * size;
	const isStudent = opts.role === "student";

	const conditions: SQL[] = [];
	if (opts.role) conditions.push(eq(member.role, opts.role));
	if (opts.status) conditions.push(eq(domainUsers.status, opts.status));
	if (opts.search) {
		const term = `%${opts.search.toLowerCase()}%`;
		conditions.push(
			or(
				ilike(domainUsers.firstName, term),
				ilike(domainUsers.lastName, term),
				ilike(domainUsers.primaryEmail, term),
			) as SQL,
		);
	}
	if (isStudent && opts.classId) {
		conditions.push(eq(enrollments.classId, opts.classId));
	}
	if (isStudent && opts.academicYearId) {
		conditions.push(eq(enrollments.academicYearId, opts.academicYearId));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	// Base columns shared across all roles
	const baseSelect = {
		id: domainUsers.id,
		firstName: domainUsers.firstName,
		lastName: domainUsers.lastName,
		primaryEmail: domainUsers.primaryEmail,
		phone: domainUsers.phone,
		status: domainUsers.status,
		role: member.role,
	} as const;

	if (isStudent) {
		const [rows, [{ total }]] = await Promise.all([
			db
				.select({
					...baseSelect,
					registrationNumber: students.registrationNumber,
					currentClassName: sql<string | null>`MAX(${classes.name})`,
					currentEnrollmentStatus: sql<
						string | null
					>`MAX(${enrollments.status})`,
				})
				.from(domainUsers)
				.leftJoin(member, eq(member.id, domainUsers.memberId))
				.leftJoin(students, eq(students.domainUserId, domainUsers.id))
				.leftJoin(enrollments, eq(enrollments.studentId, students.id))
				.leftJoin(classes, eq(classes.id, enrollments.classId))
				.where(where)
				.groupBy(
					domainUsers.id,
					domainUsers.firstName,
					domainUsers.lastName,
					domainUsers.primaryEmail,
					domainUsers.phone,
					domainUsers.status,
					member.role,
					students.registrationNumber,
				)
				.orderBy(domainUsers.lastName, domainUsers.firstName)
				.limit(size)
				.offset(offset),
			db
				.select({ total: countDistinct(domainUsers.id) })
				.from(domainUsers)
				.leftJoin(member, eq(member.id, domainUsers.memberId))
				.leftJoin(students, eq(students.domainUserId, domainUsers.id))
				.leftJoin(enrollments, eq(enrollments.studentId, students.id))
				.where(where),
		]);

		const totalCount = Number(total ?? 0);
		return {
			items: rows.map((r) => ({ ...r, role: r.role ?? null })),
			total: totalCount,
			pageCount: Math.ceil(totalCount / size),
		};
	}

	const [rows, [{ total }]] = await Promise.all([
		db
			.select(baseSelect)
			.from(domainUsers)
			.leftJoin(member, eq(member.id, domainUsers.memberId))
			.where(where)
			.orderBy(domainUsers.lastName, domainUsers.firstName)
			.limit(size)
			.offset(offset),
		db
			.select({ total: count() })
			.from(domainUsers)
			.leftJoin(member, eq(member.id, domainUsers.memberId))
			.where(where),
	]);

	const totalCount = Number(total ?? 0);
	return {
		items: rows.map((r) => ({ ...r, role: r.role ?? null })),
		total: totalCount,
		pageCount: Math.ceil(totalCount / size),
	};
}
