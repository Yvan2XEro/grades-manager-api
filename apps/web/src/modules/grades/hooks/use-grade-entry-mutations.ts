import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { GradeInput } from "../types";

/** Saves the grades of the form: upserts and deletes in one go. */
export function useSaveGrades(selectedExam: string) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: {
			inserts: GradeInput[];
			deletes: string[];
		}) => {
			await Promise.all([
				...payload.inserts.map((grade) =>
					trpcClient.grades.upsertNote.mutate(grade),
				),
				...payload.deletes.map((id) =>
					trpcClient.grades.deleteNote.mutate({ id }),
				),
			]);
		},
		onSuccess: () => {
			toast.success(t("teacher.gradeEntry.toast.saveSuccess"));
			if (selectedExam) {
				queryClient.invalidateQueries({
					queryKey: ["exam-grades", selectedExam],
				});
			}
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.gradeEntry.toast.saveError"));
		},
	});
}

/** Locks the selected exam (only possible once it is approved). */
export function useLockExam(selectedExam: string, courseId: string) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			if (!selectedExam) return;
			await trpcClient.exams.lock.mutate({ examId: selectedExam, lock: true });
		},
		onSuccess: () => {
			toast.success(t("teacher.gradeEntry.toast.lockSuccess"));
			if (courseId) {
				queryClient.invalidateQueries({
					queryKey: ["class-course-exams", courseId],
				});
			}
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.gradeEntry.toast.lockError"));
		},
	});
}

/** Removes a grade-editing delegate of the selected exam. */
export function useRevokeDelegate(selectedExam: string, onRevoked: () => void) {
	const { t } = useTranslation();
	return useMutation({
		mutationFn: async (delegateId: string) => {
			if (!selectedExam) {
				throw new Error("Missing exam");
			}
			return trpcClient.examGradeEditors.revoke.mutate({
				id: delegateId,
				examId: selectedExam,
			});
		},
		onSuccess: () => {
			toast.success(t("teacher.gradeEntry.delegates.revokeSuccess"));
			onRevoked();
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.delegates.revokeError"),
			);
		},
	});
}
