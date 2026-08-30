import { FileDown, Search, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

function StatusBadge({ status }: { status: string | null | undefined }) {
	const { t } = useTranslation();
	const base =
		"inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs";
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
	return (
		<span className={`${base} bg-muted text-muted-foreground`}>
			{status ? t(`enrollments.status_${status}`, status) : "—"}
		</span>
	);
}

export function ClassRoster() {
	const { t } = useTranslation();
	const { id: classId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [search, setSearch] = useState("");

	const { data: klass } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);
	useBreadcrumbs([
		{ label: t("nav.classes", "Classes"), href: "/classes" },
		{ label: klass?.name ?? "…", href: `/classes/${classId}` },
		{ label: t("classes.tab_roster", "Roster") },
	]);

	const { data: roster = [], isLoading } = trpc.classes.getRoster.useQuery(
		{ classId: classId! },
		{ enabled: !!classId },
	);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const printRoster = trpc.enrollments.printClassRoster.useMutation({
		onSuccess: (result) => {
			const link = document.createElement("a");
			link.href = `data:application/pdf;base64,${result.pdfBase64}`;
			link.download = result.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},
	});

	if (isLoading) {
		return (
			<div className="overflow-hidden rounded-xl border border-border">
				{Array.from({ length: 6 }, (_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 border-border border-b px-4 py-3 last:border-0"
					>
						<Skeleton className="h-4 w-40" />
						<Skeleton className="ml-auto h-4 w-20" />
						<Skeleton className="h-4 w-16" />
					</div>
				))}
			</div>
		);
	}

	const genderLabel = (g: string | null | undefined) => {
		if (!g) return "—";
		if (g === "M") return t("students.gender_m", "M");
		if (g === "F") return t("students.gender_f", "F");
		return g;
	};

	const filtered = search.trim()
		? roster.filter((item) => {
				const name =
					`${item.student.firstName} ${item.student.lastName}`.toLowerCase();
				const mnu = (item.student.mnu ?? "").toLowerCase();
				const q = search.toLowerCase();
				return name.includes(q) || mnu.includes(q);
			})
		: roster;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-foreground">
					{t("classes.roster", "Roster")}
				</h2>
				<div className="flex items-center gap-3">
					<span className="text-muted-foreground text-sm">
						{roster.length} {t("classes.students_enrolled", "students")}
					</span>
					{activeYear && roster.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							disabled={printRoster.isPending}
							onClick={() =>
								classId &&
								activeYear &&
								printRoster.mutate({
									classId,
									academicYearId: activeYear.id,
								})
							}
						>
							<FileDown className="mr-1.5 h-4 w-4" />
							{printRoster.isPending
								? t("common.loading", "Loading…")
								: t("classes.print_roster", "Print roster")}
						</Button>
					)}
				</div>
			</div>

			<div className="relative">
				<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder={t(
						"students.search_placeholder",
						"Search by name or MNU…",
					)}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="border-border border-b bg-muted/60 text-muted-foreground">
						<tr>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.col_name", "Student")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.registration_number", "Reg. #")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.col_gender", "Gender")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("common.status", "Status")}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{filtered.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-4 py-12 text-center text-muted-foreground"
								>
									<div className="flex flex-col items-center gap-3">
										<Users className="h-10 w-10 opacity-30" />
										<p className="font-medium">
											{search.trim()
												? t(
														"students.empty_filtered",
														"No students match your filters",
													)
												: t("students.empty_title", "No students enrolled")}
										</p>
									</div>
								</td>
							</tr>
						) : (
							filtered.map((item) => (
								<tr
									key={item.enrollment.id}
									className="cursor-pointer transition-colors hover:bg-muted/30"
									onClick={() =>
										navigate(`/students/${item.student.id}`, {
											state: {
												fromClassId: classId,
												fromClassName: klass?.name,
											},
										})
									}
								>
									<td className="px-4 py-3 font-medium text-foreground">
										{item.student.firstName} {item.student.lastName}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{item.student.registrationNumber ?? "—"}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{genderLabel(item.student.gender)}
									</td>
									<td className="px-4 py-3">
										<StatusBadge status={item.enrollment.status} />
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
