import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { PromotionSelection } from "../types";

/**
 * Rule / class / year selection, the (manually triggered) class evaluation,
 * the refresh of the class facts and the selection of eligible students.
 */
export function useEvaluatePromotion() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [selectedRuleId, setSelectedRuleId] = useState<string>("");
	const [selectedSourceClassId, setSelectedSourceClassId] =
		useState<string>("");
	const [selectedAcademicYearId, setSelectedAcademicYearId] =
		useState<string>("");
	const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
		new Set(),
	);
	const [hasEvaluated, setHasEvaluated] = useState(false);

	const { data: rules } = useQuery({
		queryKey: ["promotionRules", { isActive: true }],
		queryFn: async () =>
			trpcClient.promotionRules.list.query({ isActive: true }),
	});

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => trpcClient.classes.list.query({}),
	});

	// Prefetched as before (its data is not used here)
	useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => trpcClient.academicYears.list.query({}),
	});

	const {
		data: evaluationResult,
		refetch: evaluateClass,
		isLoading: isEvaluating,
	} = useQuery({
		queryKey: [
			"promotionEvaluation",
			{
				ruleId: selectedRuleId,
				sourceClassId: selectedSourceClassId,
				academicYearId: selectedAcademicYearId,
			},
		],
		queryFn: async () =>
			trpcClient.promotionRules.evaluateClass.query({
				ruleId: selectedRuleId,
				sourceClassId: selectedSourceClassId,
				academicYearId: selectedAcademicYearId,
			}),
		enabled: false, // Manual trigger only
	});

	const { mutateAsync: refreshClassFacts, isPending: isRefreshingFacts } =
		useMutation({
			mutationFn: (input: { classId: string; academicYearId: string }) =>
				trpcClient.promotionRules.refreshClassSummaries.mutate(input),
		});

	const evaluate = async () => {
		if (!selectedRuleId || !selectedSourceClassId || !selectedAcademicYearId) {
			toast.error(t("admin.promotionRules.evaluate.toast.selectAll"));
			return;
		}
		setHasEvaluated(true);
		setSelectedStudents(new Set());
		await evaluateClass();
	};

	const refreshFacts = async () => {
		if (!selectedSourceClassId || !selectedAcademicYearId) {
			toast.error(t("admin.promotionRules.evaluate.toast.selectAll"));
			return;
		}
		try {
			await refreshClassFacts({
				classId: selectedSourceClassId,
				academicYearId: selectedAcademicYearId,
			});
			toast.success(t("admin.promotionRules.evaluate.toast.refreshSuccess"));
			if (hasEvaluated) {
				await evaluateClass();
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : t("common.errors.unknown");
			toast.error(
				t("admin.promotionRules.evaluate.toast.refreshError", {
					error: message,
				}),
			);
		}
	};

	const toggleStudent = (studentId: string) => {
		const next = new Set(selectedStudents);
		if (next.has(studentId)) {
			next.delete(studentId);
		} else {
			next.add(studentId);
		}
		setSelectedStudents(next);
	};

	const selectAll = () => {
		if (!evaluationResult) return;
		setSelectedStudents(
			new Set(evaluationResult.eligible.map((e) => e.student.id)),
		);
	};

	const deselectAll = () => setSelectedStudents(new Set());

	/** Opens the execute tab with the selected students (router state). */
	const proceed = () => {
		if (selectedStudents.size === 0) {
			toast.error(t("admin.promotionRules.evaluate.toast.selectStudent"));
			return;
		}
		const state: PromotionSelection = {
			ruleId: selectedRuleId,
			sourceClassId: selectedSourceClassId,
			academicYearId: selectedAcademicYearId,
			studentIds: Array.from(selectedStudents),
		};
		navigate("/promotion-legacy?tab=execute", { state });
	};

	return {
		rules: rules?.items,
		classes: classes?.items,
		selectedRuleId,
		setSelectedRuleId,
		selectedSourceClassId,
		setSelectedSourceClassId,
		selectedAcademicYearId,
		setSelectedAcademicYearId,
		selectedStudents,
		hasEvaluated,
		evaluationResult,
		isEvaluating,
		isRefreshingFacts,
		evaluate,
		refreshFacts,
		toggleStudent,
		selectAll,
		deselectAll,
		proceed,
	};
}

export type EvaluatePromotionState = ReturnType<typeof useEvaluatePromotion>;
