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
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import { type CourseFormData, useCourseForm } from "../hooks/use-course-form";
import type { EditableCourse } from "../types";
import { CourseFormFields } from "./course-form-fields";

export type CourseFormResult = RouterOutputs["courses"]["create"];

interface Props {
	course?: EditableCourse;
	defaults?: { program?: string; teachingUnitId?: string };
}

/**
 * Creates or edits a course; resolves with it, or `undefined` when dismissed.
 * A missing program can be created in place from the "+" next to its select.
 */
export const CourseFormDialog = createCallable<
	Props,
	CourseFormResult | undefined
>(({ call, course, defaults }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const controller = useCourseForm({ course, defaults });

	const submit = useMutationFlow(call, async (call, data: CourseFormData) => {
		try {
			const saved = course
				? await trpcClient.courses.update.mutate({ id: course.id, ...data })
				: await trpcClient.courses.create.mutate(data);
			queryClient.invalidateQueries({
				queryKey: trpc.courses.listPaged.queryKey(),
			});
			queryClient.invalidateQueries({ queryKey: trpc.courses.list.queryKey() });
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			queryClient.invalidateQueries({ queryKey: ["course-options"] });
			toast.success(
				course
					? t("admin.courses.toast.updateSuccess")
					: t("admin.courses.toast.createSuccess"),
			);
			call.end(saved as CourseFormResult);
		} catch (error) {
			toast.error(
				(error as Error).message ||
					(course
						? t("admin.courses.toast.updateError")
						: t("admin.courses.toast.createError")),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={
				course
					? t("admin.courses.form.editTitle")
					: t("admin.courses.form.createTitle")
			}
		>
			<Form {...controller.form}>
				<form
					onSubmit={controller.form.handleSubmit(submit)}
					className="space-y-4"
				>
					<CourseFormFields controller={controller} />
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={submit.pending}
							onClick={() => call.end(undefined)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : course ? (
								t("common.actions.saveChanges")
							) : (
								t("admin.courses.form.createSubmit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
