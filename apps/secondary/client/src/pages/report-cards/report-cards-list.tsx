import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";

type ClassRow = {
	id: string;
	name: string;
	level: string | null;
	reportCardStatus: string;
};

export function ReportCardsList() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);

	const { data: classesData, isLoading } = trpc.classes.list.useQuery(
		{ academicYearId: yearId, pageSize: 200 },
		{ enabled: !!yearId },
	);
	const classes = classesData?.items ?? [];

	const rows: ClassRow[] = classes.map((c) => ({
		id: c.id,
		name: c.name,
		level: c.level ?? null,
		reportCardStatus: "draft",
	}));

	const columns: ColumnDef<ClassRow>[] = [
		{
			id: "name",
			enableSorting: false,
			header: t("enrollments.col_class", "Class"),
			cell: ({ row }) => (
				<button
					type="button"
					className="text-left font-medium text-primary hover:underline"
					onClick={() =>
						setSelectedClassId(
							selectedClassId === row.original.id ? null : row.original.id,
						)
					}
				>
					{row.original.name}
				</button>
			),
		},
		{
			id: "level",
			enableSorting: false,
			header: t("classes.col_level", "Level"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.level ?? "—"}
				</span>
			),
		},
		{
			id: "status",
			enableSorting: false,
			header: t("common.status", "Status"),
			cell: ({ row }) => {
				const status = row.original.reportCardStatus;
				return (
					<Badge variant="secondary">
						{t(`report_cards.status_${status}`, status)}
					</Badge>
				);
			},
		},
		{
			id: "term_selector",
			enableSorting: false,
			header: t("grades.term", "Term"),
			cell: ({ row }) => {
				if (selectedClassId !== row.original.id) return null;
				return (
					<select
						className="rounded border border-border bg-background px-2 py-1 text-foreground text-sm"
						defaultValue=""
						onChange={(e) => {
							const termId = e.target.value;
							if (termId) {
								navigate(`/report-cards/${row.original.id}/${termId}`);
							}
						}}
					>
						<option value="" disabled>
							{t("class_councils.all_terms", "Select term…")}
						</option>
						{terms.map((trm) => (
							<option key={trm.id} value={trm.id}>
								{t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`)}
							</option>
						))}
					</select>
				);
			},
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("report_cards.title", "Report Cards")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{rows.length > 0
							? `${rows.length} ${t("classes.title", "classes")}`
							: t("report_cards.subtitle", "Generate and view report cards")}
					</p>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={rows}
				total={rows.length}
				page={1}
				pageSize={rows.length || 25}
				isLoading={isLoading}
				emptyMessage={
					!yearId
						? t("enrollments.select_year", "No active academic year")
						: t("report_cards.empty_classes", "No classes found")
				}
				onPageChange={() => {}}
				onPageSizeChange={() => {}}
			/>
		</div>
	);
}
