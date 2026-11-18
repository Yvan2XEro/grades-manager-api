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
import { DatePicker } from "@/components/ui/date-picker";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Creates a retake session of an approved exam; resolves `true` once created. */
export const RetakeExamDialog = createCallable<
	{
		parentExam: {
			id: string;
			name: string;
			courseName?: string | null;
			className?: string | null;
		};
	},
	boolean
>(({ call, parentExam }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const schema = useMemo(
		() =>
			z.object({
				name: z.string().optional(),
				date: z.string().min(1, t("admin.exams.validation.date")),
				scoringPolicy: z.enum(["replace", "best_of"]).default("replace"),
			}),
		[t],
	);
	type RetakeFormInput = z.input<typeof schema>;
	type RetakeFormData = z.output<typeof schema>;

	const form = useForm<RetakeFormInput, unknown, RetakeFormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: `${parentExam.name} - ${t("retakes.badge.retake")}`,
			date: "",
			scoringPolicy: "replace",
		},
	});

	const submit = useMutationFlow(call, async (call, data: RetakeFormData) => {
		try {
			await trpcClient.exams.createRetake.mutate({
				parentExamId: parentExam.id,
				name: data.name || undefined,
				date: new Date(data.date),
				scoringPolicy: data.scoringPolicy,
			});
			queryClient.invalidateQueries({
				queryKey: trpc.exams.listPaged.queryKey(),
			});
			toast.success(t("admin.exams.toast.retakeSuccess"));
			call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.retakeError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={submit.pending}
			title={t("retakes.form.title")}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<div className="rounded-md border bg-muted/50 p-4">
						<p className="text-muted-foreground text-xs">
							{t("retakes.form.parentExamLabel")}
						</p>
						<p className="font-medium">{parentExam.name}</p>
						<p className="text-muted-foreground text-xs">
							{parentExam.courseName} - {parentExam.className}
						</p>
					</div>

					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("retakes.form.nameLabel")}</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder={`${parentExam.name} - ${t("retakes.badge.retake")}`}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="date"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("retakes.form.dateLabel")}</FormLabel>
								<FormControl>
									<DatePicker
										value={field.value ?? ""}
										onChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="scoringPolicy"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("retakes.form.scoringPolicyLabel")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="replace">
											{t("retakes.scoringPolicy.replace")}
										</SelectItem>
										<SelectItem value="best_of">
											{t("retakes.scoringPolicy.best_of")}
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-muted-foreground text-xs">
									{field.value === "replace"
										? t("retakes.scoringPolicy.replaceDescription")
										: t("retakes.scoringPolicy.best_ofDescription")}
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={submit.pending}
							onClick={() => call.end(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								t("retakes.form.submit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
