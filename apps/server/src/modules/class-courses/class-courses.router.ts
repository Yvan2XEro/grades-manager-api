import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { ADMIN_ROLES, roleSatisfies } from "@/modules/authz";
import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import { classCourseIdsForEditor } from "../exam-grade-editors/exam-grade-editors.repo";
import * as gradeAccessRepo from "../grade-access-grants/grade-access-grants.repo";
import { logDelegateCourseAccess } from "./class-course-access-logs.service";
import * as service from "./class-courses.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listPagedSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./class-courses.zod";

type ClassCourseListItem = Awaited<
	ReturnType<typeof service.searchClassCourses>
>[number] & { isDelegated?: boolean };

const markItems = <T extends { id: string }>(
	items: T[],
	isDelegated: boolean,
) =>
	items.map(
		(item) =>
			({
				...item,
				isDelegated,
			}) as T & { isDelegated: boolean },
	);

const mergeById = <T extends { id: string }>(
	...lists: Array<Array<T & { isDelegated: boolean }>>
) => {
	const map = new Map<string, T & { isDelegated: boolean }>();
	for (const list of lists) {
		for (const item of list) {
			if (!map.has(item.id)) {
				map.set(item.id, item);
			}
		}
	}
	return Array.from(map.values());
};

export const router = createRouter({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createClassCourse(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateClassCourse(input.id, input, ctx.institution.id),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteClassCourse(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(async ({ ctx, input }) => {
			const isAdmin = roleSatisfies(ctx.memberRole, ADMIN_ROLES);
			const isGradeEditor = ctx.memberRole === "grade_editor";
			const profileId = ctx.profile?.id ?? null;

			const hasInstitutionGrant =
				!isAdmin && !isGradeEditor && profileId
					? !!(await gradeAccessRepo.findByProfileAndInstitution(
							profileId,
							ctx.institution.id,
						))
					: false;

			const hasFullAccess = isAdmin || isGradeEditor || hasInstitutionGrant;

			const baseRaw = hasFullAccess
				? await service.listClassCourses(input, ctx.institution.id)
				: profileId && ctx.memberRole === "teacher"
					? await service.listClassCourses(
							{ ...input, teacherId: profileId },
							ctx.institution.id,
						)
					: { items: [], nextCursor: undefined };

			if (hasFullAccess || !profileId) {
				return { ...baseRaw, items: markItems(baseRaw.items, false) };
			}

			const delegateCourseIds = await classCourseIdsForEditor(
				profileId,
				ctx.institution.id,
			);
			if (!delegateCourseIds.length) {
				return { ...baseRaw, items: markItems(baseRaw.items, false) };
			}
			const delegatedRaw = await service.listClassCourses(
				{ ...input, classCourseIds: delegateCourseIds },
				ctx.institution.id,
			);
			const baseItems = markItems(baseRaw.items, false);
			const delegatedItems = markItems(delegatedRaw.items, true);
			if (delegatedItems.length > 0 && profileId) {
				await logDelegateCourseAccess({
					classCourseIds: delegatedItems.map((item) => item.id),
					profileId,
					institutionId: ctx.institution.id,
					source: "list",
				});
			}
			return {
				...baseRaw,
				items: mergeById(baseItems, delegatedItems),
				nextCursor: undefined,
			};
		}),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getClassCourseById(input.id, ctx.institution.id),
		),
	getByCode: tenantProtectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getClassCourseByCode(
				input.code,
				input.academicYearId,
				ctx.institution.id,
			),
		),
	roster: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getClassCourseRoster(input.id, ctx.institution.id),
		),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(async ({ ctx, input }) => {
			const isAdmin = roleSatisfies(ctx.memberRole, ADMIN_ROLES);
			const isGradeEditor = ctx.memberRole === "grade_editor";
			const profileId = ctx.profile?.id ?? null;

			const hasInstitutionGrant =
				!isAdmin && !isGradeEditor && profileId
					? !!(await gradeAccessRepo.findByProfileAndInstitution(
							profileId,
							ctx.institution.id,
						))
					: false;

			const hasFullAccess = isAdmin || isGradeEditor || hasInstitutionGrant;

			const baseRaw = hasFullAccess
				? await service.searchClassCourses(input, ctx.institution.id)
				: profileId && ctx.memberRole === "teacher"
					? await service.searchClassCourses(
							{ ...input, teacherId: profileId },
							ctx.institution.id,
						)
					: [];

			if (hasFullAccess || !profileId) {
				return markItems(baseRaw, false);
			}

			const delegateCourseIds = await classCourseIdsForEditor(
				profileId,
				ctx.institution.id,
			);
			if (!delegateCourseIds.length) {
				return markItems(baseRaw, false);
			}
			const delegatedRaw = await service.searchClassCourses(
				{ ...input, classCourseIds: delegateCourseIds },
				ctx.institution.id,
			);
			const delegatedItems = markItems(delegatedRaw, true);
			if (delegatedItems.length > 0 && profileId) {
				await logDelegateCourseAccess({
					classCourseIds: delegatedItems.map((item) => item.id),
					profileId,
					institutionId: ctx.institution.id,
					source: "search",
				});
			}
			return mergeById(markItems(baseRaw, false), delegatedItems);
		}),
	listPaged: tenantProtectedProcedure
		.input(listPagedSchema)
		.query(async ({ ctx, input }) => {
			const isAdmin = roleSatisfies(ctx.memberRole, ADMIN_ROLES);
			const isGradeEditor = ctx.memberRole === "grade_editor";
			const profileId = ctx.profile?.id ?? null;

			const hasInstitutionGrant =
				!isAdmin && !isGradeEditor && profileId
					? !!(await gradeAccessRepo.findByProfileAndInstitution(
							profileId,
							ctx.institution.id,
						))
					: false;

			const hasFullAccess = isAdmin || isGradeEditor || hasInstitutionGrant;

			// Admins / grade_editors / institution-grant holders: see everything
			if (hasFullAccess) {
				const result = await service.listClassCoursesPaged(
					input,
					ctx.institution.id,
				);
				return {
					...result,
					items: result.items.map((item) => ({ ...item, isDelegated: false })),
				};
			}

			// No profile: return empty result (mirrors `list` behavior)
			if (!profileId) {
				return { items: [], total: 0, pageCount: 0 };
			}

			// Check delegate courses first — required to decide whether to merge
			const delegateCourseIds = await classCourseIdsForEditor(
				profileId,
				ctx.institution.id,
			);

			if (!delegateCourseIds.length) {
				// No delegate — teacher sees only their own courses, paginated normally
				const result =
					ctx.memberRole === "teacher"
						? await service.listClassCoursesPaged(
								{ ...input, teacherId: profileId },
								ctx.institution.id,
							)
						: { items: [], total: 0, pageCount: 0 };
				return {
					...result,
					items: result.items.map((item) => ({ ...item, isDelegated: false })),
				};
			}

			// Has delegate courses: fetch both sets without pagination, merge, then
			// paginate in memory — same dedup strategy as `list`.
			// Use listClassCourses (no 100-item cap) to bypass the repo pageSize clamp.
			const { page: _page, pageSize: _pageSize, ...listInput } = input;
			const [baseItems, delegateAllItems] = await Promise.all([
				ctx.memberRole === "teacher"
					? service
							.listClassCourses(
								{ ...listInput, teacherId: profileId, limit: 1000 },
								ctx.institution.id,
							)
							.then((r) => r.items)
					: Promise.resolve(
							[] as Awaited<
								ReturnType<typeof service.listClassCourses>
							>["items"],
						),
				service
					.listClassCourses(
						{
							...listInput,
							classCourseIds: delegateCourseIds,
							limit: 1000,
						},
						ctx.institution.id,
					)
					.then((r) => r.items),
			]);

			if (delegateAllItems.length > 0) {
				await logDelegateCourseAccess({
					classCourseIds: delegateAllItems.map((item) => item.id),
					profileId,
					institutionId: ctx.institution.id,
					source: "list",
				});
			}

			const merged = mergeById(
				markItems(baseItems, false),
				markItems(delegateAllItems, true),
			);

			// In-memory pagination over merged set
			const size = Math.min(Math.max(input.pageSize, 1), 100);
			const offset = (Math.max(input.page, 1) - 1) * size;
			merged.sort(
				(a, b) =>
					(a.code ?? "").localeCompare(b.code ?? "") ||
					a.id.localeCompare(b.id),
			);
			return {
				items: merged.slice(offset, offset + size),
				total: merged.length,
				pageCount: Math.ceil(merged.length / size),
			};
		}),
	teacherOverview: tenantProtectedProcedure.query(async ({ ctx }) => {
		const activeYear = await db.query.academicYears.findFirst({
			where: and(
				eq(schema.academicYears.institutionId, ctx.institution.id),
				eq(schema.academicYears.isActive, true),
			),
		});
		if (!activeYear) {
			return [];
		}

		const isAdmin = roleSatisfies(ctx.memberRole, ADMIN_ROLES);
		const isGradeEditor = ctx.memberRole === "grade_editor";
		const profileId = ctx.profile?.id ?? null;

		const hasInstitutionGrant =
			!isAdmin && !isGradeEditor && profileId
				? !!(await gradeAccessRepo.findByProfileAndInstitution(
						profileId,
						ctx.institution.id,
					))
				: false;

		const hasFullAccess = isAdmin || isGradeEditor || hasInstitutionGrant;

		const baseRaw = hasFullAccess
			? await service.listClassCourses(
					{ academicYearId: activeYear.id, limit: 200 },
					ctx.institution.id,
				)
			: profileId && ctx.memberRole === "teacher"
				? await service.listClassCourses(
						{
							academicYearId: activeYear.id,
							teacherId: profileId,
							limit: 200,
						},
						ctx.institution.id,
					)
				: { items: [], nextCursor: undefined };

		if (hasFullAccess || !profileId) {
			return service.buildTeacherOverview(baseRaw.items, ctx.institution.id, {
				profileId,
				memberRole: ctx.memberRole ?? null,
			});
		}

		const delegateCourseIds = await classCourseIdsForEditor(
			profileId,
			ctx.institution.id,
		);
		if (!delegateCourseIds.length) {
			return service.buildTeacherOverview(baseRaw.items, ctx.institution.id, {
				profileId,
				memberRole: ctx.memberRole ?? null,
			});
		}

		const delegatedRaw = await service.listClassCourses(
			{
				academicYearId: activeYear.id,
				classCourseIds: delegateCourseIds,
				limit: 200,
			},
			ctx.institution.id,
		);
		const baseItems = markItems(baseRaw.items, false);
		const delegatedItems = markItems(delegatedRaw.items, true);
		if (delegatedItems.length > 0) {
			await logDelegateCourseAccess({
				classCourseIds: delegatedItems.map((item) => item.id),
				profileId,
				institutionId: ctx.institution.id,
				source: "list",
			});
		}

		return service.buildTeacherOverview(
			mergeById(baseItems, delegatedItems),
			ctx.institution.id,
			{
				profileId,
				memberRole: ctx.memberRole ?? null,
			},
		);
	}),
});
