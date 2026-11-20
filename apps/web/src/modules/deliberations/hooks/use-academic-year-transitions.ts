import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { sortYearsRecentFirst } from "@/lib/academic-years";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { TERMINAL_STATUSES } from "../services/transition-status";

export type DeferredOutcome = "review" | "repeat";

/** Server error prefix when a new plan shares classes with a plan in progress. */
const PLAN_OVERLAP = "TRANSITION_PLAN_OVERLAP";

/** Existing transition plans. */
export function useTransitionPlans() {
	return useQuery({
		queryKey: ["academic-year-transitions"],
		queryFn: () => trpcClient.academicYearTransitions.list.query({ limit: 50 }),
	});
}

/**
 * Form state of a new transition plan (source/target years, class scope,
 * deferred policy), its pre-flight readiness and the create action.
 */
export function useCreateTransitionPlan(
	plans: ReturnType<typeof useTransitionPlans>,
) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [sourceAcademicYearId, setSourceAcademicYearId] = useState("");
	const [targetAcademicYearId, setTargetAcademicYearId] = useState("");
	// Empty: every class of the source year
	const [sourceClassIds, setSourceClassIds] = useState<string[]>([]);
	const [deferredOutcome, setDeferredOutcome] =
		useState<DeferredOutcome>("review");

	const yearsQuery = useQuery({
		queryKey: ["academic-years", "transition"],
		queryFn: () => trpcClient.academicYears.list.query({ limit: 100 }),
	});
	const classesQuery = useQuery({
		queryKey: ["classes", sourceAcademicYearId],
		queryFn: () =>
			trpcClient.classes.list.query({
				academicYearId: sourceAcademicYearId,
				limit: 500,
			}),
		enabled: Boolean(sourceAcademicYearId),
	});

	const distinctYears = Boolean(
		sourceAcademicYearId &&
			targetAcademicYearId &&
			sourceAcademicYearId !== targetAcademicYearId,
	);

	const readinessQuery = useQuery({
		queryKey: [
			"academic-year-transition-preflight",
			sourceAcademicYearId,
			targetAcademicYearId,
			sourceClassIds,
		],
		queryFn: () =>
			trpcClient.academicYearTransitions.readiness.query({
				sourceAcademicYearId,
				targetAcademicYearId,
				classIds: sourceClassIds,
				deferredOutcome,
			}),
		enabled: distinctYears,
	});

	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.academicYearTransitions.createDraft.mutate({
				sourceAcademicYearId,
				targetAcademicYearId,
				classIds: sourceClassIds,
				deferredOutcome,
			}),
		onSuccess: async (transition) => {
			toast.success(t("admin.academicYearTransitions.toast.created"));
			await queryClient.invalidateQueries({
				queryKey: ["academic-year-transitions"],
			});
			void navigate(`/promotion/${transition.id}`);
		},
		onError: (error) => {
			// TRANSITION_PLAN_OVERLAP:<planId>:<class codes>
			const message = (error as Error).message ?? "";
			if (message.startsWith(`${PLAN_OVERLAP}:`)) {
				const [, , classes] = message.split(":");
				toast.error(
					t("admin.academicYearTransitions.toast.planOverlap", { classes }),
				);
				return;
			}
			toast.error(t("admin.academicYearTransitions.toast.actionError"));
		},
	});

	// Plans in progress for these years that already cover some of the classes
	const overlappingPlans = readinessQuery.data?.overlappingPlans ?? [];
	// Other plans in progress for these years (on other classes): shown for
	// information, several plans may run side by side.
	const otherPlans = (plans.data?.items ?? []).filter(
		(p) =>
			p.sourceAcademicYearId === sourceAcademicYearId &&
			p.targetAcademicYearId === targetAcademicYearId &&
			!TERMINAL_STATUSES.includes(p.status) &&
			!overlappingPlans.some((o) => o.id === p.id),
	);

	return {
		sourceAcademicYearId,
		setSourceAcademicYearId,
		targetAcademicYearId,
		setTargetAcademicYearId,
		sourceClassIds,
		setSourceClassIds,
		deferredOutcome,
		setDeferredOutcome,
		// Most recent year first
		years: sortYearsRecentFirst(yearsQuery.data?.items ?? []),
		classes: classesQuery.data?.items ?? [],
		readiness: readinessQuery.data,
		overlappingPlans,
		otherPlans,
		canCreate:
			distinctYears &&
			overlappingPlans.length === 0 &&
			readinessQuery.data?.canGenerate === true,
		createMutation,
	};
}

export type CreateTransitionPlanState = ReturnType<
	typeof useCreateTransitionPlan
>;
