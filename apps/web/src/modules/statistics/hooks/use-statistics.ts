import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";

/** Year filter of the statistics page: starts on the active academic year. */
export function useStatisticsYear() {
	const [yearId, setYearId] = useState<string | null>(null);
	const [yearInitialized, setYearInitialized] = useState(false);

	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
		if (!yearInitialized && active) {
			setYearId(active);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

	return [yearId, setYearId] as const;
}

const yearInput = (yearId: string | null) => ({
	academicYearId: yearId ?? undefined,
});

export const useEnrollmentStats = (yearId: string | null) =>
	useQuery(trpc.stats.enrollmentStats.queryOptions(yearInput(yearId)));

export const usePerformanceStats = (yearId: string | null) =>
	useQuery(trpc.stats.performanceStats.queryOptions(yearInput(yearId)));

export const useFinanceStats = (yearId: string | null) =>
	useQuery(trpc.stats.financeStats.queryOptions(yearInput(yearId)));

export const useAdmissionsStats = (yearId: string | null) =>
	useQuery(trpc.stats.admissionsStats.queryOptions(yearInput(yearId)));
