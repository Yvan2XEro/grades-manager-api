import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

type EnrollmentRow = {
	enrollment: {
		id: string;
		classId: string;
		admissionType: string | null;
		status: string | null;
	};
	student: {
		id: string;
		firstName: string;
		lastName: string;
	};
};

function StatusBadge({ status }: { status: string | null }) {
	const base =
		"inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs";
	if (status === "active")
		return (
			<span
				className={`${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}
			>
				{status}
			</span>
		);
	if (status === "withdrawn")
		return (
			<span
				className={`${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}
			>
				{status}
			</span>
		);
	return (
		<span className={`${base} bg-muted text-muted-foreground`}>
			{status ?? "—"}
		</span>
	);
}

export function Enrollments() {
	const { t } = useTranslation();
	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const [selectedYearId, setSelectedYearId] = useState<string>("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];
	const yearId = selectedYearId || activeYear?.id || "";

	const { data, isLoading } = trpc.enrollments.list.useQuery(
		{ academicYearId: yearId, page, pageSize },
		{ enabled: !!yearId },
	);

	const items = (data?.items ?? []) as EnrollmentRow[];
	const total = data?.total ?? 0;

	const columns: ColumnDef<EnrollmentRow>[] = [
		{
			id: "student",
			header: t("enrollments.col_student", "Student"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{row.original.student.lastName} {row.original.student.firstName}
				</span>
			),
		},
		{
			id: "class",
			header: t("enrollments.col_class", "Class"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.enrollment.classId}
				</span>
			),
		},
		{
			id: "admissionType",
			header: t("enrollments.col_type", "Admission type"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.enrollment.admissionType ?? "—"}
				</span>
			),
		},
		{
			id: "status",
			header: t("enrollments.col_status", "Status"),
			cell: ({ row }) => (
				<StatusBadge status={row.original.enrollment.status} />
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("enrollments.title", "Enrollments")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("enrollments.subtitle", "Student enrollments by academic year")}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<label className="font-medium text-foreground text-sm">
					{t("enrollments.year_label", "Academic year")}
				</label>
				<Select
					value={yearId}
					onChange={(e) => {
						setSelectedYearId(e.target.value);
						setPage(1);
					}}
				>
					{years.map((y) => (
						<SelectOption key={y.id} value={y.id}>
							{(y as any).name || y.id}
						</SelectOption>
					))}
				</Select>
				<span className="text-muted-foreground text-sm">
					{total} {t("enrollments.count_label", "enrolled")}
				</span>
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
						: t("enrollments.empty_title", "No enrollments")
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
