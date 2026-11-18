import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import { queryClient, trpcClient } from "@/utils/trpc";
import { TERMINAL_STATUSES } from "../services/transition-status";

export type DeferredOutcome = "review" | "repeat";

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
	const [sourceAcademicYearId, setSourceAcademicYearId] = useState("");
	const [targetAcademicYearId, setTargetAcademicYearId] = useState("");
	const [sourceClassId, setSourceClassId] = useState("all");
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
			sourceClassId,
		],
		queryFn: () =>
			trpcClient.academicYearTransitions.readiness.query({
				sourceAcademicYearId,
				targetAcademicYearId,
				classIds: sourceClassId === "all" ? [] : [sourceClassId],
				deferredOutcome,
			}),
		enabled: distinctYears,
	});

	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.academicYearTransitions.createDraft.mutate({
				sourceAcademicYearId,
				targetAcademicYearId,
				classIds: sourceClassId === "all" ? [] : [sourceClassId],
				deferredOutcome,
			}),
		onSuccess: async (transition) => {
			toast.success(t("admin.academicYearTransitions.toast.created"));
			await queryClient.invalidateQueries({
				queryKey: ["academic-year-transitions"],
			});
			void navigate(`/promotion/${transition.id}`);
		},
		onError: (error) => toast.error(error.message),
	});

	const duplicatePlan = (plans.data?.items ?? []).find(
		(p) =>
			p.sourceAcademicYearId === sourceAcademicYearId &&
			p.targetAcademicYearId === targetAcademicYearId &&
			!TERMINAL_STATUSES.includes(p.status),
	);

	return {
		sourceAcademicYearId,
		setSourceAcademicYearId,
		targetAcademicYearId,
		setTargetAcademicYearId,
		sourceClassId,
		setSourceClassId,
		deferredOutcome,
		setDeferredOutcome,
		years: yearsQuery.data?.items ?? [],
		classes: classesQuery.data?.items ?? [],
		readiness: readinessQuery.data,
		duplicatePlan,
		canCreate: distinctYears && !duplicatePlan,
		createMutation,
	};
}

export type CreateTransitionPlanState = ReturnType<
	typeof useCreateTransitionPlan
>;
