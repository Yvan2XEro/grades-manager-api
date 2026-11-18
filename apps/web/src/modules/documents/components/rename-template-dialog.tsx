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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ExportTemplate } from "@/utils/type";

/** Renames an export template; resolves `true` once saved. */
export const RenameTemplateDialog = createCallable<
	{ template: ExportTemplate },
	boolean
>(({ call, template }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const form = useForm<{ name: string }>({
		resolver: zodResolver(
			z.object({
				name: z.string().min(2, t("admin.exportTemplates.validation.name")),
			}),
		),
		defaultValues: { name: template.name },
	});

	const rename = useMutationFlow(
		call,
		async (call, values: { name: string }) => {
			try {
				await trpcClient.exportTemplates.update.mutate({
					id: template.id,
					name: values.name,
				});
				toast.success(t("admin.exportTemplates.toast.updateSuccess"));
				queryClient.invalidateQueries({
					queryKey: trpc.exportTemplates.listPaged.queryKey(),
				});
				call.end(true);
			} catch (error) {
				toast.error(
					(error as Error).message ||
						t("admin.exportTemplates.toast.updateError"),
				);
			}
		},
	);

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={rename.pending}
			className="sm:max-w-md"
			title={t("admin.exportTemplates.form.renameTitle")}
			description={t("admin.exportTemplates.form.renameDescription")}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(rename)} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admin.exportTemplates.form.name")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t(
											"admin.exportTemplates.form.namePlaceholder",
										)}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={rename.pending}
							onClick={() => call.end(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={rename.pending}>
							{rename.pending && <Spinner className="mr-2" />}
							{t("common.actions.save")}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
