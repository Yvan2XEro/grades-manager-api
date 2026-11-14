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
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import {
	type StudyCycleFormData,
	useStudyCycleForm,
} from "../hooks/use-study-cycle-form";
import type { StudyCycle } from "../types";
import { StudyCycleFormFields } from "./study-cycle-form-fields";

export type StudyCycleFormResult = RouterOutputs["studyCycles"]["createCycle"];

interface Props {
	cycle?: StudyCycle;
}

/** Creates or edits a study cycle; resolves with the saved cycle, or `undefined`. */
export const StudyCycleFormDialog = createCallable<
	Props,
	StudyCycleFormResult | undefined
>(({ call, cycle }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { form, autoLevelsPreview } = useStudyCycleForm(cycle);

	const submit = useMutationFlow(
		call,
		async (call, data: StudyCycleFormData) => {
			try {
				const saved = cycle
					? await trpcClient.studyCycles.updateCycle.mutate({
							...data,
							id: cycle.id,
						})
					: await trpcClient.studyCycles.createCycle.mutate(data);
				toast.success(
					cycle
						? t("admin.studyCycles.toast.updateSuccess", {
								defaultValue: "Study cycle updated",
							})
						: t("admin.studyCycles.toast.createSuccess", {
								defaultValue: "Study cycle created",
							}),
				);
				queryClient.invalidateQueries({
					queryKey: trpc.studyCycles.listPaged.queryKey(),
				});
				queryClient.invalidateQueries({ queryKey: ["study-cycles-select"] });
				call.end(saved as StudyCycleFormResult);
			} catch (error) {
				toast.error((error as Error).message);
			}
		},
	);

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="sm:max-w-xl"
			title={
				cycle
					? t("admin.studyCycles.actions.update", {
							defaultValue: "Update cycle",
						})
					: t("admin.studyCycles.actions.add", { defaultValue: "Add cycle" })
			}
		>
			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
					<StudyCycleFormFields form={form} />
					{!cycle && autoLevelsPreview.length > 0 && (
						<div className="rounded-lg border border-dashed bg-muted/40 p-3">
							<p className="mb-2 font-medium text-muted-foreground text-xs">
								{t("admin.studyCycles.form.autoLevelsPreview", {
									defaultValue: "Levels that will be auto-created:",
								})}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{autoLevelsPreview.map((lvl) => (
									<span
										key={lvl.code}
										className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs"
									>
										{lvl.code} · {lvl.minCredits} cr
									</span>
								))}
							</div>
						</div>
					)}
					<Button type="submit" className="w-full" disabled={submit.pending}>
						{t("common.actions.save")}
					</Button>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
