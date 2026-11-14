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
import {
	type TeachingUnitFormData,
	useTeachingUnitFormState,
} from "../hooks/use-teaching-unit-form";
import { TeachingUnitFormFields } from "./teaching-unit-form-fields";

export type TeachingUnitFormResult = RouterOutputs["teachingUnits"]["create"];

interface Props {
	/** The program the unit (UE) belongs to; required by the API. */
	programId: string;
}

/** Creates a teaching unit (UE) in a program; resolves with it, or `undefined`. */
export const TeachingUnitFormDialog = createCallable<
	Props,
	TeachingUnitFormResult | undefined
>(({ call, programId }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const form = useTeachingUnitFormState({ programId });

	const submit = useMutationFlow(
		call,
		async (call, data: TeachingUnitFormData) => {
			try {
				const unit = await trpcClient.teachingUnits.create.mutate(data);
				queryClient.invalidateQueries({
					queryKey: trpc.teachingUnits.listPaged.queryKey(),
				});
				queryClient.invalidateQueries({ queryKey: ["teachingUnits"] });
				toast.success(
					t("admin.teachingUnits.toast.created", {
						defaultValue: "Teaching unit created",
					}),
				);
				call.end(unit);
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
			className="sm:max-w-lg"
			title={t("admin.teachingUnits.actions.create", {
				defaultValue: "Create UE",
			})}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<TeachingUnitFormFields form={form} />
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
							) : (
								t("common.actions.create", { defaultValue: "Create" })
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
