import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useInvalidateDeliberation } from "./use-deliberation";

interface PromoteAdmittedOptions {
	deliberationId: string;
	/** classId of the source class (from the deliberation) */
	sourceClassId: string;
	onDone: () => void;
}

/**
 * Target year/class selection and promotion of the admitted students of a
 * deliberation. On the last level no target is needed (graduation).
 */
export function usePromoteAdmitted({
	deliberationId,
	sourceClassId,
	onDone,
}: PromoteAdmittedOptions) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const invalidateDeliberation = useInvalidateDeliberation(deliberationId);
	const [targetYearId, setTargetYearId] = useState<string>("");
	const [targetClassId, setTargetClassId] = useState<string>("");

	// Step 1: load source class info + available years (no year selected yet)
	const { data: baseData, isLoading: baseLoading } = useQuery({
		queryKey: ["promo-targets-base", sourceClassId],
		queryFn: () => trpcClient.classes.promoTargets.query({ sourceClassId }),
		enabled: !!sourceClassId,
	});

	// Step 2: load matching target classes once a year is chosen
	const { data: targetData, isLoading: targetLoading } = useQuery({
		queryKey: ["promo-targets", sourceClassId, targetYearId],
		queryFn: () =>
			trpcClient.classes.promoTargets.query({
				sourceClassId,
				targetAcademicYearId: targetYearId,
			}),
		enabled: !!sourceClassId && !!targetYearId,
	});

	const availableYears = baseData?.availableYears ?? [];
	const isLastLevel = baseData?.isLastLevel ?? false;
	const sourceClass = baseData?.sourceClass;
	const nextLevel = baseData?.nextLevel ?? null;
	const targetClasses = targetData?.targetClasses ?? [];

	// Auto-select when exactly one class matches
	useEffect(() => {
		if (targetClasses.length === 1) {
			setTargetClassId(targetClasses[0].id);
		} else if (targetClasses.length === 0) {
			setTargetClassId("");
		}
	}, [targetClasses]);

	// Propose the year right after the deliberated one
	useEffect(() => {
		if (!targetYearId && availableYears.length > 0) {
			setTargetYearId(availableYears[0].id);
		}
	}, [availableYears, targetYearId]);

	// Reset class when year changes
	useEffect(() => {
		setTargetClassId("");
	}, [targetYearId]);

	function close() {
		setTargetYearId("");
		setTargetClassId("");
		onDone();
	}

	const promoteMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.promoteAdmitted.mutate({
				deliberationId,
				// omit targetClassId for graduation (last level)
				...(isLastLevel ? {} : { targetClassId }),
			}),
		onSuccess: (data) => {
			if (data.promotedCount > 0) {
				toast.success(
					t("admin.deliberations.promote.success", {
						count: data.promotedCount,
					}),
				);
			}
			if (data.alreadyPromotedCount > 0) {
				toast.info(
					t("admin.deliberations.promote.alreadyPromoted", {
						count: data.alreadyPromotedCount,
					}),
				);
			}
			invalidateDeliberation();
			queryClient.invalidateQueries({
				queryKey: trpc.students.list.queryKey(),
			});
			close();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	// Creates the missing target class in place: next level of the cycle, same
	// program and option, generated code and name. The list of matching classes
	// is refetched, then the class is selected.
	const createTargetMutation = useMutation({
		mutationFn: () =>
			trpcClient.classes.createPromotionTarget.mutate({
				sourceClassId,
				targetAcademicYearId: targetYearId,
			}),
		onSuccess: async ({ klass, created }) => {
			if (created) {
				toast.success(
					t("admin.deliberations.promote.classCreated", { name: klass.name }),
				);
			}
			await queryClient.invalidateQueries({
				queryKey: ["promo-targets", sourceClassId, targetYearId],
			});
			setTargetClassId(klass.id);
		},
		onError: (err) => toast.error((err as Error).message),
	});
	const createTargetClass = () => {
		if (targetYearId) createTargetMutation.mutate();
	};

	const showNoClassFound =
		!!targetYearId &&
		!targetLoading &&
		targetClasses.length === 0 &&
		!isLastLevel;

	return {
		targetYearId,
		setTargetYearId,
		targetClassId,
		setTargetClassId,
		baseLoading,
		targetLoading,
		availableYears,
		isLastLevel,
		sourceClass,
		nextLevel,
		targetClasses,
		showNoClassFound,
		createTargetClass,
		creatingTarget: createTargetMutation.isPending,
		promoteMutation,
		close,
	};
}
