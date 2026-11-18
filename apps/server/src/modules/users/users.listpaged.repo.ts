import {
	and,
	count,
	countDistinct,
	eq,
	exists,
	ilike,
	inArray,
	isNull,
	not,
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
	type EnrollmentStatus,
	enrollments,
	students,
} from "@/db/schema/app-schema";
import { member } from "@/db/schema/auth";

export type ListPagedOpts = {
	page: number;
	pageSize: number;
	institutionId: string;
	organizationId: string; // kept for legacy records without institutionId
	role?: BusinessRole;
	status?: DomainUserStatus;
	search?: string;
	classId?: string;
	academicYearId?: string;
	/** `students`: profiles with a student record; `staff`: everyone else. */
	audience?: "students" | "staff";
	enrollmentStatus?: EnrollmentStatus;
};

/** Account roles that a role filter also matches (an owner administers). */
const ROLE_ALIASES: Partial<Record<BusinessRole, string[]>> = {
	administrator: ["administrator", "owner", "super_admin"],
};

export async function listPaged(opts: ListPagedOpts) {
	const size = Math.min(Math.max(opts.pageSize ?? 25, 1), 100);
	const offset = (Math.max(opts.page ?? 1, 1) - 1) * size;
	// Students are the profiles with a student record (most have no account,
	// so the account role cannot identify them); the dashboard counts the same.
	const isStudent = opts.audience === "students" || opts.role === "student";
	const hasStudentRecord = exists(
		db
			.select({ id: students.id })
			.from(students)
			.where(eq(students.domainUserId, domainUsers.id)),
	);

	// Primary scope: profiles explicitly bound to this institution (new records).
	// Fallback: legacy profiles linked via member.organizationId but lacking institutionId.
	// This dual condition ensures no data loss during the migration period.
	const conditions: SQL[] = [
		or(
			eq(domainUsers.institutionId, opts.institutionId),
			and(
				isNull(domainUsers.institutionId),
				eq(member.organizationId, opts.organizationId),
			),
			// A student record of this institution also scopes the profile
			exists(
				db
					.select({ id: students.id })
					.from(students)
					.where(
						and(
							eq(students.domainUserId, domainUsers.id),
							eq(students.institutionId, opts.institutionId),
						),
					),
			),
		) as SQL,
	];
	if (isStudent) conditions.push(hasStudentRecord);
	else {
		if (opts.audience === "staff") conditions.push(not(hasStudentRecord));
		if (opts.role)
			conditions.push(
				inArray(member.role, ROLE_ALIASES[opts.role] ?? [opts.role]),
			);
	}
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
	if (isStudent && opts.enrollmentStatus) {
		conditions.push(eq(enrollments.status, opts.enrollmentStatus));
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
		memberId: domainUsers.memberId,
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
					domainUsers.memberId,
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
			items: rows.map((r) => ({ ...r, role: "student" as string | null })),
			total: totalCount,
			pageCount: Math.ceil(totalCount / size),
		};
	}

	const [rows, [{ total }]] = await Promise.all([
		db
			.select({
				...baseSelect,
				// A plain "member" account of a student shows as the student
				role: sql<
					string | null
				>`COALESCE(NULLIF(${member.role}, 'member'), CASE WHEN ${hasStudentRecord} THEN 'student' END, ${member.role})`,
			})
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
