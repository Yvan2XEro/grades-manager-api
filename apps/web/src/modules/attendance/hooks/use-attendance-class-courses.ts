import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { AttendanceClassCourse } from "../types";

/**
 * Class courses of an academic year (all years when null) for the attendance
 * pickers. `cacheKey` keeps each page's own query key.
 */
export function useAttendanceClassCourses(
	cacheKey: string,
	academicYearId: string | null,
) {
	const { data } = useQuery({
		queryKey: [cacheKey, academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 500,
			});
			return items as unknown as AttendanceClassCourse[];
		},
	});
	return data ?? [];
}
