import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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

type EnrollmentRow = {
	enrollmentId: string;
	studentId: string;
	firstName: string;
	lastName: string;
	reportCardId: string | null;
	status: ReportCardStatus | null;
	createdAt: Date | string | null;
	overallAverage: number | null;
};

function downloadBase64Pdf(base64: string, filename: string) {
	const link = document.createElement("a");
	link.href = `data:application/pdf;base64,${base64}`;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export function ClassReportCards() {
	const { t } = useTranslation();
	const { classId, termId } = useParams<{
		classId: string;
		termId: string;
	}>();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: classData } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);
	const termData = terms.find((trm: any) => trm.id === termId);

	const utils = trpc.useUtils();

	const { data: enrollmentsData, isLoading: isLoadingEnrollments } =
		trpc.enrollments.list.useQuery(
			{
				academicYearId: activeYear?.id ?? "",
				classId: classId ?? "",
				pageSize: 200,
			},
			{ enabled: !!activeYear?.id && !!classId },
		);
	const enrollmentItems = (enrollmentsData?.items ?? []) as Array<{
		enrollment: { id: string; studentId: string };
		student: { id: string; firstName: string; lastName: string };
	}>;

	const { data: reportCardsData } = trpc.reportCards.list.useQuery(
		{
			academicYearId: activeYear?.id ?? "",
			classId: classId ?? undefined,
			termId: termId ?? undefined,
			page: 1,
			pageSize: 200,
		},
		{ enabled: !!activeYear?.id && !!classId && !!termId },
	);
	const reportCardItems = (reportCardsData?.items ?? []) as Array<{
		id: string;
		enrollmentId: string;
		termId: string;
		status: string | null;
		createdAt?: Date | string | null;
		snapshotData?: { overallAverage?: number | null } | null;
	}>;
	const cardByEnrollment = new Map(
		reportCardItems.map((rc) => [rc.enrollmentId, rc]),
	);

	const rows: EnrollmentRow[] = enrollmentItems.map((e) => {
		const rc = cardByEnrollment.get(e.enrollment.id);
		return {
			enrollmentId: e.enrollment.id,
			studentId: e.student.id,
			firstName: e.student.firstName,
			lastName: e.student.lastName,
			reportCardId: rc?.id ?? null,
			status: (rc?.status ?? null) as ReportCardStatus | null,
			createdAt: rc?.createdAt ?? null,
			overallAverage: rc?.snapshotData?.overallAverage ?? null,
		};
	});

	const generate = trpc.reportCards.generate.useMutation({
		onSuccess: () => {
			utils.reportCards.list.invalidate();
		},
	});

	const batchGenerate = trpc.reportCards.batchGenerate.useMutation({
		onSuccess: () => utils.reportCards.list.invalidate(),
	});

	const batchPdf = trpc.reportCards.batchPdf.useMutation({
		onSuccess: (result) => {
			downloadBase64Pdf(result.pdfBase64, result.filename);
		},
	});

	const downloadPdf = trpc.reportCards.generatePdf.useMutation({
		onSuccess: (result) => {
			downloadBase64Pdf(result.pdfBase64, result.filename);
		},
	});

	const handleGenerateAll = () => {
		if (!classId || !termId || !activeYear?.id) return;
		batchGenerate.mutate({ classId, termId, academicYearId: activeYear.id });
	};

	const handleDownloadAllPdfs = () => {
		if (!classId || !termId || !activeYear?.id) return;
		batchPdf.mutate({ classId, termId, academicYearId: activeYear.id });
	};

	const columns: ColumnDef<EnrollmentRow>[] = [
		{
			id: "student",
			enableSorting: false,
			header: t("enrollments.col_student", "Student"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground text-sm">
					{row.original.firstName} {row.original.lastName}
				</span>
			),
		},
		{
			id: "status",
			enableSorting: false,
			header: t("common.status", "Status"),
			cell: ({ row }) => {
				const status = row.original.status ?? "draft";
				return (
					<Badge
						variant={STATUS_VARIANTS[status as ReportCardStatus] ?? "secondary"}
					>
						{t(`report_cards.status_${status}`, status)}
					</Badge>
				);
			},
		},
		{
			id: "average",
			enableSorting: false,
			header: t("grades.col_avg", "Average /20"),
			cell: ({ row }) => {
				const avg = row.original.overallAverage;
				return (
					<span className="font-semibold text-sm tabular-nums">
						{avg != null ? avg.toFixed(2) : "—"}
					</span>
				);
			},
		},
		{
			id: "generated_at",
			enableSorting: false,
			header: t("report_cards.col_generated_at", "Generated at"),
			cell: ({ row }) => {
				const createdAt = row.original.createdAt;
				return (
					<span className="text-muted-foreground text-sm">
						{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
					</span>
				);
			},
		},
		{
			id: "actions",
			enableSorting: false,
			header: t("common.actions", "Actions"),
			cell: ({ row }) => {
				const { reportCardId, status, studentId } = row.original;
				return (
					<div className="flex items-center gap-2">
						{reportCardId ? (
							<Link
								to={`/report-cards/${reportCardId}`}
								className="text-primary text-xs hover:underline"
							>
								{t("common.view", "View")}
							</Link>
						) : (
							<span className="text-muted-foreground text-xs">—</span>
						)}
						{termId && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2 text-xs"
								disabled={generate.isPending}
								onClick={() => generate.mutate({ studentId, termId })}
							>
								<RefreshCw className="mr-1 h-3 w-3" />
								{!status || status === "draft"
									? t("report_cards.generate", "Generate")
									: t("report_cards.regenerate", "Regenerate")}
							</Button>
						)}
						{reportCardId && status && status !== "draft" && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2 text-xs"
								disabled={downloadPdf.isPending}
								onClick={() => downloadPdf.mutate({ id: reportCardId })}
							>
								<Download className="mr-1 h-3 w-3" />
								PDF
							</Button>
						)}
					</div>
				);
			},
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("report_cards.class_title", "Report Cards")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{[
							classData?.name,
							termData
								? t(
										`terms.term_${termData.termNumber}`,
										`Term ${termData.termNumber}`,
									)
								: null,
						]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={handleDownloadAllPdfs}
						disabled={batchPdf.isPending || !termId || rows.length === 0}
					>
						<FileDown className="mr-2 h-4 w-4" />
						{batchPdf.isPending
							? t("report_cards.generating_pdf", "Generating…")
							: t("report_cards.download_all_pdfs", "Download all PDFs")}
					</Button>
					<Button
						onClick={handleGenerateAll}
						disabled={batchGenerate.isPending || !termId}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						{batchGenerate.isPending
							? t("report_cards.generating", "Generating…")
							: t("report_cards.generate_all", "Generate all")}
					</Button>
				</div>
			</div>

			{batchGenerate.data && (
				<div className="rounded-md bg-muted px-4 py-2 text-sm">
					{t("report_cards.batch_result", {
						generated: batchGenerate.data.generated,
						errors: batchGenerate.data.errors,
						defaultValue: "Generated: {{generated}}, Errors: {{errors}}",
					})}
				</div>
			)}

			<DataTable
				columns={columns}
				data={rows}
				total={rows.length}
				page={page}
				pageSize={pageSize}
				isLoading={isLoadingEnrollments}
				emptyMessage={
					!activeYear?.id
						? t("enrollments.select_year", "Select an academic year")
						: t(
								"report_cards.empty_enrollments",
								"No students enrolled in this class",
							)
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
