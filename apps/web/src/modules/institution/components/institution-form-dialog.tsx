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
import { InstitutionSystemSummary } from "./institution-system-fields";

export type { Institution } from "../types";

export type InstitutionFormResult = RouterOutputs["institutions"]["create"];

/**
 * Creates or edits an institution (university, institution or faculty). The
 * parent institution can be created in place from the "+" next to its select,
 * with this same form, nested. The active academic year and registration
 * format are derived by the server and only shown here.
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
		queryClient.setQueryData(trpc.institutions.list.queryKey(), (old) =>
			upsertInList(old, parent),
		);
		form.setValue("parentInstitutionId", parent.id, { shouldValidate: true });
	};

	const submit = useMutationFlow(
		call,
		async (call, values: InstitutionFormValues) => {
			try {
				// The active year and format are not institution fields: the server derives them
				const {
					defaultAcademicYearId: _year,
					registrationFormatId: _format,
					...fields
				} = values;
				const shared = toInstitutionPayload(fields);
				const saved = editingInstitution
					? await trpcClient.institutions.update.mutate({
							id: editingInstitution.id,
							data: shared,
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
				call.end(saved);
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
						system={<InstitutionSystemSummary />}
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
