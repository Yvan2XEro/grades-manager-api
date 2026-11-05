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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

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

	const schema = useMemo(
		() =>
			z.object({
				name: z.string().min(1),
				code: z.string().min(
					2,
					t("admin.teachingUnits.validation.code", {
						defaultValue: "Code is required",
					}),
				),
				credits: z.coerce
					.number()
					.int()
					.nonnegative(
						t("admin.teachingUnits.validation.credits", {
							defaultValue: "Credits must be positive",
						}),
					),
				semester: z.enum(["fall", "spring", "annual"]),
			}),
		[t],
	);
	type FormInput = z.input<typeof schema>;
	type FormData = z.output<typeof schema>;

	const form = useForm<FormInput, unknown, FormData>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", code: "", credits: 0, semester: "annual" },
	});

	const submit = useMutationFlow(call, async (call, data: FormData) => {
		try {
			const unit = await trpcClient.teachingUnits.create.mutate({
				...data,
				programId,
			});
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
	});

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
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.teachingUnits.fields.name", {
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
									<FormLabel required>
										{t("admin.teachingUnits.fields.code", {
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
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="credits"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.teachingUnits.fields.credits", {
											defaultValue: "Credits",
										})}
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
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
							name="semester"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.teachingUnits.fields.semester", {
											defaultValue: "Semester",
										})}
									</FormLabel>
									<Select value={field.value} onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="annual">
												{t("admin.teachingUnits.semesters.annual", {
													defaultValue: "Annual",
												})}
											</SelectItem>
											<SelectItem value="fall">
												{t("admin.teachingUnits.semesters.fall", {
													defaultValue: "Semester 1",
												})}
											</SelectItem>
											<SelectItem value="spring">
												{t("admin.teachingUnits.semesters.spring", {
													defaultValue: "Semester 2",
												})}
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
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
