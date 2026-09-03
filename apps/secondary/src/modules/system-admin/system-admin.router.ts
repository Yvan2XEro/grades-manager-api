import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import * as authSchema from "../../db/auth";
import * as schema from "../../db/schema";
import { printTemplateTypes } from "../../db/schema";
import { auth } from "../../lib/auth";
import { systemAdminProcedure, router as trpcRouter } from "../../lib/trpc";

function generateOrgId(): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	return Array.from(crypto.getRandomValues(new Uint8Array(21)))
		.map((b) => chars[b % chars.length])
		.join("");
}

function toSlug(name: string, suffix: string): string {
	return `${name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40)}-${suffix}`;
}

const INST_SORT_COLS = {
	name: schema.institutions.name,
	city: schema.institutions.city,
	type: schema.institutions.type,
	createdAt: schema.institutions.createdAt,
} as const;

const USER_SORT_COLS = {
	name: authSchema.user.name,
	email: authSchema.user.email,
	createdAt: authSchema.user.createdAt,
} as const;

export const router = trpcRouter({
	// ─── Global stats ──────────────────────────────────────────────────────────────
	stats: systemAdminProcedure.query(async ({ ctx }) => {
		const [instCount] = await ctx.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.institutions);
		const [userCount] = await ctx.db
			.select({ count: sql<number>`count(*)::int` })
			.from(authSchema.user);
		const [bannedCount] = await ctx.db
			.select({ count: sql<number>`count(*)::int` })
			.from(authSchema.user)
			.where(eq(authSchema.user.banned, true));
		const [suspendedCount] = await ctx.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.institutions)
			.where(eq(schema.institutions.suspended, true));
		return {
			institutions: instCount?.count ?? 0,
			users: userCount?.count ?? 0,
			bannedUsers: bannedCount?.count ?? 0,
			suspendedInstitutions: suspendedCount?.count ?? 0,
		};
	}),

	// ─── Time series for charts ────────────────────────────────────────────────────
	globalTimeSeries: systemAdminProcedure.query(async ({ ctx }) => {
		const instRows = await ctx.db.execute(
			sql`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*)::int as count
          FROM institutions
          WHERE created_at >= now() - interval '12 months'
          GROUP BY 1 ORDER BY 1`,
		);
		const userRows = await ctx.db.execute(
			sql`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*)::int as count
          FROM "user"
          WHERE created_at >= now() - interval '12 months'
          GROUP BY 1 ORDER BY 1`,
		);
		return {
			institutions: (instRows.rows as { month: string; count: number }[]).map(
				(r) => ({ month: r.month, count: Number(r.count) }),
			),
			users: (userRows.rows as { month: string; count: number }[]).map((r) => ({
				month: r.month,
				count: Number(r.count),
			})),
		};
	}),

	// ─── Institutions list ─────────────────────────────────────────────────────────
	listInstitutions: systemAdminProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(20),
				search: z.string().optional(),
				type: z.enum(["lycee", "college", "mixed"]).optional(),
				status: z.enum(["active", "suspended"]).optional(),
				sortBy: z
					.enum(["name", "city", "type", "createdAt"])
					.optional()
					.default("createdAt"),
				sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;
			const conditions = [];
			if (input.search)
				conditions.push(ilike(schema.institutions.name, `%${input.search}%`));
			if (input.type) conditions.push(eq(schema.institutions.type, input.type));
			if (input.status === "active")
				conditions.push(eq(schema.institutions.suspended, false));
			if (input.status === "suspended")
				conditions.push(eq(schema.institutions.suspended, true));
			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const col =
				INST_SORT_COLS[input.sortBy ?? "createdAt"] ??
				schema.institutions.createdAt;
			const orderFn = input.sortDir === "asc" ? asc : desc;

			const rows = await ctx.db
				.select({
					id: schema.institutions.id,
					orgId: schema.institutions.orgId,
					name: schema.institutions.name,
					type: schema.institutions.type,
					city: schema.institutions.city,
					minesecCode: schema.institutions.minesecCode,
					assessmentMode: schema.institutions.assessmentMode,
					suspended: schema.institutions.suspended,
					logoUrl: schema.institutions.logoUrl,
					createdAt: schema.institutions.createdAt,
					studentCount: sql<number>`(SELECT count(*)::int FROM students WHERE institution_id = institutions.id)`,
					staffCount: sql<number>`(SELECT count(*)::int FROM staff WHERE institution_id = institutions.id)`,
					classCount: sql<number>`(SELECT count(*)::int FROM classes WHERE institution_id = institutions.id)`,
					memberCount: sql<number>`(SELECT count(*)::int FROM member WHERE organization_id = institutions.org_id)`,
					hasActiveYear: sql<boolean>`EXISTS(SELECT 1 FROM academic_years WHERE institution_id = institutions.id AND status = 'active')`,
				})
				.from(schema.institutions)
				.where(where)
				.orderBy(orderFn(col))
				.limit(input.pageSize)
				.offset(offset);

			const [total] = await ctx.db
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.institutions)
				.where(where);

			return { rows, total: total?.count ?? 0 };
		}),

	getInstitution: systemAdminProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					id: schema.institutions.id,
					orgId: schema.institutions.orgId,
					name: schema.institutions.name,
					type: schema.institutions.type,
					city: schema.institutions.city,
					minesecCode: schema.institutions.minesecCode,
					assessmentMode: schema.institutions.assessmentMode,
					suspended: schema.institutions.suspended,
					logoUrl: schema.institutions.logoUrl,
					phone: schema.institutions.phone,
					email: schema.institutions.email,
					address: schema.institutions.address,
					createdAt: schema.institutions.createdAt,
					updatedAt: schema.institutions.updatedAt,
					orgSlug: sql<
						string | null
					>`(SELECT slug FROM organization WHERE id = institutions.org_id)`,
					studentCount: sql<number>`(SELECT count(*)::int FROM students WHERE institution_id = institutions.id)`,
					staffCount: sql<number>`(SELECT count(*)::int FROM staff WHERE institution_id = institutions.id)`,
					classCount: sql<number>`(SELECT count(*)::int FROM classes WHERE institution_id = institutions.id)`,
					academicYearCount: sql<number>`(SELECT count(*)::int FROM academic_years WHERE institution_id = institutions.id)`,
					hasActiveYear: sql<boolean>`EXISTS(SELECT 1 FROM academic_years WHERE institution_id = institutions.id AND status = 'active')`,
					memberCount: sql<number>`(SELECT count(*)::int FROM member WHERE organization_id = institutions.org_id)`,
				})
				.from(schema.institutions)
				.where(eq(schema.institutions.id, input.id))
				.limit(1);
			return rows[0] ?? null;
		}),

	// ─── Institution members ───────────────────────────────────────────────────────
	listInstitutionMembers: systemAdminProcedure
		.input(
			z.object({
				institutionId: z.string(),
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(20),
				sortBy: z
					.enum(["name", "email", "orgRole", "joinedAt"])
					.optional()
					.default("joinedAt"),
				sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;
			const [inst] = await ctx.db
				.select({ orgId: schema.institutions.orgId })
				.from(schema.institutions)
				.where(eq(schema.institutions.id, input.institutionId))
				.limit(1);
			if (!inst?.orgId) return { rows: [], total: 0 };

			const sortColMap = {
				name: authSchema.user.name,
				email: authSchema.user.email,
				orgRole: authSchema.member.role,
				joinedAt: authSchema.member.createdAt,
			} as const;
			const col = sortColMap[input.sortBy ?? "joinedAt"];
			const orderFn = input.sortDir === "asc" ? asc : desc;

			const rows = await ctx.db
				.select({
					userId: authSchema.member.userId,
					name: authSchema.user.name,
					email: authSchema.user.email,
					orgRole: authSchema.member.role,
					joinedAt: authSchema.member.createdAt,
				})
				.from(authSchema.member)
				.innerJoin(
					authSchema.user,
					eq(authSchema.user.id, authSchema.member.userId),
				)
				.where(eq(authSchema.member.organizationId, inst.orgId))
				.orderBy(orderFn(col))
				.limit(input.pageSize)
				.offset(offset);

			const [total] = await ctx.db
				.select({ count: sql<number>`count(*)::int` })
				.from(authSchema.member)
				.where(eq(authSchema.member.organizationId, inst.orgId));

			return { rows, total: total?.count ?? 0 };
		}),

	listInstitutionAcademicYears: systemAdminProcedure
		.input(z.object({ institutionId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					id: schema.academicYears.id,
					name: schema.academicYears.name,
					status: schema.academicYears.status,
					startDate: schema.academicYears.startDate,
					endDate: schema.academicYears.endDate,
					assessmentMode: schema.academicYears.assessmentMode,
					termCount: sql<number>`(SELECT count(*)::int FROM terms WHERE academic_year_id = academic_years.id)`,
					classCount: sql<number>`(SELECT count(*)::int FROM classes WHERE academic_year_id = academic_years.id)`,
				})
				.from(schema.academicYears)
				.where(eq(schema.academicYears.institutionId, input.institutionId))
				.orderBy(desc(schema.academicYears.startDate));
		}),

	// ─── Institution CRUD ──────────────────────────────────────────────────────────
	createInstitution: systemAdminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				type: z.enum(["lycee", "college", "mixed"]).default("lycee"),
				city: z.string().optional(),
				minesecCode: z.string().optional(),
				phone: z.string().optional(),
				email: z.string().email().optional(),
				address: z.string().optional(),
				ownerUserId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = generateOrgId();
			const slug = toSlug(input.name, orgId.slice(0, 6).toLowerCase());

			await ctx.db.insert(authSchema.organization).values({
				id: orgId,
				name: input.name,
				slug,
				createdAt: new Date(),
			});

			const [institution] = await ctx.db
				.insert(schema.institutions)
				.values({
					name: input.name,
					type: input.type,
					city: input.city,
					minesecCode: input.minesecCode,
					phone: input.phone,
					email: input.email,
					address: input.address,
					orgId,
				})
				.returning();

			if (input.ownerUserId) {
				const [owner] = await ctx.db
					.select({ id: authSchema.user.id })
					.from(authSchema.user)
					.where(eq(authSchema.user.id, input.ownerUserId))
					.limit(1);
				if (owner) {
					await ctx.db.insert(authSchema.member).values({
						id: generateOrgId(),
						organizationId: orgId,
						userId: input.ownerUserId,
						role: "admin",
						createdAt: new Date(),
					});
				}
			}

			return institution;
		}),

	updateInstitution: systemAdminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				type: z.enum(["lycee", "college", "mixed"]).optional(),
				city: z.string().optional(),
				minesecCode: z.string().optional(),
				phone: z.string().optional(),
				email: z.string().email().optional(),
				address: z.string().optional(),
				logoUrl: z.string().optional().nullable(),
				assessmentMode: z.enum(["six_sequence", "composition"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...fields } = input;
			const [updated] = await ctx.db
				.update(schema.institutions)
				.set({ ...fields, updatedAt: new Date() })
				.where(eq(schema.institutions.id, id))
				.returning();
			if (!updated)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Institution not found",
				});
			return updated;
		}),

	deleteInstitution: systemAdminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [inst] = await ctx.db
				.select({ orgId: schema.institutions.orgId })
				.from(schema.institutions)
				.where(eq(schema.institutions.id, input.id))
				.limit(1);
			// Delete the org (cascade removes members/invitations), then the institution
			if (inst?.orgId) {
				await ctx.db
					.delete(authSchema.organization)
					.where(eq(authSchema.organization.id, inst.orgId));
			}
			await ctx.db
				.delete(schema.institutions)
				.where(eq(schema.institutions.id, input.id));
			return { ok: true };
		}),

	suspendInstitution: systemAdminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(schema.institutions)
				.set({ suspended: true })
				.where(eq(schema.institutions.id, input.id));
			return { ok: true };
		}),

	activateInstitution: systemAdminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(schema.institutions)
				.set({ suspended: false })
				.where(eq(schema.institutions.id, input.id));
			return { ok: true };
		}),

	// ─── Member management ─────────────────────────────────────────────────────────
	addMember: systemAdminProcedure
		.input(
			z.object({
				institutionId: z.string(),
				userId: z.string(),
				role: z.enum(["admin", "member"]).default("member"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [inst] = await ctx.db
				.select({ orgId: schema.institutions.orgId })
				.from(schema.institutions)
				.where(eq(schema.institutions.id, input.institutionId))
				.limit(1);
			if (!inst?.orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Institution has no linked organization",
				});

			const [existing] = await ctx.db
				.select({ id: authSchema.member.id })
				.from(authSchema.member)
				.where(
					and(
						eq(authSchema.member.organizationId, inst.orgId),
						eq(authSchema.member.userId, input.userId),
					),
				)
				.limit(1);
			if (existing)
				throw new TRPCError({
					code: "CONFLICT",
					message: "User is already a member of this institution",
				});

			await ctx.db.insert(authSchema.member).values({
				id: generateOrgId(),
				organizationId: inst.orgId,
				userId: input.userId,
				role: input.role,
				createdAt: new Date(),
			});
			return { ok: true };
		}),

	updateMemberRole: systemAdminProcedure
		.input(
			z.object({
				institutionId: z.string(),
				userId: z.string(),
				role: z.enum(["admin", "member"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [inst] = await ctx.db
				.select({ orgId: schema.institutions.orgId })
				.from(schema.institutions)
				.where(eq(schema.institutions.id, input.institutionId))
				.limit(1);
			if (!inst?.orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Institution has no linked organization",
				});
			await ctx.db
				.update(authSchema.member)
				.set({ role: input.role })
				.where(
					and(
						eq(authSchema.member.organizationId, inst.orgId),
						eq(authSchema.member.userId, input.userId),
					),
				);
			return { ok: true };
		}),

	removeMember: systemAdminProcedure
		.input(z.object({ institutionId: z.string(), userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [inst] = await ctx.db
				.select({ orgId: schema.institutions.orgId })
				.from(schema.institutions)
				.where(eq(schema.institutions.id, input.institutionId))
				.limit(1);
			if (!inst?.orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Institution has no linked organization",
				});
			await ctx.db
				.delete(authSchema.member)
				.where(
					and(
						eq(authSchema.member.organizationId, inst.orgId),
						eq(authSchema.member.userId, input.userId),
					),
				);
			return { ok: true };
		}),

	// ─── Users list ────────────────────────────────────────────────────────────────
	listUsers: systemAdminProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(20),
				search: z.string().optional(),
				role: z.enum(["admin", "user"]).optional(),
				banned: z.boolean().optional(),
				sortBy: z
					.enum(["name", "email", "createdAt"])
					.optional()
					.default("createdAt"),
				sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;
			const conditions = [];
			if (input.search) {
				conditions.push(
					or(
						ilike(authSchema.user.name, `%${input.search}%`),
						ilike(authSchema.user.email, `%${input.search}%`),
					),
				);
			}
			if (input.role === "admin")
				conditions.push(eq(authSchema.user.role, "admin"));
			if (input.role === "user")
				conditions.push(
					or(isNull(authSchema.user.role), eq(authSchema.user.role, "user")),
				);
			if (input.banned === true)
				conditions.push(eq(authSchema.user.banned, true));
			if (input.banned === false)
				conditions.push(
					or(isNull(authSchema.user.banned), eq(authSchema.user.banned, false)),
				);
			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const col =
				USER_SORT_COLS[input.sortBy ?? "createdAt"] ??
				authSchema.user.createdAt;
			const orderFn = input.sortDir === "asc" ? asc : desc;

			const rows = await ctx.db
				.select({
					id: authSchema.user.id,
					name: authSchema.user.name,
					email: authSchema.user.email,
					role: authSchema.user.role,
					banned: authSchema.user.banned,
					banReason: authSchema.user.banReason,
					createdAt: authSchema.user.createdAt,
					institutionCount: sql<number>`(SELECT count(*)::int FROM member WHERE user_id = "user".id)`,
					lastSeenAt: sql<
						string | null
					>`(SELECT max(updated_at) FROM session WHERE user_id = "user".id)`,
				})
				.from(authSchema.user)
				.where(where)
				.orderBy(orderFn(col))
				.limit(input.pageSize)
				.offset(offset);

			const [total] = await ctx.db
				.select({ count: sql<number>`count(*)::int` })
				.from(authSchema.user)
				.where(where);

			return { rows, total: total?.count ?? 0 };
		}),

	getUser: systemAdminProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const [user] = await ctx.db
				.select({
					id: authSchema.user.id,
					name: authSchema.user.name,
					email: authSchema.user.email,
					role: authSchema.user.role,
					banned: authSchema.user.banned,
					banReason: authSchema.user.banReason,
					banExpires: authSchema.user.banExpires,
					emailVerified: authSchema.user.emailVerified,
					createdAt: authSchema.user.createdAt,
					lastSeenAt: sql<
						string | null
					>`(SELECT max(updated_at) FROM session WHERE user_id = "user".id)`,
					sessionCount: sql<number>`(SELECT count(*)::int FROM session WHERE user_id = "user".id AND expires_at > now())`,
				})
				.from(authSchema.user)
				.where(eq(authSchema.user.id, input.userId))
				.limit(1);
			if (!user) return null;

			const memberships = await ctx.db
				.select({
					institutionId: schema.institutions.id,
					institutionName: schema.institutions.name,
					institutionType: schema.institutions.type,
					institutionSuspended: schema.institutions.suspended,
					orgRole: authSchema.member.role,
					joinedAt: authSchema.member.createdAt,
				})
				.from(authSchema.member)
				.leftJoin(
					schema.institutions,
					eq(schema.institutions.orgId, authSchema.member.organizationId),
				)
				.where(eq(authSchema.member.userId, input.userId))
				.orderBy(desc(authSchema.member.createdAt));

			return { ...user, memberships };
		}),

	// ─── User actions (Better Auth admin plugin) ───────────────────────────────────
	createUser: systemAdminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				password: z.string().min(8),
				role: z.enum(["user", "admin"]).default("user"),
			}),
		)
		.mutation(async ({ input }) => {
			const result = await auth.api.createUser({
				body: {
					name: input.name,
					email: input.email,
					password: input.password,
					role: input.role,
				},
				headers: new Headers(),
			});
			return result;
		}),

	banUser: systemAdminProcedure
		.input(
			z.object({
				userId: z.string(),
				reason: z.string().optional(),
				expiresIn: z.number().optional(), // seconds
			}),
		)
		.mutation(async ({ input }) => {
			await auth.api.banUser({
				body: {
					userId: input.userId,
					banReason: input.reason,
					banExpiresIn: input.expiresIn,
				},
				headers: new Headers(),
			});
			return { ok: true };
		}),

	unbanUser: systemAdminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ input }) => {
			await auth.api.unbanUser({
				body: { userId: input.userId },
				headers: new Headers(),
			});
			return { ok: true };
		}),

	setUserRole: systemAdminProcedure
		.input(z.object({ userId: z.string(), role: z.enum(["user", "admin"]) }))
		.mutation(async ({ input }) => {
			await auth.api.setRole({
				body: { userId: input.userId, role: input.role },
				headers: new Headers(),
			});
			return { ok: true };
		}),

	revokeUserSessions: systemAdminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(authSchema.session)
				.where(eq(authSchema.session.userId, input.userId));
			return { ok: true };
		}),

	deleteUser: systemAdminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Cascade deletes sessions, accounts, members via FK constraints
			await ctx.db
				.delete(authSchema.user)
				.where(eq(authSchema.user.id, input.userId));
			return { ok: true };
		}),

	updateUser: systemAdminProcedure
		.input(
			z.object({
				userId: z.string(),
				name: z.string().min(1).optional(),
				email: z.string().email().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const data: Record<string, string> = {};
			if (input.name) data.name = input.name;
			if (input.email) data.email = input.email;
			const result = await auth.api.adminUpdateUser({
				body: { userId: input.userId, data },
				headers: new Headers(),
			});
			return result;
		}),

	setUserPassword: systemAdminProcedure
		.input(
			z.object({
				userId: z.string(),
				newPassword: z.string().min(8),
			}),
		)
		.mutation(async ({ input }) => {
			const result = await auth.api.setUserPassword({
				body: { userId: input.userId, newPassword: input.newPassword },
				headers: new Headers(),
			});
			return result;
		}),

	sendPasswordReset: systemAdminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [user] = await ctx.db
				.select({ email: authSchema.user.email })
				.from(authSchema.user)
				.where(eq(authSchema.user.id, input.userId))
				.limit(1);
			if (!user)
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			await auth.api.forgetPassword({
				body: {
					email: user.email,
					redirectTo: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3001"}/reset-password`,
				},
				headers: new Headers(),
			});
			return { ok: true };
		}),

	impersonateUser: systemAdminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ input }) => {
			const result = await auth.api.impersonateUser({
				body: { userId: input.userId },
				headers: new Headers(),
			});
			return result;
		}),

	listUserSessions: systemAdminProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					id: authSchema.session.id,
					token: authSchema.session.token,
					expiresAt: authSchema.session.expiresAt,
					createdAt: authSchema.session.createdAt,
					ipAddress: authSchema.session.ipAddress,
					userAgent: authSchema.session.userAgent,
				})
				.from(authSchema.session)
				.where(
					and(
						eq(authSchema.session.userId, input.userId),
						sql`${authSchema.session.expiresAt} > now()`,
					),
				)
				.orderBy(desc(authSchema.session.createdAt));
		}),

	// ─── Print templates ───────────────────────────────────────────────────────────

	listInstitutionTemplates: systemAdminProcedure
		.input(z.object({ institutionId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					id: schema.printTemplates.id,
					institutionId: schema.printTemplates.institutionId,
					type: schema.printTemplates.type,
					name: schema.printTemplates.name,
					updatedAt: schema.printTemplates.updatedAt,
				})
				.from(schema.printTemplates)
				.where(eq(schema.printTemplates.institutionId, input.institutionId))
				.orderBy(asc(schema.printTemplates.type));
		}),

	getInstitutionTemplate: systemAdminProcedure
		.input(
			z.object({
				institutionId: z.string(),
				type: z.enum(printTemplateTypes as unknown as [string, ...string[]]),
			}),
		)
		.query(async ({ ctx, input }) => {
			const [row] = await ctx.db
				.select()
				.from(schema.printTemplates)
				.where(
					and(
						eq(schema.printTemplates.institutionId, input.institutionId),
						eq(
							schema.printTemplates.type,
							input.type as schema.PrintTemplateType,
						),
					),
				)
				.limit(1);
			return row ?? null;
		}),

	upsertInstitutionTemplate: systemAdminProcedure
		.input(
			z.object({
				institutionId: z.string(),
				type: z.enum(printTemplateTypes as unknown as [string, ...string[]]),
				name: z.string().min(1).max(255),
				htmlContent: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [existing] = await ctx.db
				.select({ id: schema.printTemplates.id })
				.from(schema.printTemplates)
				.where(
					and(
						eq(schema.printTemplates.institutionId, input.institutionId),
						eq(
							schema.printTemplates.type,
							input.type as schema.PrintTemplateType,
						),
					),
				)
				.limit(1);

			if (existing) {
				const [updated] = await ctx.db
					.update(schema.printTemplates)
					.set({
						name: input.name,
						htmlContent: input.htmlContent,
						updatedAt: new Date(),
					})
					.where(eq(schema.printTemplates.id, existing.id))
					.returning();
				return updated;
			}

			const [created] = await ctx.db
				.insert(schema.printTemplates)
				.values({
					institutionId: input.institutionId,
					type: input.type as schema.PrintTemplateType,
					name: input.name,
					htmlContent: input.htmlContent,
				})
				.returning();
			return created;
		}),

	deleteInstitutionTemplate: systemAdminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(schema.printTemplates)
				.where(eq(schema.printTemplates.id, input.id));
			return { ok: true };
		}),
});
