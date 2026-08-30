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

type ReportCard = {
	id: string;
	enrollmentId: string;
	termId: string;
	status: string | null;
	language: string | null;
	snapshotData: unknown;
	createdAt?: Date | string | null;
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
	const { data, isLoading } = trpc.reportCards.list.useQuery(
		{
			academicYearId: activeYear?.id ?? "",
			classId: classId ?? undefined,
			termId: termId ?? undefined,
			page,
			pageSize,
		},
		{ enabled: !!activeYear?.id && !!classId && !!termId },
	);

	const items = (data?.items ?? []) as ReportCard[];
	const total = data?.total ?? 0;

	const generate = trpc.reportCards.generate.useMutation({
		onSuccess: () => utils.reportCards.list.invalidate(),
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

	const enrollmentToStudent = new Map<
		string,
		{ studentId: string; firstName: string; lastName: string }
	>();
	for (const _item of items) {
		// populated via separate enrollments query below
	}

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{
			academicYearId: activeYear?.id ?? "",
			classId: classId ?? "",
			pageSize: 200,
		},
		{ enabled: !!activeYear?.id && !!classId },
	);
	const enrollments = (enrollmentsData?.items ?? []) as Array<{
		enrollment: { id: string; studentId: string };
		student: { id: string; firstName: string; lastName: string };
	}>;
	for (const e of enrollments) {
		enrollmentToStudent.set(e.enrollment.id, {
			studentId: e.student.id,
			firstName: e.student.firstName,
			lastName: e.student.lastName,
		});
	}

	const handleGenerateAll = () => {
		if (!classId || !termId || !activeYear?.id) return;
		batchGenerate.mutate({ classId, termId, academicYearId: activeYear.id });
	};

	const handleDownloadAllPdfs = () => {
		if (!classId || !termId || !activeYear?.id) return;
		batchPdf.mutate({ classId, termId, academicYearId: activeYear.id });
	};

	const columns: ColumnDef<ReportCard>[] = [
		{
			id: "enrollment",
			enableSorting: false,
			header: t("enrollments.col_student", "Student"),
			cell: ({ row }) => {
				const info = enrollmentToStudent.get(row.original.enrollmentId);
				return (
					<span className="font-medium text-foreground text-sm">
						{info ? (
							`${info.lastName} ${info.firstName}`
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
			id: "status",
			enableSorting: false,
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
				const card = row.original;
				const info = enrollmentToStudent.get(card.enrollmentId);
				const studentId = info?.studentId;
				return (
					<div className="flex items-center gap-2">
						<Link
							to={`/report-cards/${card.id}`}
							className="text-primary text-xs hover:underline"
						>
							{t("common.view", "View")}
						</Link>
						{studentId && termId && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2 text-xs"
								disabled={generate.isPending}
								onClick={() => generate.mutate({ studentId, termId })}
							>
								<RefreshCw className="mr-1 h-3 w-3" />
								{card.status === "draft"
									? t("report_cards.generate", "Generate")
									: t("report_cards.regenerate", "Regenerate")}
							</Button>
						)}
						{card.status !== "draft" && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2 text-xs"
								disabled={downloadPdf.isPending}
								onClick={() => downloadPdf.mutate({ id: card.id })}
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
						disabled={batchPdf.isPending || !termId || items.length === 0}
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
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={
					!activeYear?.id
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
