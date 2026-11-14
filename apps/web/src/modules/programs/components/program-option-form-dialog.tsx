import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

const optionSchema = z.object({
	name: z.string().min(1, "Name is required"),
	code: z.string().min(1, "Code is required"),
	description: z.string().optional(),
});
type OptionFormData = z.infer<typeof optionSchema>;

type ProgramOption = RouterOutputs["programOptions"]["list"]["items"][number];

export type ProgramOptionFormResult = RouterOutputs["programOptions"]["create"];

interface Props {
	programId: string;
	option?: ProgramOption;
}

/** Creates or edits a program option; resolves with it, or `undefined`. */
export const ProgramOptionFormDialog = createCallable<
	Props,
	ProgramOptionFormResult | undefined
>(({ call, programId, option }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const form = useForm<OptionFormData>({
		resolver: zodResolver(optionSchema),
		defaultValues: option
			? {
					name: option.name,
					code: option.code,
					description: option.description ?? "",
				}
			: { name: "", code: "", description: "" },
	});

	const submit = useMutationFlow(call, async (call, data: OptionFormData) => {
		try {
			const saved = option
				? await trpcClient.programOptions.update.mutate({
						id: option.id,
						programId,
						...data,
					})
				: await trpcClient.programOptions.create.mutate({ ...data, programId });
			toast.success(
				option
					? t("admin.programs.options.toast.update", {
							defaultValue: "Option updated",
						})
					: t("admin.programs.options.toast.create", {
							defaultValue: "Option added",
						}),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.programOptions.list.queryKey(),
			});
			queryClient.invalidateQueries({ queryKey: ["programOptions"] });
			call.end(saved as ProgramOptionFormResult);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="sm:max-w-lg"
			title={
				option
					? t("admin.programs.options.edit", { defaultValue: "Edit Option" })
					: t("admin.programs.options.add", { defaultValue: "Add Option" })
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.programs.options.fields.name", {
										defaultValue: "Name",
									})}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="code"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.programs.options.fields.code", {
										defaultValue: "Code",
									})}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.programs.options.fields.description", {
										defaultValue: "Description",
									})}
								</FormLabel>
								<FormControl>
									<Textarea {...field} rows={2} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
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
							{submit.pending
								? t("common.actions.saving", { defaultValue: "Saving..." })
								: option
									? t("common.actions.saveChanges")
									: t("common.actions.create", { defaultValue: "Create" })}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
