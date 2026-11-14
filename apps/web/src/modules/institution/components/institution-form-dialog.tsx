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
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { AcademicYearFormDialog } from "@/modules/academic-years/AcademicYearFormDialog";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	type InstitutionFormValues,
	institutionDefaultValues,
	institutionToFormValues,
	toInstitutionPayload,
	useInstitutionForm,
} from "../hooks/use-institution-form";
import type { Institution } from "../types";
import { InstitutionFormFields } from "./institution-form-fields";
import { InstitutionSystemFields } from "./institution-system-fields";

export type { Institution } from "../types";

export type InstitutionFormResult = RouterOutputs["institutions"]["create"];

/**
 * Creates or edits an institution (university, institution or faculty). The
 * parent institution and default academic year can be created in place from
 * the "+" next to their select — the parent with this same form, nested.
 */
export const InstitutionFormDialog = createCallable<
	{ institution?: Institution; defaults?: Partial<InstitutionFormValues> },
	InstitutionFormResult | undefined
>(({ call, institution, defaults }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const editingInstitution = institution ?? null;

	const { form, institutions } = useInstitutionForm({
		defaultValues: institution
			? institutionToFormValues(institution)
			: { ...institutionDefaultValues, ...defaults },
		inheritFromParent: true,
	});

	const createParentInstitution = async () => {
		const parent = await InstitutionFormDialog.call({
			defaults: { type: "university" },
		});
		if (!parent) return;
		queryClient.setQueryData<Institution[]>(
			trpc.institutions.list.queryKey() as readonly unknown[],
			(old) => upsertInList(old ?? [], parent as Institution),
		);
		form.setValue("parentInstitutionId", parent.id, { shouldValidate: true });
	};

	const createAcademicYear = async () => {
		const year = await AcademicYearFormDialog.call({});
		if (!year) return;
		await queryClient.invalidateQueries({
			queryKey: trpc.academicYears.list.queryKey(),
		});
		form.setValue("defaultAcademicYearId", year.id);
	};

	const submit = useMutationFlow(
		call,
		async (call, values: InstitutionFormValues) => {
			try {
				const shared = toInstitutionPayload(values);
				const saved = editingInstitution
					? await trpcClient.institutions.update.mutate({
							id: editingInstitution.id,
							data: {
								...shared,
								defaultAcademicYearId:
									values.defaultAcademicYearId || undefined,
								registrationFormatId: values.registrationFormatId || undefined,
							},
						})
					: await trpcClient.institutions.create.mutate(shared);
				toast.success(
					editingInstitution
						? t("admin.institutions.toast.updateSuccess", {
								defaultValue: "Institution updated",
							})
						: t("admin.institutions.toast.createSuccess", {
								defaultValue: "Institution created",
							}),
				);
				queryClient.invalidateQueries({
					queryKey: trpc.institutions.list.queryKey(),
				});
				call.end(saved as InstitutionFormResult);
			} catch (error) {
				toast.error((error as Error).message);
			}
		},
	);
	const isSaving = submit.pending;

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={isSaving}
			className="sm:max-w-5xl"
			contentClassName="max-h-[calc(90vh-8rem)]"
			title={
				editingInstitution
					? t("admin.institutions.form.editTitle", {
							defaultValue: "Edit institution",
						})
					: t("admin.institutions.form.createTitle", {
							defaultValue: "Create institution",
						})
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-6 pt-2">
					<InstitutionFormFields
						form={form}
						variant="dialog"
						institutions={institutions}
						currentId={editingInstitution?.id}
						onCreateParent={createParentInstitution}
						system={
							<InstitutionSystemFields
								form={form}
								onCreateAcademicYear={createAcademicYear}
							/>
						}
					/>

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="ghost"
							type="button"
							disabled={isSaving}
							onClick={() => call.end(undefined)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={isSaving}>
							{isSaving
								? t("common.actions.saving")
								: editingInstitution
									? t("common.actions.save")
									: t("admin.institutions.form.submit", {
											defaultValue: "Create",
										})}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
