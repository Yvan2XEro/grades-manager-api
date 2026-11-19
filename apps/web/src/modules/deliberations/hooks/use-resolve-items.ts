import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { TransitionItem, TransitionOutcome } from "../types";

type ResolvableOutcome = Exclude<TransitionOutcome, "review">;

/**
 * Form state of the resolution of one or several plan items (same outcome,
 * destination and reason for all), with the destination classes of the
 * target year: same program and option as the source class, the suggested
 * level first (next level to promote, same level to repeat). The suggested
 * class can be created in place when missing.
 */
export function useResolveItems({
	items,
	targetAcademicYearId,
	onResolved,
}: {
	items: TransitionItem[];
	targetAcademicYearId?: string | null;
	onResolved: () => void;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const single = items.length === 1 ? items[0] : null;
	const [outcome, setOutcome] = useState<ResolvableOutcome>(
		!single || single.finalOutcome === "review"
			? "repeat"
			: single.finalOutcome,
	);
	const [targetClassId, setTargetClassId] = useState(
		single?.targetClass?.id ?? "",
	);
	const [reason, setReason] = useState(single?.overrideReason ?? "");

	// Destinations depend on the source class: one source class at a time
	const sourceClassIds = [...new Set(items.map((i) => i.sourceClass.id))];
	const sourceClassId = sourceClassIds.length === 1 ? sourceClassIds[0] : null;
	const needsTarget = outcome === "promote" || outcome === "repeat";

	const targetsKey = ["promo-targets", sourceClassId, targetAcademicYearId];
	const targetsQuery = useQuery({
		queryKey: targetsKey,
		queryFn: () =>
			trpcClient.classes.promoTargets.query({
				sourceClassId: sourceClassId!,
				targetAcademicYearId: targetAcademicYearId!,
			}),
		enabled: Boolean(sourceClassId && targetAcademicYearId),
	});
	const targets = targetsQuery.data;
	const suggestedIds = new Set(
		(outcome === "promote"
			? (targets?.targetClasses ?? []).filter(
					(c) => c.programOptionId === targets?.sourceClass.programOptionId,
				)
			: (targets?.sameLevelClasses ?? [])
		).map((c) => c.id),
	);
	const programClasses = targets?.programClasses ?? [];
	const suggestedClasses = programClasses.filter((c) => suggestedIds.has(c.id));
	const otherClasses = programClasses.filter((c) => !suggestedIds.has(c.id));
	const suggestedLevel =
		outcome === "promote"
			? targets?.nextLevel
			: targets?.sourceClass.cycleLevel;
	const canCreateSuggested =
		!!targets && suggestedClasses.length === 0 && !!suggestedLevel;

	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.classes.createPromotionTarget.mutate({
				sourceClassId: sourceClassId!,
				targetAcademicYearId: targetAcademicYearId!,
				level: outcome === "promote" ? "next" : "same",
			}),
		onSuccess: async ({ klass, created }) => {
			if (created) {
				toast.success(
					t("admin.deliberations.promote.classCreated", { name: klass.name }),
				);
			}
			await queryClient.invalidateQueries({ queryKey: targetsKey });
			setTargetClassId(klass.id);
		},
		onError: () =>
			toast.error(t("admin.academicYearTransitions.toast.createClassError")),
	});

	const changeOutcome = (value: ResolvableOutcome) => {
		setOutcome(value);
		setTargetClassId("");
	};

	const mutation = useMutation({
		mutationFn: () =>
			trpcClient.academicYearTransitions.resolveItems.mutate({
				transitionId: items[0].transitionId,
				itemIds: items.map((i) => i.id),
				outcome,
				targetClassId: needsTarget ? targetClassId : null,
				reason: reason.trim(),
			}),
		onSuccess: () => {
			toast.success(
				t("admin.academicYearTransitions.toast.resolvedCount", {
					count: items.length,
				}),
			);
			onResolved();
		},
		onError: () =>
			toast.error(t("admin.academicYearTransitions.toast.resolveError")),
	});

	const mixedSources = needsTarget && !sourceClassId;
	const canSubmit =
		!mutation.isPending &&
		reason.trim().length >= 5 &&
		!mixedSources &&
		(!needsTarget || !!targetClassId);

	return {
		single,
		outcome,
		changeOutcome,
		targetClassId,
		setTargetClassId,
		reason,
		setReason,
		needsTarget,
		mixedSources,
		targetsLoading: targetsQuery.isLoading,
		suggestedClasses,
		otherClasses,
		suggestedLevel,
		programName: targets?.sourceClass.programInfo?.name,
		canCreateSuggested,
		createSuggested: () => createMutation.mutate(),
		creating: createMutation.isPending,
		canSubmit,
		submit: () => mutation.mutate(),
		pending: mutation.isPending,
	};
}
