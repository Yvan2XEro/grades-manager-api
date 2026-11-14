import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

export type AcademicYearFormResult = RouterOutputs["academicYears"]["create"];

interface Props {
	year?: { id: string; name: string; startDate: string; endDate: string };
}

/**
 * Creates or edits an academic year (the name is derived from the dates);
 * resolves with the saved year, or `undefined` when dismissed.
 */
export const AcademicYearFormDialog = createCallable<
	Props,
	AcademicYearFormResult | undefined
>(({ call, year }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const schema = useMemo(
		() =>
			z
				.object({
					startDate: z
						.string()
						.min(1, t("admin.academicYears.validation.startDate")),
					endDate: z
						.string()
						.min(1, t("admin.academicYears.validation.endDate")),
					name: z.string().min(2, t("admin.academicYears.validation.name")),
				})
				.refine((data) => new Date(data.endDate) > new Date(data.startDate), {
					message: t("admin.academicYears.validation.order"),
					path: ["endDate"],
				}),
		[t],
	);
	type FormData = z.infer<typeof schema>;

	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: year
			? {
					startDate: year.startDate.slice(0, 10),
					endDate: year.endDate.slice(0, 10),
					name: year.name,
				}
			: { startDate: "", endDate: "", name: "" },
	});

	const { watch, setValue } = form;
	const startDate = watch("startDate");
	const endDate = watch("endDate");

	useEffect(() => {
		if (!startDate) return;
		if (!year || startDate !== year.startDate.slice(0, 10)) {
			const end = new Date(startDate);
			end.setFullYear(end.getFullYear() + 1);
			setValue("endDate", end.toISOString().slice(0, 10));
		}
	}, [startDate, year, setValue]);

	useEffect(() => {
		if (startDate && endDate) {
			const startYear = new Date(startDate).getFullYear();
			const endYear = new Date(endDate).getFullYear();
			setValue("name", `${startYear}-${endYear}`);
		}
	}, [startDate, endDate, setValue]);

	const submit = useMutationFlow(call, async (call, data: FormData) => {
		const payload = {
			name: data.name,
			startDate: new Date(data.startDate),
			endDate: new Date(data.endDate),
		};
		try {
			const saved = year
				? await trpcClient.academicYears.update.mutate({
						id: year.id,
						...payload,
					})
				: await trpcClient.academicYears.create.mutate(payload);
			queryClient.invalidateQueries({
				queryKey: trpc.academicYears.listPaged.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.academicYears.list.queryKey(),
			});
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
			toast.success(
				year
					? t("admin.academicYears.toast.updateSuccess")
					: t("admin.academicYears.toast.createSuccess"),
			);
			call.end(saved as AcademicYearFormResult);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: year
						? t("admin.academicYears.toast.updateError")
						: t("admin.academicYears.toast.createError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={
				year
					? t("admin.academicYears.modal.editTitle")
					: t("admin.academicYears.modal.createTitle")
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<FormField
						control={form.control}
						name="startDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.academicYears.modal.startDate")}
								</FormLabel>
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
						name="endDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admin.academicYears.modal.endDate")}</FormLabel>
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
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admin.academicYears.modal.label")}</FormLabel>
								<FormControl>
									<Input {...field} readOnly />
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
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								t("common.actions.save")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
