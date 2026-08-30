import type { ColumnDef } from "@tanstack/react-table";
import { GraduationCap, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PillCombobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { type RouterOutputs, trpc } from "@/utils/trpc";

type EnrollmentRow = RouterOutputs["enrollments"]["list"]["items"][number];

const ADMISSION_KEYS: Record<string, string> = {
	new: "enrollments.admission_new",
	transfer: "enrollments.admission_transfer",
	repeat: "enrollments.admission_repeat",
	promoted: "enrollments.admission_promoted",
};
const ADMISSION_FB: Record<string, string> = {
	new: "New",
	transfer: "Transfer",
	repeat: "Repeating",
	promoted: "Promoted",
};
const ADMISSION_CLS: Record<string, string> = {
	new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	transfer:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	repeat:
		"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	promoted:
		"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function AdmissionBadge({ type }: { type: string | null }) {
	const { t } = useTranslation();
	if (!type) return <span className="text-muted-foreground">—</span>;
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${ADMISSION_CLS[type] ?? "bg-muted text-muted-foreground"}`}
		>
			{t(ADMISSION_KEYS[type] ?? "", ADMISSION_FB[type] ?? type)}
		</span>
	);
}

function StatusBadge({ status }: { status: string | null }) {
	const { t } = useTranslation();
	const base =
		"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
	if (status === "active")
		return (
			<span
				className={`${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}
			>
				{t("enrollments.status_active", "Active")}
			</span>
		);
	if (status === "withdrawn")
		return (
			<span
				className={`${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}
			>
				{t("enrollments.status_withdrawn", "Withdrawn")}
			</span>
		);
	if (status === "transferred")
		return (
			<span
				className={`${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`}
			>
				{t("enrollments.status_transferred", "Transferred")}
			</span>
		);
	return <span className="text-muted-foreground text-xs">{status ?? "—"}</span>;
}

export function Enrollments() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [search, setSearch] = useState("");
	const [filterClassId, setFilterClassId] = useState("all");

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId: yearId, pageSize: 200 },
		{ enabled: !!yearId },
	);
	const classes = classesData?.items ?? [];
	const classMap = new Map(classes.map((c) => [c.id, c.name]));

	const { data, isLoading } = trpc.enrollments.list.useQuery(
		{
			academicYearId: yearId,
			classId: filterClassId !== "all" ? filterClassId : undefined,
			search: search || undefined,
			page,
			pageSize,
		},
		{ enabled: !!yearId },
	);

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<EnrollmentRow>[] = [
		{
			id: "student",
			accessorFn: (row) => `${row.student.lastName} ${row.student.firstName}`,
			enableSorting: true,
			header: t("enrollments.col_student", "Student"),
			cell: ({ row }) => (
				<Link
					to={`/students/${row.original.student.id}`}
					className="group flex flex-col"
				>
					<span className="font-medium text-foreground group-hover:text-primary">
						{row.original.student.lastName} {row.original.student.firstName}
					</span>
					{row.original.student.mnu && (
						<span className="text-muted-foreground text-xs">
							{row.original.student.mnu}
						</span>
					)}
				</Link>
			),
		},
		{
			id: "class",
			accessorFn: (row) => classMap.get(row.enrollment.classId) ?? "",
			enableSorting: true,
			header: t("enrollments.col_class", "Class"),
			cell: ({ row }) => {
				const cid = row.original.enrollment.classId;
				const name = classMap.get(cid);
				return name ? (
					<Link
						to={`/classes/${cid}`}
						className="font-medium text-foreground hover:text-primary"
					>
						{name}
					</Link>
				) : (
					<span className="font-mono text-muted-foreground text-xs">
						{cid.slice(0, 8)}…
					</span>
				);
			},
		},
		{
			id: "admissionType",
			accessorFn: (row) => row.enrollment.admissionType ?? "",
			enableSorting: true,
			header: t("enrollments.col_type", "Admission"),
			cell: ({ row }) => (
				<AdmissionBadge type={row.original.enrollment.admissionType} />
			),
		},
		{
			id: "status",
			accessorFn: (row) => row.enrollment.status ?? "",
			enableSorting: true,
			header: t("enrollments.col_status", "Status"),
			cell: ({ row }) => (
				<StatusBadge status={row.original.enrollment.status} />
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("enrollments.title", "Enrollments")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{activeYear
							? `${activeYear.name} · ${total} ${t("enrollments.count_label", "enrolled")}`
							: t(
									"enrollments.subtitle",
									"Student enrollments by academic year",
								)}
					</p>
				</div>
				<Button asChild>
					<Link to="/students/new">{t("students.add", "Add student")}</Link>
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 200 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t(
							"students.search_placeholder",
							"Search by name, MNU…",
						)}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				{classes.length > 0 && (
					<PillCombobox
						options={[
							{
								value: "all",
								label: t("enrollments.all_classes", "All classes"),
							},
							...classes.map((c) => ({ value: c.id, label: c.name })),
						]}
						value={filterClassId}
						onValueChange={(v) => {
							setFilterClassId(v);
							setPage(1);
						}}
						placeholder={t("enrollments.col_class", "Class")}
					/>
				)}
			</div>

			{!yearId ? (
				<div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
					<GraduationCap className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("enrollments.select_year", "No active academic year")}
					</p>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={items}
					total={total}
					page={page}
					pageSize={pageSize}
					isLoading={isLoading}
					emptyMessage={
						search || filterClassId !== "all"
							? t(
									"enrollments.empty_filtered",
									"No enrollments match your filters",
								)
							: t("enrollments.empty_title", "No enrollments")
					}
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
