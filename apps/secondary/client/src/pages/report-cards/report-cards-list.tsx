import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";

type EnrollmentItem = {
	enrollment: { id: string; studentId: string };
	student: { id: string; firstName: string; lastName: string };
};

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
	const [termId, setTermId] = useState("");
	const [classIdFilter, setClassIdFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId: yearId, pageSize: 200 },
		{ enabled: !!yearId },
	);
	const classes = classesData?.items ?? [];

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{ academicYearId: yearId, pageSize: 500 },
		{ enabled: !!yearId },
	);
	const enrollmentItems = (enrollmentsData?.items ?? []) as EnrollmentItem[];
	const enrollmentToStudent = new Map(
		enrollmentItems.map((e) => [e.enrollment.id, e.student]),
	);
	const termToLabel = new Map(
		terms.map((trm) => [
			trm.id,
			t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`),
		]),
	);

	const { data, isLoading } = trpc.reportCards.list.useQuery(
		{
			academicYearId: yearId,
			termId: termId || undefined,
			classId: classIdFilter !== "all" ? classIdFilter : undefined,
			page,
			pageSize,
		},
		{ enabled: !!yearId },
	);

	const items = (data?.items ?? []) as ReportCard[];
	const total = data?.total ?? 0;

	const columns: ColumnDef<ReportCard>[] = [
		{
			id: "enrollment",
			enableSorting: false,
			header: t("enrollments.col_student", "Student"),
			cell: ({ row }) => {
				const student = enrollmentToStudent.get(row.original.enrollmentId);
				return (
					<span className="font-medium text-foreground text-sm">
						{student ? (
							`${student.lastName} ${student.firstName}`
						) : (
							<span className="font-mono text-muted-foreground text-xs">
								{row.original.enrollmentId.slice(0, 8)}…
							</span>
						)}
					</span>
				);
			},
		},
		{
			id: "term",
			enableSorting: false,
			header: t("grades.term", "Term"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{termToLabel.get(row.original.termId) ??
						`…${row.original.termId.slice(-4)}`}
				</span>
			),
		},
		{
			id: "status",
			enableSorting: false,
			header: t("common.status", "Status"),
			cell: ({ row }) => {
				const status = (row.original.status ?? "draft") as ReportCardStatus;
				return (
					<Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
						{t(`report_cards.status_${status}`, status)}
					</Badge>
				);
			},
		},
		{
			id: "language",
			enableSorting: false,
			header: t("students.report_card_language", "Language"),
			cell: ({ row }) => (
				<Badge variant="outline">
					{row.original.language?.toUpperCase() ?? "FR"}
				</Badge>
			),
		},
		{
			id: "actions",
			enableSorting: false,
			header: "",
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
						{total > 0
							? `${total} ${t("report_cards.count_cards", "report cards")}`
							: t("report_cards.subtitle", "Generate and view report cards")}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-44">
					<Combobox
						options={terms.map((term) => ({
							value: term.id,
							label: t(
								`terms.term_${term.termNumber}`,
								`Term ${term.termNumber}`,
							),
						}))}
						value={termId}
						onValueChange={(val) => {
							setTermId(val);
							setPage(1);
						}}
						placeholder={t("class_councils.all_terms", "All terms")}
						disabled={terms.length === 0}
					/>
				</div>
				{classes.length > 0 && (
					<div className="w-48">
						<Combobox
							options={[
								{
									value: "all",
									label: t("enrollments.all_classes", "All classes"),
								},
								...classes.map((c) => ({ value: c.id, label: c.name })),
							]}
							value={classIdFilter}
							onValueChange={(val) => {
								setClassIdFilter(val || "all");
								setPage(1);
							}}
							placeholder={t("enrollments.col_class", "Class")}
						/>
					</div>
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
						? t("enrollments.select_year", "No active academic year")
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
