import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { computeGradeStats } from "../services/exam-format";

/** Grades (loaded once expanded) and approval of one submitted exam. */
export function useExamApproval(
	examId: string,
	expanded: boolean,
	onApproved: () => void,
) {
	const { t } = useTranslation();

	const gradesQuery = useQuery({
		queryKey: ["dean-grades", examId],
		enabled: expanded,
		queryFn: () =>
			trpcClient.grades.listByExam
				.query({ examId, limit: 200 })
				.then((r) => r.items),
	});

	const approveMutation = useMutation({
		mutationFn: () =>
			trpcClient.workflows.validateGrades.mutate({
				examId,
				approverId: undefined,
			}),
		onSuccess: () => {
			toast.success(t("dean.approvals.approved"));
			onApproved();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const grades = gradesQuery.data ?? [];
	const stats = computeGradeStats(grades.map((g) => Number(g.score)));

	return { gradesQuery, grades, approveMutation, ...stats };
}
