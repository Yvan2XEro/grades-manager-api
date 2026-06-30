import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { trpc, trpcClient } from "@/utils/trpc";

function rateColor(rate: number | null, threshold: number | null): string {
	if (rate === null) return "text-muted-foreground";
	const pass = threshold ?? 75;
	const warn = Math.round(pass * 0.67);
	if (rate >= pass) return "text-green-700 font-medium";
	if (rate >= warn) return "text-yellow-700 font-medium";
	return "text-red-700 font-medium";
}

type ClassItem = { id: string; name: string };

export default function ClassAttendanceOverview() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classId, setClassId] = useState<string | null>(null);

	const { data: classesData } = useQuery({
		queryKey: ["classes-for-overview", academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 500,
			});
			return items as ClassItem[];
		},
	});

	const overviewQuery = useQuery({
		...trpc.attendance.getClassAttendanceOverview.queryOptions({
			classId: classId ?? "",
			academicYearId: academicYearId ?? "",
		}),
		enabled: !!classId && !!academicYearId,
	});

	const classes = classesData ?? [];
	const rows = overviewQuery.data ?? [];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-4">
				<div className="w-52 space-y-1">
					<Label className="text-xs">
						{t("teacher.attendanceManagement.filterByYear")}
					</Label>
					<AcademicYearSelect
						value={academicYearId}
						onChange={(v) => {
							setAcademicYearId(v);
							setClassId(null);
						}}
					/>
				</div>
				<div className="w-52 space-y-1">
					<Label className="text-xs">
						{t("admin.attendance.overview.classLabel")}
					</Label>
					<Select
						value={classId ?? ""}
						onValueChange={(v) => setClassId(v || null)}
						disabled={!academicYearId}
					>
						<SelectTrigger className="text-xs">
							<SelectValue
								placeholder={t("admin.attendance.overview.classPlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							{classes.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{!classId || !academicYearId ? (
				<Empty>
					<EmptyHeader>
						<span className="text-3xl text-muted-foreground/40">📊</span>
					</EmptyHeader>
					<EmptyTitle>{t("admin.attendance.overview.emptyTitle")}</EmptyTitle>
					<EmptyDescription>
						{t("admin.attendance.overview.emptyDescription")}
					</EmptyDescription>
				</Empty>
			) : overviewQuery.isLoading ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : rows.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<span className="text-3xl text-muted-foreground/40">📭</span>
					</EmptyHeader>
					<EmptyTitle>{t("admin.attendance.overview.noData")}</EmptyTitle>
				</Empty>
			) : (
				<div className="overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
								<th className="px-4 py-2 text-left">
									{t("admin.attendance.overview.course")}
								</th>
								<th className="px-4 py-2 text-left">
									{t("admin.attendance.overview.code")}
								</th>
								<th className="px-4 py-2 text-right">
									{t("admin.attendance.overview.sessions")}
								</th>
								<th className="px-4 py-2 text-right">
									{t("admin.attendance.overview.rate")}
								</th>
								<th className="px-4 py-2 text-right">
									{t("admin.attendance.overview.threshold")}
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr
									key={row.classCourseId}
									className="border-b last:border-0 hover:bg-muted/20"
								>
									<td className="px-4 py-2">{row.courseName ?? row.code}</td>
									<td className="px-4 py-2 text-muted-foreground text-xs">
										{row.code}
									</td>
									<td className="px-4 py-2 text-right tabular-nums">
										{row.totalSessions}
									</td>
									<td
										className={`px-4 py-2 text-right tabular-nums ${rateColor(row.attendanceRate, row.threshold)}`}
									>
										{row.attendanceRate !== null
											? `${row.attendanceRate}%`
											: "—"}
									</td>
									<td className="px-4 py-2 text-right text-muted-foreground tabular-nums">
										{row.threshold !== null ? `${row.threshold}%` : "—"}
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
