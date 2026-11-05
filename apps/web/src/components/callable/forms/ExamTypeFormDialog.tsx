import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
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
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import type { ExamType } from "@/utils/type";

export type ExamTypeFormResult = RouterOutputs["examTypes"]["create"];

interface Props {
	examType?: ExamType;
}

/** Creates or edits an exam type; resolves with it, or `undefined` when dismissed. */
export const ExamTypeFormDialog = createCallable<
	Props,
	ExamTypeFormResult | undefined
>(({ call, examType }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const schema = useMemo(
		() =>
			z.object({
				name: z.string().min(2, t("admin.examTypes.form.nameLabel")),
				description: z.string().optional(),
				defaultPercentage: z.coerce.number().int().min(1).max(100).optional(),
			}),
		[t],
	);
	type FormInput = z.input<typeof schema>;
	type FormValues = z.output<typeof schema>;

	const form = useForm<FormInput, unknown, FormValues>({
		resolver: zodResolver(schema),
		defaultValues: examType
			? {
					name: examType.name,
					description: examType.description ?? "",
					defaultPercentage: examType.defaultPercentage ?? 40,
				}
			: { name: "", description: "", defaultPercentage: 40 },
	});

	const submit = useMutationFlow(call, async (call, values: FormValues) => {
		const payload = {
			name: values.name,
			description: values.description || undefined,
			defaultPercentage: values.defaultPercentage,
		};
		try {
			const saved = examType
				? await trpcClient.examTypes.update.mutate({
						id: examType.id,
						...payload,
					})
				: await trpcClient.examTypes.create.mutate(payload);
			toast.success(
				examType
					? t("admin.examTypes.toast.updateSuccess")
					: t("admin.examTypes.toast.createSuccess"),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.examTypes.listPaged.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.examTypes.list.queryKey(),
			});
			call.end(saved as ExamTypeFormResult);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: examType
						? t("admin.examTypes.toast.updateError")
						: t("admin.examTypes.toast.createError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="sm:max-w-lg"
			title={
				examType
					? t("admin.examTypes.form.editTitle")
					: t("admin.examTypes.form.createTitle")
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admin.examTypes.form.nameLabel")}</FormLabel>
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
									{t("admin.examTypes.form.descriptionLabel")}
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
						name="defaultPercentage"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.examTypes.form.defaultPercentageLabel")}
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										max={100}
										{...field}
										value={(field.value as number | undefined) ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="ghost"
							type="button"
							disabled={submit.pending}
							onClick={() => call.end(undefined)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending
								? t("common.actions.saving")
								: t("admin.examTypes.form.submit")}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
