import type { Context } from "@/lib/context";
import { ADMIN_ROLES, roleSatisfies } from "@/modules/authz";
import { classCourseIdsForEditor } from "../exam-grade-editors/exam-grade-editors.repo";
import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./class-courses.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./class-courses.zod";
import { logDelegateCourseAccess } from "./class-course-access-logs.service";

type ClassCourseListItem = Awaited<
	ReturnType<typeof service.listClassCourses>
>["items"][number] & { isDelegated?: boolean };

const markItems = (
	items: Awaited<ReturnType<typeof service.listClassCourses>>["items"],
	isDelegated: boolean,
) =>
	items.map(
		(item) =>
			({
				...item,
				isDelegated,
			}) satisfies ClassCourseListItem,
	);

const mergeById = (...lists: ClassCourseListItem[][]) => {
	const map = new Map<string, ClassCourseListItem>();
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
			const teacherId = ctx.profile?.id ?? null;
			const baseRaw =
				isAdmin
					? await service.listClassCourses(input, ctx.institution.id)
					: teacherId && ctx.memberRole === "teacher"
						? await service.listClassCourses(
								{ ...input, teacherId },
								ctx.institution.id,
							)
						: { items: [], nextCursor: undefined };
			if (isAdmin || !teacherId) {
				return {
					...baseRaw,
					items: markItems(baseRaw.items, false),
				};
			}
			const delegateCourseIds = await classCourseIdsForEditor(
				teacherId,
				ctx.institution.id,
			);
			if (!delegateCourseIds.length) {
				return {
					...baseRaw,
					items: markItems(baseRaw.items, false),
				};
			}
			const delegatedRaw = await service.listClassCourses(
				{
					...input,
					classCourseIds: delegateCourseIds,
				},
				ctx.institution.id,
			);
			const baseItems = markItems(baseRaw.items, false);
			const delegatedItems = markItems(delegatedRaw.items, true);
			if (delegatedItems.length > 0 && teacherId) {
				await logDelegateCourseAccess({
					classCourseIds: delegatedItems.map((item) => item.id),
					profileId: teacherId,
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
			const teacherId = ctx.profile?.id ?? null;
			const baseRaw =
				isAdmin
					? await service.searchClassCourses(input, ctx.institution.id)
					: teacherId && ctx.memberRole === "teacher"
						? await service.searchClassCourses(
								{ ...input, teacherId },
								ctx.institution.id,
							)
						: [];
			if (isAdmin || !teacherId) {
				return markItems(baseRaw, false);
			}
			const delegateCourseIds = await classCourseIdsForEditor(
				teacherId,
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
			if (delegatedItems.length > 0 && teacherId) {
				await logDelegateCourseAccess({
					classCourseIds: delegatedItems.map((item) => item.id),
					profileId: teacherId,
					institutionId: ctx.institution.id,
					source: "search",
				});
			}
			return mergeById(markItems(baseRaw, false), delegatedItems);
		}),
});
