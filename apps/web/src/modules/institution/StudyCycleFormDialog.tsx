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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

const cycleSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	nameEn: z.string().optional(),
	description: z.string().optional(),
	totalCreditsRequired: z.coerce.number().int().min(30),
	durationYears: z.coerce.number().int().min(1),
});

type CycleFormInput = z.input<typeof cycleSchema>;
type CycleForm = z.output<typeof cycleSchema>;

export type StudyCycleFormResult = RouterOutputs["studyCycles"]["createCycle"];

interface Props {
	cycle?: {
		id: string;
		code: string;
		name: string;
		nameEn: string | null;
		description: string | null;
		totalCreditsRequired: number;
		durationYears: number;
	};
}

/** Creates or edits a study cycle; resolves with the saved cycle, or `undefined`. */
export const StudyCycleFormDialog = createCallable<
	Props,
	StudyCycleFormResult | undefined
>(({ call, cycle }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const form = useForm<CycleFormInput, unknown, CycleForm>({
		resolver: zodResolver(cycleSchema),
		defaultValues: cycle
			? {
					code: cycle.code,
					name: cycle.name,
					nameEn: cycle.nameEn ?? "",
					description: cycle.description ?? "",
					totalCreditsRequired: cycle.totalCreditsRequired,
					durationYears: cycle.durationYears,
				}
			: {
					code: "",
					name: "",
					nameEn: "",
					description: "",
					totalCreditsRequired: 180,
					durationYears: 3,
				},
	});

	const watchedCode = form.watch("code");
	const watchedDuration = form.watch("durationYears");
	const watchedCredits = form.watch("totalCreditsRequired");
	const autoLevelsPreview = useMemo(() => {
		const duration = Number(watchedDuration);
		const credits = Number(watchedCredits);
		if (!duration || duration < 1 || duration > 20) return [];
		return Array.from({ length: duration }, (_, i) => ({
			code: watchedCode ? `${watchedCode}-L${i + 1}` : `L${i + 1}`,
			name: `Level ${i + 1}`,
			minCredits: credits ? Math.floor(credits / duration) : 0,
		}));
	}, [watchedCode, watchedDuration, watchedCredits]);

	const submit = useMutationFlow(call, async (call, data: CycleForm) => {
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
	});

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
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.studyCycles.form.name", {
											defaultValue: "Name",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Licence" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="nameEn"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.studyCycles.form.nameEn", {
											defaultValue: "Name (English)",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Bachelor of Science" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.studyCycles.form.code", {
											defaultValue: "Code",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="BSC" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.studyCycles.form.description", {
										defaultValue: "Description",
									})}
								</FormLabel>
								<FormControl>
									<Textarea {...field} rows={3} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="totalCreditsRequired"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.studyCycles.form.credits", {
											defaultValue: "Credits",
										})}
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={30}
											{...field}
											value={field.value as number}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="durationYears"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.studyCycles.form.duration", {
											defaultValue: "Years",
										})}
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={1}
											{...field}
											value={field.value as number}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
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
