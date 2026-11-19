import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { DecisionGroups } from "../services/decision-groups";
import { useInvalidateDeliberation } from "./use-deliberation";

interface PromoteAdmittedOptions {
	deliberationId: string;
	/** classId of the source class (from the deliberation) */
	sourceClassId: string;
	groups: DecisionGroups;
	onDone: () => void;
}

/**
 * Applies the jury's decisions of a deliberation in one step: admitted
 * students join the next-level class of the target year (or graduate on the
 * last level), repeaters join the same-level class, excluded students leave,
 * undecided ones are left as they are. Missing classes can be created here.
 */
export function usePromoteAdmitted({
	deliberationId,
	sourceClassId,
	groups,
	onDone,
}: PromoteAdmittedOptions) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const invalidateDeliberation = useInvalidateDeliberation(deliberationId);
	const [targetYearId, setTargetYearId] = useState<string>("");
	const [targetClassId, setTargetClassId] = useState<string>("");
	const [repeatClassId, setRepeatClassId] = useState<string>("");

	// Step 1: load source class info + available years (no year selected yet)
	const { data: baseData, isLoading: baseLoading } = useQuery({
		queryKey: ["promo-targets-base", sourceClassId],
		queryFn: () => trpcClient.classes.promoTargets.query({ sourceClassId }),
		enabled: !!sourceClassId,
	});

	// Step 2: load matching target classes once a year is chosen
	const targetsKey = ["promo-targets", sourceClassId, targetYearId];
	const { data: targetData, isLoading: targetLoading } = useQuery({
		queryKey: targetsKey,
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
	const repeatClasses = targetData?.sameLevelClasses ?? [];
	const needsTargetClass = !isLastLevel && groups.admitted > 0;
	const needsRepeatClass = groups.repeat > 0;
	const needsYear = needsTargetClass || needsRepeatClass;

	// Auto-select when exactly one class matches
	useEffect(() => {
		if (targetClasses.length === 1) setTargetClassId(targetClasses[0].id);
		else if (targetClasses.length === 0) setTargetClassId("");
	}, [targetClasses]);
	useEffect(() => {
		if (repeatClasses.length === 1) setRepeatClassId(repeatClasses[0].id);
		else if (repeatClasses.length === 0) setRepeatClassId("");
	}, [repeatClasses]);

	// Propose the year right after the deliberated one
	useEffect(() => {
		if (!targetYearId && availableYears.length > 0) {
			setTargetYearId(availableYears[0].id);
		}
	}, [availableYears, targetYearId]);

	// Reset classes when year changes
	useEffect(() => {
		setTargetClassId("");
		setRepeatClassId("");
	}, [targetYearId]);

	function close() {
		setTargetYearId("");
		setTargetClassId("");
		setRepeatClassId("");
		onDone();
	}

	const promoteMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.promoteAdmitted.mutate({
				deliberationId,
				// omit targetClassId for graduation (last level)
				...(needsTargetClass ? { targetClassId } : {}),
				...(needsRepeatClass ? { repeatClassId } : {}),
			}),
		onSuccess: (data) => {
			const parts = [
				[
					data.promotedCount,
					data.graduated
						? "admin.deliberations.promote.result.graduated"
						: "admin.deliberations.promote.result.promoted",
				],
				[data.repeatCount, "admin.deliberations.promote.result.repeating"],
				[data.excludedCount, "admin.deliberations.promote.result.excluded"],
				[data.undecidedCount, "admin.deliberations.promote.result.undecided"],
			] as const;
			const summary = parts
				.filter(([count]) => count > 0)
				.map(([count, key]) => t(key, { count }))
				.join(" · ");
			if (summary) toast.success(summary);
			const already = data.alreadyPromotedCount + data.alreadyRepeatingCount;
			if (already > 0) {
				toast.info(
					t("admin.deliberations.promote.alreadyPromoted", { count: already }),
				);
			}
			invalidateDeliberation();
			queryClient.invalidateQueries({
				queryKey: trpc.students.list.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.users.listPaged.queryKey(),
			});
			close();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	// Creates a missing class in place (generated code and name, same program
	// and option): next level for promoted students, same level for repeaters.
	// The class lists are refetched, then the class is selected.
	const createTargetMutation = useMutation({
		mutationFn: (level: "next" | "same") =>
			trpcClient.classes.createPromotionTarget.mutate({
				sourceClassId,
				targetAcademicYearId: targetYearId,
				level,
			}),
		onSuccess: async ({ klass, created }, level) => {
			if (created) {
				toast.success(
					t("admin.deliberations.promote.classCreated", { name: klass.name }),
				);
			}
			await queryClient.invalidateQueries({ queryKey: targetsKey });
			if (level === "same") setRepeatClassId(klass.id);
			else setTargetClassId(klass.id);
		},
		onError: (err) => toast.error((err as Error).message),
	});
	const createTargetClass = (level: "next" | "same") => {
		if (targetYearId) createTargetMutation.mutate(level);
	};

	const classesReady = !!targetYearId && !targetLoading;
	const showNoClassFound =
		classesReady && targetClasses.length === 0 && needsTargetClass;
	const showNoRepeatClassFound =
		classesReady && repeatClasses.length === 0 && needsRepeatClass;

	const canConfirm =
		(groups.admitted > 0 || groups.repeat > 0 || groups.excluded > 0) &&
		(!needsYear || !!targetYearId) &&
		(!needsTargetClass || !!targetClassId) &&
		(!needsRepeatClass || !!repeatClassId) &&
		!promoteMutation.isPending;

	return {
		targetYearId,
		setTargetYearId,
		targetClassId,
		setTargetClassId,
		repeatClassId,
		setRepeatClassId,
		baseLoading,
		targetLoading,
		availableYears,
		isLastLevel,
		sourceClass,
		nextLevel,
		targetClasses,
		repeatClasses,
		needsYear,
		needsTargetClass,
		needsRepeatClass,
		showNoClassFound,
		showNoRepeatClassFound,
		createTargetClass,
		creatingTarget: createTargetMutation.isPending,
		canConfirm,
		promoteMutation,
		close,
	};
}
