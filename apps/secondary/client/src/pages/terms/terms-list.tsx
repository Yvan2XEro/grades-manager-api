import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { errorToast } from "@/lib/error-toast";
import { type RouterOutputs, trpc } from "@/utils/trpc";

// ─── Term create form ────────────────────────────────────────────────────────

const createSchema = z.object({
	termNumber: z.string().min(1),
	startDate: z.string().min(1),
	endDate: z.string().min(1),
});

type CreateFormValues = z.infer<typeof createSchema>;

interface CreateTermDialogProps {
	academicYearId: string;
	existingTermNumbers: number[];
}

/** Resolves with the created term, or `undefined` when dismissed. */
export const CreateTermDialog = createCallable<
	CreateTermDialogProps,
	RouterOutputs["terms"]["create"] | undefined
>(({ call, academicYearId, existingTermNumbers }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const create = trpc.terms.create.useMutation({
		onSuccess: () => utils.terms.list.invalidate(),
	});

	const {
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<CreateFormValues>({
		resolver: zodResolver(createSchema),
	});

	const submit = useMutationFlow(call, async (call, data: CreateFormValues) => {
		try {
			call.end(
				await create.mutateAsync({
					academicYearId,
					termNumber: Number.parseInt(data.termNumber, 10),
					startDate: new Date(data.startDate),
					endDate: new Date(data.endDate),
				}),
			);
		} catch (err) {
			errorToast(err, t);
		}
	});

	const availableTerms = [1, 2, 3].filter(
		(n) => !existingTermNumbers.includes(n),
	);

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="max-w-sm"
			title={t("terms.create", "Create term")}
		>
			<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
				<FormField
					label={t("terms.term_number", "Term number")}
					error={errors.termNumber?.message}
					required
				>
					<Controller
						name="termNumber"
						control={control}
						render={({ field }) => (
							<Select value={field.value ?? ""} onValueChange={field.onChange}>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
								<SelectContent>
									{availableTerms.map((n) => (
										<SelectItem key={n} value={String(n)}>
											{t(`terms.term_${n}`, `Term ${n}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				</FormField>

				<FormField
					label={t("terms.start_date", "Start date")}
					error={errors.startDate?.message}
					required
				>
					<Controller
						name="startDate"
						control={control}
						render={({ field }) => (
							<DatePicker
								value={field.value ?? ""}
								onChange={field.onChange}
								startMonth={new Date(2020, 0)}
								endMonth={new Date(2035, 11)}
							/>
						)}
					/>
				</FormField>

				<FormField
					label={t("terms.end_date", "End date")}
					error={errors.endDate?.message}
					required
				>
					<Controller
						name="endDate"
						control={control}
						render={({ field }) => (
							<DatePicker
								value={field.value ?? ""}
								onChange={field.onChange}
								startMonth={new Date(2020, 0)}
								endMonth={new Date(2035, 11)}
							/>
						)}
					/>
				</FormField>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={submit.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{t("terms.create", "Create term")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

// ─── Status badge ─────────────────────────────────────────────────────────────

function TermStatusBadge({ status }: { status: string }) {
	const { t } = useTranslation();
	if (status === "open") {
		return (
			<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
				{t("terms.open", "Open")}
			</Badge>
		);
	}
	if (status === "archived") {
		return (
			<Badge className="bg-muted text-muted-foreground">
				{t("terms.archived", "Archived")}
			</Badge>
		);
	}
	return (
		<Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
			{t("terms.closed", "Closed")}
		</Badge>
	);
}

// ─── Shared content (used by Settings tab and standalone page) ───────────────

type Term = {
	id: string;
	termNumber: number;
	startDate: Date;
	endDate: Date;
	status: string;
	academicYearId: string;
};

export function TermsContent() {
	const { t } = useTranslation();
	const [selectedYearId, setSelectedYearId] = useState<string>("");

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const utils = trpc.useUtils();

	const yearId =
		selectedYearId ||
		years.find((y) => y.status === "active")?.id ||
		years[0]?.id ||
		"";

	const { data: terms = [], isLoading } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);

	const openTerm = trpc.terms.open.useMutation({
		onSuccess: () => utils.terms.list.invalidate(),
		onError: (err) => errorToast(err, t),
	});

	const closeTerm = trpc.terms.close.useMutation({
		onSuccess: () => utils.terms.list.invalidate(),
		onError: (err) => errorToast(err, t),
	});

	const existingTermNumbers = terms.map((t) => t.termNumber);

	const formatDate = (date: Date | string) => {
		const d = new Date(date);
		return d.toLocaleDateString();
	};

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3 gap-4">
				<div className="w-56">
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("terms.select_year", "Academic year")}
					</label>
					<Combobox
						options={years.map((y) => ({ value: y.id, label: y.name }))}
						value={yearId}
						onValueChange={setSelectedYearId}
						placeholder={t("common.select", "Select…")}
						clearable={false}
					/>
				</div>
				<Button
					onClick={() =>
						CreateTermDialog.call({
							academicYearId: yearId,
							existingTermNumbers,
						})
					}
					disabled={!yearId || existingTermNumbers.length >= 3}
					size="sm"
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("terms.create", "Create term")}
				</Button>
			</div>

			{!yearId ? (
				<div className="rounded-xl border border-border bg-muted/30 p-10 text-center text-muted-foreground">
					{t("terms.select_year", "Select an academic year to view terms")}
				</div>
			) : isLoading ? (
				<div className="grid grid-cols-3 gap-4">
					{[1, 2, 3].map((n) => (
						<div
							key={n}
							className="h-40 animate-pulse rounded-xl border border-border bg-muted/20"
						/>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{[1, 2, 3].map((n) => {
						const term = terms.find((t) => t.termNumber === n) as
							| Term
							| undefined;
						return (
							<div
								key={n}
								className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
							>
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="font-semibold text-foreground">
											{t(`terms.term_${n}`, `Term ${n}`)}
										</span>
									</div>
									{term && <TermStatusBadge status={term.status} />}
								</div>

								{term ? (
									<>
										<div className="space-y-1 text-muted-foreground text-sm">
											<p>
												<span className="font-medium text-foreground">
													{t("terms.start_date", "Start")}:{" "}
												</span>
												{formatDate(term.startDate)}
											</p>
											<p>
												<span className="font-medium text-foreground">
													{t("terms.end_date", "End")}:{" "}
												</span>
												{formatDate(term.endDate)}
											</p>
										</div>
										<div className="mt-auto flex gap-2">
											{term.status !== "open" && (
												<Button
													size="sm"
													variant="outline"
													className="flex-1"
													onClick={() => openTerm.mutate({ id: term.id })}
													disabled={openTerm.isPending}
												>
													{t("terms.open", "Open")}
												</Button>
											)}
											{term.status === "open" && (
												<Button
													size="sm"
													variant="outline"
													className="flex-1"
													onClick={() => closeTerm.mutate({ id: term.id })}
													disabled={closeTerm.isPending}
												>
													{t("terms.close", "Close")}
												</Button>
											)}
										</div>
									</>
								) : (
									<div className="flex flex-1 items-center justify-center">
										<p className="text-muted-foreground text-sm">
											{t("terms.no_terms", "Not created yet")}
										</p>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
