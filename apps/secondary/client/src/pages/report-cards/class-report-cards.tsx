import type { ColumnDef } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
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

export function ClassReportCards() {
	const { t } = useTranslation();
	const { classId, termId } = useParams<{
		classId: string;
		termId: string;
	}>();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];

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
		onSuccess: () => {
			utils.reportCards.list.invalidate();
		},
	});

	// Fetch enrollments to get student IDs for "Generate all"
	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{
			academicYearId: activeYear?.id ?? "",
			classId: classId ?? "",
			pageSize: 200,
		},
		{ enabled: !!activeYear?.id && !!classId },
	);
	const enrollments = enrollmentsData?.items ?? [];

	const handleGenerateAll = () => {
		if (!termId) return;
		for (const e of enrollments as any[]) {
			const studentId = e.student?.id ?? e.studentId;
			if (studentId) {
				generate.mutate({ studentId, termId });
			}
		}
	};

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
			id: "generated_at",
			header: t("report_cards.col_generated_at", "Generated at"),
			cell: ({ row }) => {
				const createdAt = (row.original as any).createdAt;
				return (
					<span className="text-muted-foreground text-sm">
						{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: t("common.actions", "Actions"),
			cell: ({ row }) => {
				const card = row.original;
				const enrollmentSnap = card.snapshotData as any;
				const studentId = enrollmentSnap?.studentId;
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
						{[classData?.name, (termData as any)?.name]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
				<Button
					onClick={handleGenerateAll}
					disabled={generate.isPending || !termId}
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					{t("report_cards.generate_all", "Generate all")}
				</Button>
			</div>

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
