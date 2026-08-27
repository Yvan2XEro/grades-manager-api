import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

type ReportCardStatus =
	| "draft"
	| "generated"
	| "validated_admin"
	| "validated_vp"
	| "signed"
	| "published";

const STATUS_VARIANTS: Record<
	ReportCardStatus,
	"secondary" | "info" | "success" | "warning" | "default"
> = {
	draft: "secondary",
	generated: "info",
	validated_admin: "warning",
	validated_vp: "warning",
	signed: "success",
	published: "default",
};

type ReportCard = {
	id: string;
	enrollmentId: string;
	termId: string;
	status: string | null;
	language: string | null;
};

export function ReportCardsList() {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState("");
	const [termId, setTermId] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: years = [] } = trpc.academicYears.list.useQuery();

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);

	const { data, isLoading } = trpc.reportCards.list.useQuery(
		{ academicYearId: yearId, termId: termId || undefined, page, pageSize },
		{ enabled: !!yearId },
	);

	const items = (data?.items ?? []) as ReportCard[];
	const total = data?.total ?? 0;

	const columns: ColumnDef<ReportCard>[] = [
		{
			id: "enrollment",
			header: t("enrollments.col_student", "Student"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-xs">
					{row.original.enrollmentId}
				</span>
			),
		},
		{
			id: "term",
			header: t("grades.term", "Term"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.termId}</span>
			),
		},
		{
			id: "status",
			header: t("common.status", "Status"),
			cell: ({ row }) => {
				const status = row.original.status as ReportCardStatus;
				return (
					<Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
						{t(`report_cards.status_${status}`, status)}
					</Badge>
				);
			},
		},
		{
			id: "language",
			header: t("students.report_card_language", "Language"),
			cell: ({ row }) => (
				<Badge variant="outline">
					{row.original.language?.toUpperCase() ?? "FR"}
				</Badge>
			),
		},
		{
			id: "actions",
			header: t("common.actions", "Actions"),
			cell: ({ row }) => (
				<Link
					to={`/report-cards/${row.original.id}`}
					className="text-primary text-xs hover:underline"
				>
					{t("common.view", "View")}
				</Link>
			),
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
						{t("report_cards.subtitle", "Generate and view report cards")}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<label className="font-medium text-foreground text-sm">
					{t("report_cards.year_label", "Academic year")}
				</label>
				<Select
					value={yearId}
					onChange={(e) => {
						setYearId(e.target.value);
						setTermId("");
						setPage(1);
					}}
				>
					<SelectOption value="">
						— {t("enrollments.select_year", "Select an academic year")} —
					</SelectOption>
					{years.map((y) => (
						<SelectOption key={y.id} value={y.id}>
							{y.name}
						</SelectOption>
					))}
				</Select>

				{yearId && (
					<>
						<label className="font-medium text-foreground text-sm">
							{t("grades.term", "Term")}
						</label>
						<Select
							value={termId}
							onChange={(e) => {
								setTermId(e.target.value);
								setPage(1);
							}}
						>
							<SelectOption value="">
								— {t("common.no_data", "All")} —
							</SelectOption>
							{terms.map((term) => (
								<SelectOption key={term.id} value={term.id}>
									{t(
										`terms.term_${term.termNumber}`,
										`Term ${term.termNumber}`,
									)}
								</SelectOption>
							))}
						</Select>
					</>
				)}
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={
					!yearId
						? t("enrollments.select_year", "Select an academic year")
						: t("report_cards.empty", "No report cards generated")
				}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>
		</div>
	);
}
