import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Confirm } from "@/components/callable/confirm";
import { toast } from "@/lib/toast";
import { ClassFormDialog } from "@/modules/classes/components/class-form-dialog";
import { trpcClient } from "@/utils/trpc";
import { PromotionConfirmDescription } from "../components/promotion-confirm-description";
import type { PromotionPayload, PromotionSelection } from "../types";

/** Above this many students the promotion runs as a background batch job. */
export const BATCH_THRESHOLD = 20;

/**
 * Execution of the promotion prepared on the evaluate tab (router state):
 * target class selection, confirmation, then a direct or batch promotion.
 */
export function useExecutePromotion() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state as PromotionSelection | null;
	const [targetClassId, setTargetClassId] = useState<string>("");

	const { data: rule } = useQuery({
		queryKey: ["promotionRule", state?.ruleId],
		queryFn: async () =>
			trpcClient.promotionRules.getById.query({ id: state?.ruleId }),
		enabled: !!state?.ruleId,
	});

	const { data: sourceClass } = useQuery({
		queryKey: ["class", state?.sourceClassId],
		queryFn: async () =>
			trpcClient.classes.getById.query({ id: state?.sourceClassId }),
		enabled: !!state?.sourceClassId,
	});

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items;
		},
	});

	const applyPromotionMutation = useMutation({
		mutationFn: async (data: PromotionPayload) =>
			trpcClient.promotionRules.applyPromotion.mutate(data),
		onSuccess: () => {
			toast.success("Promotion applied successfully!");
			navigate("/promotion-legacy?tab=history");
		},
		onError: (error: any) => {
			toast.error(`Failed to apply promotion: ${error.message}`);
		},
	});

	// Batch job mutation for large promotions
	const batchPromotionMutation = useMutation({
		mutationFn: async (data: PromotionPayload) => {
			const job = await trpcClient.batchJobs.preview.mutate({
				type: "promotion.applyBatch",
				params: { ...data, executedBy: "__current__" },
			});
			await trpcClient.batchJobs.run.mutate({ jobId: job.id });
			return job;
		},
		onSuccess: () => {
			toast.success("Batch promotion started! Redirecting to batch jobs...");
			navigate("/batch-jobs");
		},
		onError: (error: any) => {
			toast.error(`Failed to start batch promotion: ${error.message}`);
		},
	});

	const useBatch = (state?.studentIds.length ?? 0) > BATCH_THRESHOLD;
	const targetClass = classes?.find((c) => c.id === targetClassId);

	const confirmExecute = () => {
		if (!state || !targetClassId) return;
		const payload: PromotionPayload = {
			ruleId: state.ruleId,
			sourceClassId: state.sourceClassId,
			targetClassId,
			academicYearId: state.academicYearId,
			studentIds: state.studentIds,
		};
		if (useBatch) {
			batchPromotionMutation.mutate(payload);
		} else {
			applyPromotionMutation.mutate(payload);
		}
	};

	const execute = () => {
		if (!state || !targetClassId) {
			toast.error("Missing required information");
			return;
		}
		Confirm.call({
			title: "Confirm Promotion Execution",
			description: (
				<PromotionConfirmDescription
					studentCount={state.studentIds.length}
					sourceClassName={sourceClass?.name}
					targetClassName={targetClass?.name}
					useBatch={useBatch}
					batchThreshold={BATCH_THRESHOLD}
				/>
			),
			confirmLabel: "Yes, Execute Promotion",
			cancelLabel: "Cancel",
			destructive: false,
		}).then((confirmed) => confirmed && confirmExecute());
	};

	// Creates the missing destination class in place (same program as the
	// source class), refreshes the list and selects it.
	const createTargetClass = async () => {
		const created = await ClassFormDialog.call({
			defaults: { programId: sourceClass?.program },
		});
		if (!created) return;
		await queryClient.invalidateQueries({ queryKey: ["classes"] });
		setTargetClassId(created.id);
	};

	return {
		state,
		rule,
		sourceClass,
		classes: classes ?? [],
		targetClassId,
		setTargetClassId,
		targetClass,
		useBatch,
		isPending:
			applyPromotionMutation.isPending || batchPromotionMutation.isPending,
		execute,
		createTargetClass,
	};
}
