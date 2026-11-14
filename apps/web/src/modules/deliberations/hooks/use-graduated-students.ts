import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import type { GraduatedStudentItem, GraduatedStudentRow } from "../types";

/** One page of graduated students, keyed by enrollment for the table. */
export function useGraduatedStudents({
	page,
	pageSize,
	search,
}: {
	page: number;
	pageSize: number;
	search: string;
}) {
	const query = useQuery(
		trpc.classes.graduatedStudentsPaged.queryOptions({
			page,
			pageSize,
			query: search.trim() || undefined,
		}),
	);
	const rows: GraduatedStudentRow[] = (query.data?.items ?? []).map(
		(item: GraduatedStudentItem) => ({ ...item, id: item.enrollment.id }),
	);
	return { ...query, rows };
}
