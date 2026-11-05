import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PillCombobox } from "@/components/ui/combobox";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { errorToast } from "@/lib/error-toast";
import { upsertInList } from "@/lib/query-cache";
import { ClassFormDialog } from "@/pages/classes/class-form-dialog";
import { CreateTermDialog } from "@/pages/terms/terms-list";
import { type RouterOutputs, trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type CouncilStatus = "draft" | "scheduled" | "held" | "signed";

type Council = {
	id: string;
	classId: string;
	termId: string;
	status: string | null;
	scheduledAt: Date | string | null;
	presidentId?: string | null;
	secretaryId?: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<
	CouncilStatus,
	"secondary" | "info" | "success" | "default"
> = {
	draft: "secondary",
	scheduled: "info",
	held: "success",
	signed: "default",
};

const STATUS_LABELS: Record<CouncilStatus, string> = {
	draft: "Draft",
	scheduled: "Scheduled",
	held: "Held",
	signed: "Signed",
};

// ─── Create council form ──────────────────────────────────────────────────────

const createSchema = z.object({
	classId: z.string().min(1, "Class is required"),
	termId: z.string().min(1, "Term is required"),
	status: z.enum(["draft", "scheduled"]),
	scheduledAt: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

/** Classes of the year, shared with the page's class filter cache entry. */
const classesInput = (yearId: string) => ({
	academicYearId: yearId,
	page: 1,
	pageSize: 200,
});

/**
 * Resolves with the created council, or `undefined` when dismissed. A missing
 * class or term of the year can be created in place from the "+" buttons.
 */
export const CreateCouncilDialog = createCallable<
	{ yearId: string },
	RouterOutputs["classCouncils"]["create"] | undefined
>(({ call, yearId }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateFormValues>({
		resolver: zodResolver(createSchema),
		defaultValues: { status: "draft" },
	});

	const { data: classesData } = trpc.classes.list.useQuery(
		classesInput(yearId),
	);
	const classItems = classesData?.items ?? [];

	const termsInput = { academicYearId: yearId };
	const { data: termsData } = trpc.terms.list.useQuery(termsInput);
	const termItems = termsData ?? [];

	const createCouncil = trpc.classCouncils.create.useMutation({
		onSuccess: () => utils.classCouncils.list.invalidate(),
	});

	const createClass = async () => {
		const created = await ClassFormDialog.call({
			defaults: { academicYearId: yearId },
			lockAcademicYear: true,
		});
		if (!created) return;
		utils.classes.list.setData(classesInput(yearId), (old) =>
			upsertInList(old, { ...created, studentCount: 0 }),
		);
		return { value: created.id, label: created.name };
	};

	const createTerm = async () => {
		const term = await CreateTermDialog.call({
			academicYearId: yearId,
			existingTermNumbers: termItems.map((trm) => trm.termNumber),
		});
		if (!term) return;
		utils.terms.list.setData(termsInput, (old) => upsertInList(old, term));
		return {
			value: term.id,
			label: t(`terms.term_${term.termNumber}`, `Term ${term.termNumber}`),
		};
	};

	const submit = useMutationFlow(
		call,
		async (call, values: CreateFormValues) => {
			try {
				call.end(
					await createCouncil.mutateAsync({
						classId: values.classId,
						termId: values.termId,
						status: values.status,
						scheduledAt: values.scheduledAt
							? new Date(values.scheduledAt).toISOString()
							: undefined,
					}),
				);
			} catch (err) {
				errorToast(err, t);
			}
		},
	);

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={t("class_councils.create_title", "Create class council")}
		>
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				{/* Class */}
				<div className="space-y-1.5">
					<Label htmlFor="create-class">
						{t("class_councils.col_class", "Class")}
					</Label>
					<Controller
						name="classId"
						control={control}
						render={({ field }) => (
							<CreatableCombobox
								id="create-class"
								options={classItems.map((c) => ({
									value: c.id,
									label: c.name,
								}))}
								value={field.value ?? ""}
								onValueChange={field.onChange}
								placeholder={t("grades.select_class", "Select class…")}
								onCreate={createClass}
								createLabel={t("classes.add", "Add class")}
							/>
						)}
					/>
					{errors.classId && (
						<p className="text-destructive text-xs">{errors.classId.message}</p>
					)}
				</div>

				{/* Term */}
				<div className="space-y-1.5">
					<Label htmlFor="create-term">
						{t("class_councils.col_term", "Term")}
					</Label>
					<Controller
						name="termId"
						control={control}
						render={({ field }) => (
							<CreatableCombobox
								id="create-term"
								options={termItems.map((trm) => ({
									value: trm.id,
									label: t(
										`terms.term_${trm.termNumber}`,
										`Term ${trm.termNumber}`,
									),
								}))}
								value={field.value ?? ""}
								onValueChange={field.onChange}
								placeholder={t("class_councils.select_term", "Select term…")}
								onCreate={termItems.length < 3 ? createTerm : undefined}
								createLabel={t("terms.create", "Create term")}
							/>
						)}
					/>
					{errors.termId && (
						<p className="text-destructive text-xs">{errors.termId.message}</p>
					)}
				</div>

				{/* Status */}
				<div className="space-y-1.5">
					<Label htmlFor="create-status">
						{t("class_councils.col_status", "Status")}
					</Label>
					<Controller
						name="status"
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">
										{t("councils.draft", "Draft")}
									</SelectItem>
									<SelectItem value="scheduled">
										{t("councils.scheduled", "Scheduled")}
									</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				{/* Scheduled date */}
				<div className="space-y-1.5">
					<Label htmlFor="create-date">
						{t("class_councils.col_date", "Scheduled date")}
					</Label>
					<Input
						id="create-date"
						type="datetime-local"
						{...register("scheduledAt")}
					/>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						disabled={submit.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{submit.pending
							? t("common.creating", "Creating…")
							: t("common.create", "Create")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

// ─── Main component ───────────────────────────────────────────────────────────

export function ClassCouncilsList() {
	const { t } = useTranslation();
	useBreadcrumbs([
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
		{ label: t("nav.class_councils", "Class Councils") },
	]);
	const navigate = useNavigate();

	const [filterClassId, setFilterClassId] = useState("");
	const [filterTermId, setFilterTermId] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	// ── Data ─────────────────────────────────────────────────────────────────

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: classesData } = trpc.classes.list.useQuery(
		classesInput(yearId),
		{ enabled: !!yearId },
	);
	const classItems = classesData?.items ?? [];

	const { data: termsData } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);
	const termItems = termsData ?? [];

	const { data, isLoading } = trpc.classCouncils.list.useQuery({
		classId: filterClassId || undefined,
		termId: filterTermId || undefined,
		page,
		pageSize,
	});

	const items = (data?.items ?? []) as Council[];
	const total = data?.total ?? 0;

	// ── Lookups ───────────────────────────────────────────────────────────────

	const classMap = new Map(classItems.map((c) => [c.id, c.name]));
	const termMap = new Map(
		termItems.map((trm) => [
			trm.id,
			t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`),
		]),
	);

	const formatDate = (dateStr: Date | string | null | undefined) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleString();
	};

	// ── Columns ───────────────────────────────────────────────────────────────

	const columns: ColumnDef<Council>[] = [
		{
			id: "class",
			accessorFn: (row) => classMap.get(row.classId) ?? row.classId,
			enableSorting: true,
			header: t("class_councils.col_class", "Class"),
			cell: ({ row }) => (
				<Link
					to={`/class-councils/${row.original.id}`}
					className="font-medium text-primary text-sm hover:underline"
				>
					{classMap.get(row.original.classId) ?? row.original.classId}
				</Link>
			),
		},
		{
			id: "term",
			accessorFn: (row) => termMap.get(row.termId) ?? row.termId,
			enableSorting: true,
			header: t("class_councils.col_term", "Term"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{termMap.get(row.original.termId) ?? row.original.termId}
				</span>
			),
		},
		{
			id: "date",
			accessorFn: (row) =>
				row.scheduledAt ? new Date(row.scheduledAt).getTime() : 0,
			enableSorting: true,
			header: t("class_councils.col_date", "Date"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.scheduledAt)}
				</span>
			),
		},
		{
			id: "status",
			accessorFn: (row) => row.status ?? "",
			enableSorting: true,
			header: t("class_councils.col_status", "Status"),
			cell: ({ row }) => {
				const status = row.original.status as CouncilStatus;
				return (
					<Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
						{t(`councils.${status}`, STATUS_LABELS[status] ?? status)}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<Button
					variant="outline"
					size="sm"
					onClick={() => navigate(`/class-councils/${row.original.id}`)}
				>
					{t("common.view", "View")}
				</Button>
			),
		},
	];

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("class_councils.title", "Class Councils")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("class_councils.subtitle", "Class council meetings by term")}
					</p>
				</div>
				{yearId && (
					<Button
						data-tour="class-councils-create"
						onClick={() => CreateCouncilDialog.call({ yearId })}
					>
						<Plus />
						{t("class_councils.new_council", "New Council")}
					</Button>
				)}
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<PillCombobox
					options={classItems.map((c) => ({ value: c.id, label: c.name }))}
					value={filterClassId}
					onValueChange={(val) => {
						setFilterClassId(val);
						setPage(1);
					}}
					placeholder={t("grades.select_class", "Class…")}
					disabled={!yearId || classItems.length === 0}
				/>
				<PillCombobox
					options={termItems.map((trm) => ({
						value: trm.id,
						label: t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`),
					}))}
					value={filterTermId}
					onValueChange={(val) => {
						setFilterTermId(val);
						setPage(1);
					}}
					placeholder={t("class_councils.all_terms", "Term…")}
					disabled={!yearId || termItems.length === 0}
				/>
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={t("class_councils.empty", "No councils scheduled")}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>
		</div>
	);
}
