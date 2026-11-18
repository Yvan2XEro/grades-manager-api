import { useMutation, useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { queryClient, trpcClient } from "@/utils/trpc";
import type { ItemStatus, TransitionAction, TransitionOutcome } from "../types";

/**
 * A transition plan with its (filtered) items, readiness and audit trail,
 * plus the workflow actions (submit / approve / execute / cancel).
 */
export function useTransitionDetail(id: string | undefined) {
	const { t } = useTranslation();
	const [outcome, setOutcome] = useState<TransitionOutcome | "all">("all");
	const [itemStatus, setItemStatus] = useState<ItemStatus | "all">("all");
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);

	const transitionQuery = useQuery({
		queryKey: ["academic-year-transition", id],
		queryFn: () =>
			trpcClient.academicYearTransitions.getById.query({ id: id! }),
		enabled: Boolean(id),
	});

	const itemsQuery = useQuery({
		queryKey: [
			"academic-year-transition-items",
			id,
			outcome,
			itemStatus,
			deferredSearch,
		],
		queryFn: () =>
			trpcClient.academicYearTransitions.listItems.query({
				transitionId: id!,
				outcome: outcome === "all" ? undefined : outcome,
				status: itemStatus === "all" ? undefined : itemStatus,
				query: deferredSearch || undefined,
				limit: 100,
			}),
		enabled: Boolean(id),
	});

	const readinessQuery = useQuery({
		queryKey: ["academic-year-transition-readiness", id],
		queryFn: () =>
			trpcClient.academicYearTransitions.getTransitionReadiness.query({
				id: id!,
			}),
		enabled: Boolean(id),
	});

	const auditQuery = useQuery({
		queryKey: ["academic-year-transition-audit", id],
		queryFn: () =>
			trpcClient.academicYearTransitions.getTransitionAudit.query({ id: id! }),
		enabled: Boolean(id),
	});

	const invalidate = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition-items", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition-readiness", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transition-audit", id],
		});
		await queryClient.invalidateQueries({
			queryKey: ["academic-year-transitions"],
		});
	};

	const actionMutation = useMutation({
		mutationFn: async ({ action }: { action: TransitionAction }) => {
			return trpcClient.academicYearTransitions[action].mutate({ id: id! });
		},
		onSuccess: async (_data, { action }) => {
			const msg = {
				submit: t("admin.academicYearTransitions.toast.submitted"),
				approve: t("admin.academicYearTransitions.toast.approved"),
				execute: t("admin.academicYearTransitions.toast.executed"),
				cancel: t("admin.academicYearTransitions.toast.cancelled"),
			}[action];
			toast.success(msg);
			await invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	return {
		filters: {
			outcome,
			setOutcome,
			itemStatus,
			setItemStatus,
			search,
			setSearch,
		},
		transitionQuery,
		itemsQuery,
		readinessQuery,
		auditQuery,
		invalidate,
		actionMutation,
	};
}
