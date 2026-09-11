import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { Badge } from "@/components/ui/badge";
import { PillCombobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

type StudentData = { id: string; firstName: string; lastName: string };

function getAppreciation(avg: number, t: (key: string, fb: string) => string) {
	if (avg >= 16)
		return {
			label: t("grades.mention_excellent", "Excellent"),
			cls: "success",
		};
	if (avg >= 14)
		return { label: t("grades.mention_good", "Good"), cls: "info" };
	if (avg >= 12)
		return {
			label: t("grades.mention_fairly_good", "Fairly good"),
			cls: "info",
		};
	if (avg >= 10)
		return { label: t("grades.mention_passing", "Passing"), cls: "warning" };
	return { label: t("grades.mention_failing", "Failing"), cls: "destructive" };
}

export function StudentGradesTab() {
	const { t } = useTranslation();
	const student = useOutletContext<StudentData>();
	useBreadcrumbs([
		{ label: t("nav.students", "Students"), href: "/students" },
		{
			label: `${student.firstName} ${student.lastName}`,
			href: `/students/${student.id}`,
		},
		{ label: t("students.tab_grades", "Grades") },
	]);
	const [termId, setTermId] = useState("");

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);

	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 500 });
	const subjectMap = new Map(
		(subjectsData?.items ?? []).map((s) => [s.id, s.name]),
	);

	const { data: assessments = [], isLoading } =
		trpc.assessments.getStudentResults.useQuery(
			{ studentId: student.id, termId },
			{ enabled: !!student.id && !!termId },
		);

	// Group by subject and compute average
	const bySubject: Record<
		string,
		{ sum: number; count: number; absent: number }
	> = {};
	for (const a of assessments) {
		if (!bySubject[a.subjectId])
			bySubject[a.subjectId] = { sum: 0, count: 0, absent: 0 };
		if (a.value !== null) {
			bySubject[a.subjectId].sum += Number(a.value);
			bySubject[a.subjectId].count += 1;
		} else {
			bySubject[a.subjectId].absent += 1;
		}
	}

	const rows = Object.entries(bySubject).map(([subjectId, data]) => ({
		subjectId,
		subjectName: subjectMap.get(subjectId) ?? subjectId,
		avg:
			data.count > 0 ? Math.round((data.sum / data.count) * 100) / 100 : null,
		assessmentCount: data.count,
		absentCount: data.absent,
	}));

	// Compute overall average (mean of subject averages)
	const gradedSubjects = rows.filter((r) => r.avg !== null);
	const overallAvg =
		gradedSubjects.length > 0
			? Math.round(
					(gradedSubjects.reduce((s, r) => s + (r.avg ?? 0), 0) /
						gradedSubjects.length) *
						100,
				) / 100
			: null;

	return (
		<div className="space-y-4">
			<PillCombobox
				options={terms.map((term) => ({
					value: term.id,
					label: t(`terms.term_${term.termNumber}`, `Term ${term.termNumber}`),
				}))}
				value={termId}
				onValueChange={setTermId}
				placeholder={t("grades.select_term", "Term…")}
			/>

			{!termId ? (
				<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
					<GraduationCap className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("grades.select_term_prompt", "Select a term to view grades")}
					</p>
				</div>
			) : isLoading ? (
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2.5 text-left font-medium">
									{t("subjects.col_name", "Subject")}
								</th>
								<th className="px-4 py-2.5 text-right font-medium">
									{t("grades.col_avg", "Average /20")}
								</th>
								<th className="px-4 py-2.5 text-center font-medium">
									{t("grades.col_appreciation", "Grade")}
								</th>
								<th className="px-4 py-2.5 text-right font-medium text-xs">
									{t("grades.col_count", "Entries")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{Array.from({ length: 6 }, (_, i) => (
								<tr key={i}>
									<td className="px-4 py-2.5">
										<Skeleton className="h-4 w-32" />
									</td>
									<td className="px-4 py-2.5 text-right">
										<Skeleton className="ml-auto h-4 w-10" />
									</td>
									<td className="px-4 py-2.5 text-center">
										<Skeleton className="mx-auto h-5 w-16 rounded-full" />
									</td>
									<td className="px-4 py-2.5 text-right">
										<Skeleton className="ml-auto h-4 w-6" />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : rows.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
					<GraduationCap className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("grades.no_grades", "No grades recorded yet.")}
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2.5 text-left font-medium">
									{t("subjects.col_name", "Subject")}
								</th>
								<th className="px-4 py-2.5 text-right font-medium">
									{t("grades.col_avg", "Average /20")}
								</th>
								<th className="px-4 py-2.5 text-center font-medium">
									{t("grades.col_appreciation", "Grade")}
								</th>
								<th className="px-4 py-2.5 text-right font-medium text-xs">
									{t("grades.col_count", "Entries")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{rows.map((row) => {
								const appr =
									row.avg !== null ? getAppreciation(row.avg, t) : null;
								return (
									<tr
										key={row.subjectId}
										className="transition-colors hover:bg-muted/20"
									>
										<td className="px-4 py-2.5 font-medium text-foreground">
											{row.subjectName}
										</td>
										<td className="px-4 py-2.5 text-right tabular-nums">
											{row.avg !== null ? (
												<span
													className={
														row.avg < 10
															? "font-bold text-destructive"
															: "font-semibold"
													}
												>
													{row.avg}
												</span>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="px-4 py-2.5 text-center">
											{appr && (
												<Badge
													variant={
														appr.cls as
															| "success"
															| "info"
															| "warning"
															| "destructive"
													}
												>
													{appr.label}
												</Badge>
											)}
										</td>
										<td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
											{row.assessmentCount}
											{row.absentCount > 0 && (
												<span className="ml-1 text-orange-500">
													({row.absentCount} abs.)
												</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
						{overallAvg !== null && (
							<tfoot>
								<tr className="bg-muted/30">
									<td
										className="px-4 py-3 font-bold text-foreground"
										colSpan={1}
									>
										{t("grades.overall_avg", "General average")}
									</td>
									<td className="px-4 py-3 text-right font-bold tabular-nums">
										{overallAvg}
									</td>
									<td className="px-4 py-3 text-center">
										{(() => {
											const appr = getAppreciation(overallAvg, t);
											return (
												<Badge
													variant={
														appr.cls as
															| "success"
															| "info"
															| "warning"
															| "destructive"
													}
												>
													{appr.label}
												</Badge>
											);
										})()}
									</td>
									<td />
								</tr>
							</tfoot>
						)}
					</table>
				</div>
			)}
		</div>
	);
}
