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
import { QuickCreate } from "@/components/callable/quick-create";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { StudyCycleFormDialog } from "@/modules/institution/StudyCycleFormDialog";
import { type RouterOutputs, trpcClient } from "@/utils/trpc";
import {
	STUDY_CYCLES_SELECT_KEY,
	type StudyCyclesSelect,
	useStudyCycles,
} from "../hooks/use-study-cycles";

const NONE = "__NONE__";

export type ProgramFormResult = RouterOutputs["programs"]["create"];

interface Props {
	defaults?: { cycleId?: string | null };
}

/**
 * Creates a program; resolves with it, or `undefined` when dismissed. A missing
 * study cycle can be created in place from the "+" next to the select.
 */
export const ProgramFormDialog = createCallable<
	Props,
	ProgramFormResult | undefined
>(({ call, defaults }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const schema = useMemo(
		() =>
			z.object({
				name: z.string().min(2, t("admin.programs.validation.name")),
				code: z.string().min(
					2,
					t("admin.programs.validation.code", {
						defaultValue: "Code is required",
					}),
				),
				cycleId: z.string().nullable().optional(),
			}),
		[t],
	);
	type ProgramFormData = z.infer<typeof schema>;

	const { data: cycles } = useStudyCycles();

	const form = useForm<ProgramFormData>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", code: "", cycleId: defaults?.cycleId ?? null },
	});

	const createCycle = async () => {
		const cycle = await StudyCycleFormDialog.call({});
		if (!cycle) return;
		queryClient.setQueryData<StudyCyclesSelect>(
			STUDY_CYCLES_SELECT_KEY,
			(old) => upsertInList(old, cycle),
		);
		form.setValue("cycleId", cycle.id, { shouldValidate: true });
	};

	const submit = useMutationFlow(call, async (call, data: ProgramFormData) => {
		try {
			const program = await trpcClient.programs.create.mutate(data);
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("admin.programs.toast.createSuccess"));
			call.end(program);
		} catch (error) {
			toast.error(
				(error as Error).message || t("admin.programs.toast.createError"),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={t("admin.programs.form.createTitle")}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.programs.form.nameLabel")}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t("admin.programs.form.namePlaceholder")}
											{...field}
											value={field.value ?? ""}
										/>
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
									<FormLabel required>
										{t("admin.programs.form.codeLabel", {
											defaultValue: "Code",
										})}
									</FormLabel>
									<FormControl>
										<Input
											placeholder="INF-LIC"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={form.control}
						name="cycleId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.programs.form.cycleLabel", {
										defaultValue: "Cycle d'études",
									})}
								</FormLabel>
								<QuickCreate
									onCreate={createCycle}
									label={t("admin.studyCycles.actions.add", {
										defaultValue: "Add cycle",
									})}
								>
									<Select
										value={field.value ?? NONE}
										onValueChange={(v) => field.onChange(v === NONE ? null : v)}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.programs.form.cyclePlaceholder",
														{ defaultValue: "Sélectionner un cycle" },
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={NONE}>
												{t("admin.programs.form.cloneFromNone", {
													defaultValue: "Aucun",
												})}
											</SelectItem>
											{(cycles?.items ?? []).map((cyc) => (
												<SelectItem key={cyc.id} value={cyc.id}>
													{cyc.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</QuickCreate>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => call.end(undefined)}
							disabled={submit.pending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								t("admin.programs.form.submit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
