import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";
import {
	toProgramBars,
	toStatusSlices,
} from "../services/admin-dashboard-data";

/** Year filter (defaults to the active year) and the institution stats. */
export function useAdminDashboard() {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState<string | null>(null);
	const [yearInitialized, setYearInitialized] = useState(false);

	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive);
		if (!yearInitialized && active) {
			setYearId(active.id);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

	const yearParam = { academicYearId: yearId ?? undefined };

	const overviewQuery = useQuery(trpc.stats.overview.queryOptions(yearParam));
	const enrollmentQuery = useQuery(
		trpc.stats.enrollmentStats.queryOptions(yearParam),
	);

	const isLoading =
		overviewQuery.isLoading ||
		enrollmentQuery.isLoading ||
		yearListQuery.isLoading;

	const en = enrollmentQuery.data;
	const activeYearName =
		yearListQuery.data?.items.find((y) => y.id === yearId)?.name ??
		(yearId == null ? t("admin.dashboard.noActiveYear") : "—");

	return {
		yearId,
		setYearId,
		activeYearName,
		isLoading,
		overview: overviewQuery.data,
		enrollmentTotal: en?.total ?? 0,
		byProgram: toProgramBars(en?.byProgram),
		byStatus: toStatusSlices(en?.byStatus),
	};
}
