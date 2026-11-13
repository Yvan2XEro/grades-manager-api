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
	type ClassFormData,
	toClassPayload,
	useClassForm,
} from "../hooks/use-class-form";
import { ClassFormFields } from "./class-form-fields";

export { classFormKeys } from "../hooks/use-class-form";

export type ClassFormResult = RouterOutputs["classes"]["create"];

interface Props {
	/** Prefills the form, e.g. the year of the list the caller is showing. */
	defaults?: { academicYearId?: string; programId?: string };
	/** Prevents changing the year, e.g. when the caller lists one year's classes. */
	lockAcademicYear?: boolean;
	/** Codes already used, so the suggested code doesn't collide. */
	existingCodes?: string[];
}

/**
 * Creates a class. Every dependency (program, academic year, cycle level,
 * program option) can be created in place from the "+" next to its select;
 * the new entity is written into the React Query cache feeding that select
 * and selected right away.
 */
export const ClassFormDialog = createCallable<
	Props,
	ClassFormResult | undefined
>(({ call, defaults, lockAcademicYear, existingCodes }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const controller = useClassForm({
		mode: "create",
		values: defaults,
		existingCodes,
	});

	const submit = useMutationFlow(call, async (call, data: ClassFormData) => {
		try {
			const created = await trpcClient.classes.create.mutate(
				toClassPayload(data),
			);
			for (const queryKey of [
				trpc.classes.listPaged.queryKey(),
				trpc.classes.list.queryKey(),
				["class-select"],
				["classes"],
				["class-options"],
			])
				queryClient.invalidateQueries({ queryKey });
			toast.success(t("admin.classes.toast.createSuccess"));
			call.end(created);
		} catch (error) {
			toast.error(
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.createError"),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={t("admin.classes.form.createTitle")}
		>
			<Form {...controller.form}>
				<form
					onSubmit={controller.form.handleSubmit(submit)}
					className="space-y-4"
				>
					<ClassFormFields
						controller={controller}
						lockAcademicYear={lockAcademicYear}
					/>
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
								t("admin.classes.form.createSubmit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
