import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

const EXAM_TYPE_VARIANTS: Record<
	string,
	"default" | "info" | "success" | "warning"
> = {
	BEPC: "info",
	PROBATOIRE: "warning",
	BAC: "success",
};

type ExamSession = {
	id: string;
	examType: string;
	sessionYear: number;
	centerCode: string | null;
};

export function OfficialExamsList() {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: years = [] } = trpc.academicYears.list.useQuery();

	const { data, isLoading } = trpc.officialExams.listSessions.useQuery({
		academicYearId: yearId || undefined,
		page,
		pageSize,
	});

	const items = (data?.items ?? []) as ExamSession[];
	const total = data?.total ?? 0;

	const columns: ColumnDef<ExamSession>[] = [
		{
			id: "examType",
			header: t("common.name", "Exam"),
			cell: ({ row }) => (
				<Badge
					variant={EXAM_TYPE_VARIANTS[row.original.examType] ?? "secondary"}
				>
					{row.original.examType}
				</Badge>
			),
		},
		{
			accessorKey: "sessionYear",
			header: t("common.date", "Year"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.sessionYear}
				</span>
			),
		},
		{
			accessorKey: "centerCode",
			header: t("official_exams.candidates", "Center"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.centerCode ?? "—"}
				</span>
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("official_exams.title", "Official exams")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"official_exams.subtitle",
							"Candidates for official exams (BEPC, BAC, CAP…)",
						)}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<label className="font-medium text-foreground text-sm">
					{t("report_cards.year_label", "Academic year")}
				</label>
				<Select
					value={yearId}
					onChange={(e) => {
						setYearId(e.target.value);
						setPage(1);
					}}
				>
					<SelectOption value="">
						— {t("common.no_data", "All years")} —
					</SelectOption>
					{years.map((y) => (
						<SelectOption key={y.id} value={y.id}>
							{y.name}
						</SelectOption>
					))}
				</Select>
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={t("official_exams.no_sessions", "No sessions configured")}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>
		</div>
	);
}
