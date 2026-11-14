import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

/** Courses of the teacher (current year) with their exams. */
export function useTeacherCourses() {
	return useQuery({
		queryKey: ["teacher-hub-courses"],
		queryFn: () => trpcClient.classCourses.teacherOverview.query(),
	});
}

/** Grades already entered for an exam. */
export function useExamGradesSummary(examId: string) {
	return useQuery({
		queryKey: ["grades-summary", examId],
		queryFn: () =>
			trpcClient.grades.listByExam.query({ examId }).then((r) => r.items),
	});
}

/** Submits a locked exam for approval. */
export function useSubmitExam(examId: string) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => trpcClient.exams.submit.mutate({ examId }),
		onSuccess: () => {
			toast.success(
				t("teacher.workflow.toast.submitted", { defaultValue: "Soumis" }),
			);
			queryClient.invalidateQueries({ queryKey: ["teacher-hub-courses"] });
		},
		onError: (e: Error) => toast.error(e.message),
	});
}
