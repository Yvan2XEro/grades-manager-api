import { useQueryClient } from "@tanstack/react-query";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { type ExamFormData, useExamForm } from "../hooks/use-exam-form";
import type { ExamFormValuesIn } from "../types";
import { ExamFormFields } from "./exam-form-fields";

export type { ExamFormValuesIn };

/**
 * Creates or edits an exam. A missing class-course assignment can be created
 * in place from the "+", which itself lets you create the class or course.
 */
export const ExamFormDialog = createCallable<
	{ exam?: ExamFormValuesIn },
	boolean
>(({ call, exam }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { form, classCourseOptions, createClassCourse } = useExamForm(exam);

	const submit = useMutationFlow(call, async (call, data: ExamFormData) => {
		try {
			if (exam) {
				await trpcClient.exams.update.mutate({
					id: exam.id,
					...data,
					date: new Date(data.date),
				});
				toast.success(t("admin.exams.toast.updateSuccess"));
			} else {
				await trpcClient.exams.create.mutate({
					...data,
					date: new Date(data.date),
				});
				toast.success(t("admin.exams.toast.createSuccess"));
			}
			queryClient.invalidateQueries({
				queryKey: trpc.exams.listPaged.queryKey(),
			});
			call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: exam
						? t("admin.exams.toast.updateError")
						: t("admin.exams.toast.createError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={submit.pending}
			title={
				exam
					? t("admin.exams.form.editTitle")
					: t("admin.exams.form.createTitle")
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<ExamFormFields
						form={form}
						classCourseOptions={classCourseOptions}
						onCreateClassCourse={createClassCourse}
					/>

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={submit.pending}
							onClick={() => call.end(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : exam ? (
								t("common.actions.saveChanges")
							) : (
								t("admin.exams.form.submit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
