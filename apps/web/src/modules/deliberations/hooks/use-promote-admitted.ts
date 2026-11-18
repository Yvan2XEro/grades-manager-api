import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { ClassFormDialog } from "@/modules/classes/components/class-form-dialog";
import { trpcClient } from "@/utils/trpc";
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
	const targetClasses = targetData?.targetClasses ?? [];

	// Auto-select when exactly one class matches
	useEffect(() => {
		if (targetClasses.length === 1) {
			setTargetClassId(targetClasses[0].id);
		} else if (targetClasses.length === 0) {
			setTargetClassId("");
		}
	}, [targetClasses]);

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
			toast.success(
				t("admin.deliberations.promote.success", {
					count: data.promotedCount,
				}),
			);
			invalidateDeliberation();
			close();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	// Creates the missing target class in place. Matching target classes are
	// computed server-side (program + next level), so the list is refetched
	// rather than patched, then the new class is selected.
	const createTargetClass = async () => {
		if (!targetYearId) return;
		const created = await ClassFormDialog.call({
			defaults: {
				programId: sourceClass?.program,
				academicYearId: targetYearId,
			},
			lockAcademicYear: true,
		});
		if (!created) return;
		await queryClient.invalidateQueries({
			queryKey: ["promo-targets", sourceClassId, targetYearId],
		});
		setTargetClassId(created.id);
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
		targetClasses,
		showNoClassFound,
		createTargetClass,
		promoteMutation,
		close,
	};
}
