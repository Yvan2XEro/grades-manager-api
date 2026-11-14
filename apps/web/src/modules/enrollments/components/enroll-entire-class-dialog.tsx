import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { PrerequisiteWarning } from "../types";
import { PrerequisiteWarningsList } from "./prerequisite-warnings-list";

/**
 * Confirms then enrolls every student of a class in its courses. When the
 * server reports prerequisite warnings, the dialog stays open to show them.
 */
export const EnrollEntireClassDialog = createCallable<{
	classId: string;
	academicYearId: string;
	semesterId?: string;
	studentsCount: number;
	coursesCount: number;
}>(
	({
		call,
		classId,
		academicYearId,
		semesterId,
		studentsCount,
		coursesCount,
	}) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const [autoEnrollWarnings, setAutoEnrollWarnings] = useState<
			PrerequisiteWarning[]
		>([]);
		const classCoursesCount = coursesCount;

		const autoEnrollMutation = useMutation({
			mutationFn: () =>
				trpcClient.studentCourseEnrollments.autoEnrollClass.mutate({
					classId,
					academicYearId,
					semesterId,
				}),
			onSuccess: (result) => {
				toast.success(
					t("admin.enrollments.toast.autoEnrollSuccess", {
						defaultValue: "Class roster synced ({{count}} records)",
						count: result.createdCount,
					}),
				);
				queryClient.invalidateQueries({
					queryKey: trpc.studentCourseEnrollments.list.queryKey(),
				});
				if (result.warnings?.length) setAutoEnrollWarnings(result.warnings);
				else call.end();
			},
			onError: (error: Error) => toast.error(error.message),
		});

		// preventDefault keeps AlertDialogAction from closing while the mutation runs
		const handleAutoEnrollConfirm = (event: { preventDefault: () => void }) => {
			event.preventDefault();
			setAutoEnrollWarnings([]);
			autoEnrollMutation.mutate();
		};

		return (
			<AlertDialog
				open={!call.ended}
				onOpenChange={(o) => !o && !autoEnrollMutation.isPending && call.end()}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.enrollments.autoEnroll.title", {
								defaultValue: "Enroll every student?",
							})}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.enrollments.autoEnroll.description", {
								defaultValue:
									"This action enrolls {{students}} students into {{courses}} courses. Existing enrollments remain untouched.",
								students: studentsCount,
								courses: classCoursesCount,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{autoEnrollWarnings.length > 0 ? (
						<div className="py-2">
							<PrerequisiteWarningsList warnings={autoEnrollWarnings} t={t} />
						</div>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={autoEnrollMutation.isPending}>
							{t("common.actions.cancel", { defaultValue: "Cancel" })}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleAutoEnrollConfirm}
							disabled={autoEnrollMutation.isPending}
						>
							{autoEnrollMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.enrollments.autoEnroll.confirm", {
								defaultValue: "Confirm enrollment",
							})}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	},
	DIALOG_EXIT_MS,
);
