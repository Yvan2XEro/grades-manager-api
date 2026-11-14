import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	ACTIVITY_DAYS,
	buildActivitySeries,
} from "../services/activity-series";
import type { ApiKey } from "../types";

export const API_KEYS_KEY = ["diplomation-api-keys"];

export function useApiKeys() {
	const { data = [], isLoading } = useQuery({
		queryKey: API_KEYS_KEY,
		queryFn: () => trpcClient.diplomationKeys.list.query(),
	});
	return { keys: data as ApiKey[], isLoading };
}

/** Document activity and API calls of the last 30 days, as chart series. */
export function useApiKeyActivity() {
	const { data: activityData } = useQuery(
		trpc.diplomationKeys.activityStats.queryOptions({ days: ACTIVITY_DAYS }),
	);
	const { data: callData } = useQuery(
		trpc.diplomationKeys.callStats.queryOptions({ days: ACTIVITY_DAYS }),
	);
	const activity = useMemo(
		() => buildActivitySeries(activityData),
		[activityData],
	);
	const calls = useMemo(() => buildActivitySeries(callData), [callData]);
	return { activity, calls };
}

export function useRevokeApiKey() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.diplomationKeys.revoke.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.apiKeys.toast.revokeSuccess"));
			queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: t("admin.apiKeys.toast.revokeError");
			toast.error(message);
		},
	});
}
