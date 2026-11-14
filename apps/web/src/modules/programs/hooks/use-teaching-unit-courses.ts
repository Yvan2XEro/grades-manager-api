import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { UeCourse } from "../types";

export const teachingUnitCoursesKey = (teachingUnitId: string) => [
	"teaching-unit-courses",
	teachingUnitId,
];

/** Courses (EC) of a teaching unit. */
export function useTeachingUnitCourses(teachingUnitId: string) {
	return useQuery({
		queryKey: teachingUnitCoursesKey(teachingUnitId),
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({
				teachingUnitId,
				limit: 200,
			});
			return items.map(
				(course): UeCourse => ({
					id: course.id,
					name: course.name,
					code: course.code,
					hours: course.hours,
					defaultTeacher: course.defaultTeacher ?? "",
					defaultCoefficient: Number(course.defaultCoefficient) || 1,
				}),
			);
		},
		enabled: Boolean(teachingUnitId),
	});
}

/** Deletes a course of a teaching unit and refreshes its courses. */
export function useDeleteTeachingUnitCourse(teachingUnitId: string) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => trpcClient.courses.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.courses.toast.deleteSuccess", {
					defaultValue: "Element deleted",
				}),
			);
			queryClient.invalidateQueries({
				queryKey: teachingUnitCoursesKey(teachingUnitId),
			});
		},
		onError: (error: Error) => toast.error(error.message),
	});
}
