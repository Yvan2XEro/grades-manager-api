import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

type CouncilStatus = "draft" | "scheduled" | "held" | "signed";

const STATUS_VARIANTS: Record<
	CouncilStatus,
	"secondary" | "info" | "success" | "default"
> = {
	draft: "secondary",
	scheduled: "info",
	held: "success",
	signed: "default",
};

type Council = {
	id: string;
	classId: string;
	termId: string;
	status: string | null;
	scheduledAt: Date | string | null;
};

export function ClassCouncilsList() {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState("");
	const [classId, setClassId] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: years = [] } = trpc.academicYears.list.useQuery();

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId: yearId, page: 1, pageSize: 200 },
		{ enabled: !!yearId },
	);
	const classItems = classesData?.items ?? [];

	const { data, isLoading } = trpc.classCouncils.list.useQuery(
		{ classId: classId || undefined, page, pageSize },
		{ enabled: !!classId },
	);

	const items = (data?.items ?? []) as Council[];
	const total = data?.total ?? 0;

	const formatDate = (dateStr: Date | string | null | undefined) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString();
	};

	const columns: ColumnDef<Council>[] = [
		{
			id: "class",
			header: t("class_councils.col_class", "Class"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-xs">
					{row.original.classId}
				</span>
			),
		},
		{
			id: "term",
			header: t("class_councils.col_term", "Term"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.termId}</span>
			),
		},
		{
			id: "date",
			header: t("class_councils.col_date", "Date"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatDate(row.original.scheduledAt)}
				</span>
			),
		},
		{
			id: "status",
			header: t("class_councils.col_status", "Status"),
			cell: ({ row }) => {
				const status = row.original.status as CouncilStatus;
				return (
					<Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
						{t(`councils.${status}`, status)}
					</Badge>
				);
			},
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("class_councils.title", "Class councils")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("class_councils.subtitle", "Class council meetings by term")}
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
						setClassId("");
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
							{t("class_councils.col_class", "Class")}
						</label>
						<Select
							value={classId}
							onChange={(e) => {
								setClassId(e.target.value);
								setPage(1);
							}}
						>
							<SelectOption value="">
								— {t("grades.select_class", "Select —")} —
							</SelectOption>
							{classItems.map((cls) => (
								<SelectOption key={cls.id} value={cls.id}>
									{cls.name}
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
					!yearId || !classId
						? t("enrollments.select_year", "Select an academic year")
						: t("class_councils.empty", "No councils scheduled")
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
