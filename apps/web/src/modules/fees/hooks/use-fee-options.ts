import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

/** Active fee structures, optionally restricted to one academic year. */
export function useActiveStructures(academicYearId: string) {
	return useQuery(
		trpc.feeClearance.listStructures.queryOptions({
			academicYearId: academicYearId || undefined,
			isActive: true,
		}),
	);
}

/** Students matching a search of at least 2 characters. */
export function useStudentSearch(
	search: string,
	limit: number,
	enabled = true,
) {
	return useQuery({
		...trpc.students.list.queryOptions({
			q: search || undefined,
			limit,
		}),
		enabled: enabled && search.length >= 2,
	});
}
