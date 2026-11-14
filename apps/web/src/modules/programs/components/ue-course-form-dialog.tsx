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
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { teachingUnitCoursesKey } from "../hooks/use-teaching-unit-courses";
import {
	type UeCourseFormData,
	useUeCourseForm,
} from "../hooks/use-ue-course-form";
import type { UeCourse } from "../types";
import { UeCourseFormFields } from "./ue-course-form-fields";

/**
 * Creates or edits a course (EC) of a teaching unit; the code is suggested
 * from the program and semester. Resolves `true` once saved.
 */
export const UeCourseFormDialog = createCallable<
	{
		teachingUnitId: string;
		programId: string;
		semesterCode?: string;
		existingCodes: string[];
		course?: UeCourse;
	},
	boolean
>(
	({
		call,
		teachingUnitId,
		programId,
		semesterCode,
		existingCodes,
		course,
	}) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const controller = useUeCourseForm({
			programId,
			semesterCode,
			existingCodes,
			course,
		});
		const { form } = controller;

		const submit = useMutationFlow(
			call,
			async (call, data: UeCourseFormData) => {
				try {
					if (course) {
						await trpcClient.courses.update.mutate({
							id: course.id,
							name: data.name,
							hours: data.hours,
							code: data.code,
							defaultTeacher: data.defaultTeacher,
							defaultCoefficient: data.defaultCoefficient,
							program: programId,
							teachingUnitId,
						});
						toast.success(
							t("admin.teachingUnits.courses.toast.updateSuccess", {
								defaultValue: "Element updated",
							}),
						);
					} else {
						await trpcClient.courses.create.mutate({
							...data,
							program: programId,
							teachingUnitId,
						});
						toast.success(
							t("admin.teachingUnits.courses.toast.createSuccess", {
								defaultValue: "Element created",
							}),
						);
					}
					queryClient.invalidateQueries({
						queryKey: teachingUnitCoursesKey(teachingUnitId),
					});
					queryClient.invalidateQueries({ queryKey: ["courses"] });
					queryClient.invalidateQueries({ queryKey: ["course-options"] });
					call.end(true);
				} catch (error) {
					toast.error((error as Error).message);
				}
			},
		);

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={submit.pending}
				title={
					course
						? t("admin.teachingUnits.courses.form.editTitle", {
								defaultValue: "Edit element",
							})
						: t("admin.teachingUnits.courses.form.createTitle", {
								defaultValue: "Add element",
							})
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
						<UeCourseFormFields controller={controller} />

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={submit.pending}
								onClick={() => call.end(false)}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={submit.pending}>
								{submit.pending
									? t("common.actions.saving", {
											defaultValue: "Saving...",
										})
									: course
										? t("common.actions.saveChanges")
										: t("admin.teachingUnits.courses.form.submit")}
							</Button>
						</div>
					</form>
				</Form>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
