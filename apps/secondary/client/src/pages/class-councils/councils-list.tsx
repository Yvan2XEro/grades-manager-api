import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, PillCombobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

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

interface CreateCouncilDialogProps {
	yearId: string;
	classItems: { id: string; name: string }[];
	onCreated: () => void;
}

function CreateCouncilDialog({
	yearId,
	classItems,
	onCreated,
}: CreateCouncilDialogProps) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	const {
		control,
		register,
		handleSubmit,
		watch,
		reset,
		formState: { isSubmitting, errors },
	} = useForm<CreateFormValues>({
		resolver: zodResolver(createSchema),
		defaultValues: { status: "draft" },
	});

	const _selectedClassId = watch("classId");

	const { data: termsData } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);
	const termItems = termsData ?? [];

	const createCouncil = trpc.classCouncils.create.useMutation();

	const onSubmit = handleSubmit(async (values) => {
		await createCouncil.mutateAsync({
			classId: values.classId,
			termId: values.termId,
			status: values.status,
			scheduledAt: values.scheduledAt
				? new Date(values.scheduledAt).toISOString()
				: undefined,
		});
		reset();
		setOpen(false);
		onCreated();
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus />
					{t("class_councils.new_council", "New Council")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("class_councils.create_title", "Create class council")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					{/* Class */}
					<div className="space-y-1.5">
						<Label htmlFor="create-class">
							{t("class_councils.col_class", "Class")}
						</Label>
						<Controller
							name="classId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={classItems.map((c) => ({
										value: c.id,
										label: c.name,
									}))}
									value={field.value ?? ""}
									onValueChange={field.onChange}
									placeholder={t("grades.select_class", "Select class…")}
								/>
							)}
						/>
						{errors.classId && (
							<p className="text-destructive text-xs">
								{errors.classId.message}
							</p>
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
								<Combobox
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
									disabled={termItems.length === 0}
								/>
							)}
						/>
						{errors.termId && (
							<p className="text-destructive text-xs">
								{errors.termId.message}
							</p>
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
							onClick={() => {
								reset();
								setOpen(false);
							}}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? t("common.creating", "Creating…")
								: t("common.create", "Create")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClassCouncilsList() {
	const { t } = useTranslation();
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
		{ academicYearId: yearId, page: 1, pageSize: 200 },
		{ enabled: !!yearId },
	);
	const classItems = classesData?.items ?? [];

	const { data: termsData } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);
	const termItems = termsData ?? [];

	const utils = trpc.useUtils();

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
				<span className="font-medium text-foreground text-sm">
					{classMap.get(row.original.classId) ?? row.original.classId}
				</span>
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
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("class_councils.title", "Class Councils")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("class_councils.subtitle", "Class council meetings by term")}
					</p>
				</div>
				{yearId && (
					<CreateCouncilDialog
						yearId={yearId}
						classItems={classItems}
						onCreated={() => utils.classCouncils.list.invalidate()}
					/>
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
