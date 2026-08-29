import type { ColumnDef } from "@tanstack/react-table";
import { GraduationCap, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

const EXAM_TYPE_VARIANTS: Record<
	string,
	"default" | "info" | "success" | "warning"
> = {
	BEPC: "info",
	PROBATOIRE: "warning",
	BAC: "success",
};

const EXAM_TYPE_LABELS: Record<string, string> = {
	BEPC: "BEPC",
	PROBATOIRE: "Probatoire",
	BAC: "Baccalauréat",
};

type ExamSession = {
	id: string;
	examType: string;
	series?: string | null;
	sessionYear: number;
	centerCode: string | null;
	registrationDeadline?: string | Date | null;
	candidateCount?: number;
};

// ─── Main component ───────────────────────────────────────────────────────────

const EXAM_TYPES = ["BEPC", "PROBATOIRE", "BAC"] as const;

export function OfficialExamsList() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [examTypeFilter, setExamTypeFilter] = useState<string>("all");

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data, isLoading } = trpc.officialExams.listSessions.useQuery({
		academicYearId: yearId || undefined,
		examType:
			examTypeFilter !== "all"
				? (examTypeFilter as (typeof EXAM_TYPES)[number])
				: undefined,
		page,
		pageSize,
	});

	const items = (data?.items ?? []) as ExamSession[];
	const total = data?.total ?? 0;

	const formatDeadline = (d: string | Date | null | undefined) => {
		if (!d) return "—";
		return new Date(d).toLocaleDateString("fr-CM", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	const columns: ColumnDef<ExamSession>[] = [
		{
			id: "examType",
			accessorFn: (row) => row.examType,
			enableSorting: true,
			header: t("official_exams.exam_type", "Exam"),
			cell: ({ row }) => (
				<div className="flex items-center gap-1.5">
					<Badge
						variant={EXAM_TYPE_VARIANTS[row.original.examType] ?? "secondary"}
					>
						{EXAM_TYPE_LABELS[row.original.examType] ?? row.original.examType}
					</Badge>
					{row.original.series && (
						<Badge variant="outline" className="text-xs">
							{row.original.series}
						</Badge>
					)}
				</div>
			),
		},
		{
			id: "sessionYear",
			accessorFn: (row) => row.sessionYear,
			enableSorting: true,
			header: t("official_exams.session_year", "Year"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{row.original.sessionYear}
				</span>
			),
		},
		{
			id: "centerCode",
			header: t("official_exams.center_code", "Center"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.centerCode ?? "—"}
				</span>
			),
		},
		{
			id: "deadline",
			accessorFn: (row) =>
				row.registrationDeadline
					? new Date(row.registrationDeadline).getTime()
					: 0,
			enableSorting: true,
			header: t("official_exams.registration_deadline", "Deadline"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDeadline(row.original.registrationDeadline)}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<Button
					variant="outline"
					size="sm"
					onClick={() => navigate(`/official-exams/${row.original.id}`)}
				>
					{t("official_exams.manage_candidates", "Candidates")}
				</Button>
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
						{total > 0
							? `${total} ${t("official_exams.count_sessions", "sessions")}`
							: t(
									"official_exams.subtitle",
									"Candidates for official exams (BEPC, BAC, CAP…)",
								)}
					</p>
				</div>
				<Button onClick={() => navigate("/official-exams/new")}>
					<Plus className="mr-2 h-4 w-4" />
					{t("official_exams.new_session", "New session")}
				</Button>
			</div>

			{/* Filter */}
			<div className="flex items-center gap-3">
				<Select
					value={examTypeFilter}
					onValueChange={(v) => {
						setExamTypeFilter(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("official_exams.all_types", "All exams")}
						</SelectItem>
						{EXAM_TYPES.map((et) => (
							<SelectItem key={et} value={et}>
								{EXAM_TYPE_LABELS[et] ?? et}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{items.length === 0 && !isLoading && (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-border py-16 text-muted-foreground">
					<GraduationCap className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("official_exams.no_sessions", "No sessions configured")}
					</p>
					<p className="text-sm">
						{t(
							"official_exams.setup_hint",
							"Create an exam session to register candidates.",
						)}
					</p>
				</div>
			)}

			{(items.length > 0 || isLoading) && (
				<DataTable
					columns={columns}
					data={items}
					total={total}
					page={page}
					pageSize={pageSize}
					isLoading={isLoading}
					emptyMessage={t(
						"official_exams.no_sessions",
						"No sessions configured",
					)}
					onPageChange={setPage}
					onPageSizeChange={(s) => {
						setPageSize(s);
						setPage(1);
					}}
				/>
			)}
		</div>
	);
}
