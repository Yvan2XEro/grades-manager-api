import { CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

const STATUS_VARIANTS: Record<
	string,
	"success" | "destructive" | "warning" | "secondary"
> = {
	present: "success",
	absent: "destructive",
	late: "warning",
	excused: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
	present: "Present",
	absent: "Absent",
	late: "Late",
	excused: "Excused",
};

function formatDate(d: string | Date) {
	return new Date(d).toLocaleDateString("fr-CM", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

type StudentCtx = { id: string; firstName: string; lastName: string };

export function StudentAttendanceTab() {
	const { t } = useTranslation();
	const { id: studentId } = useParams<{ id: string }>();
	const student = useOutletContext<StudentCtx | null>();
	useBreadcrumbs([
		{ label: t("nav.students", "Students"), href: "/students" },
		{
			label: student ? `${student.firstName} ${student.lastName}` : "…",
			href: `/students/${studentId}`,
		},
		{ label: t("students.tab_attendance", "Attendance") },
	]);

	const { data: records = [], isLoading } =
		trpc.attendance.studentHistory.useQuery(
			{ studentId: studentId! },
			{ enabled: !!studentId },
		);

	const counts = records.reduce<Record<string, number>>((acc, r) => {
		acc[r.status] = (acc[r.status] ?? 0) + 1;
		return acc;
	}, {});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{Array.from({ length: 4 }, (_, i) => (
						<div
							key={i}
							className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4"
						>
							<Skeleton className="h-7 w-10" />
							<Skeleton className="h-5 w-16 rounded-full" />
						</div>
					))}
				</div>
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.date", "Date")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.status", "Status")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.justification", "Note")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{Array.from({ length: 5 }, (_, i) => (
								<tr key={i}>
									<td className="px-4 py-2.5">
										<Skeleton className="h-4 w-28" />
									</td>
									<td className="px-4 py-2.5">
										<Skeleton className="h-5 w-16 rounded-full" />
									</td>
									<td className="px-4 py-2.5">
										<Skeleton className="h-4 w-20" />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Summary */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{(["present", "absent", "late", "excused"] as const).map((s) => (
					<div
						key={s}
						className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4"
					>
						<span className="font-bold text-2xl text-foreground">
							{counts[s] ?? 0}
						</span>
						<Badge variant={STATUS_VARIANTS[s]}>
							{t(`attendance.status_${s}`, STATUS_LABELS[s])}
						</Badge>
					</div>
				))}
			</div>

			{/* Records list */}
			{records.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-16">
						<CalendarCheck className="h-10 w-10 text-muted-foreground opacity-20" />
						<p className="font-medium text-muted-foreground">
							{t("attendance.no_records", "No attendance records yet.")}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.date", "Date")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.status", "Status")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.justification", "Note")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{records.map((r) => (
								<tr key={r.id} className="hover:bg-muted/20">
									<td className="px-4 py-2.5 text-foreground">
										{formatDate(r.createdAt)}
									</td>
									<td className="px-4 py-2.5">
										<Badge variant={STATUS_VARIANTS[r.status] ?? "secondary"}>
											{t(
												`attendance.status_${r.status}`,
												STATUS_LABELS[r.status] ?? r.status,
											)}
										</Badge>
									</td>
									<td className="px-4 py-2.5 text-muted-foreground">
										{r.justification ?? "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
