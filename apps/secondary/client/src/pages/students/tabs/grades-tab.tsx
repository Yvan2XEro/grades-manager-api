import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

type StudentData = { id: string };

export function StudentGradesTab() {
	const { t } = useTranslation();
	const student = useOutletContext<StudentData>();
	const [termId, setTermId] = useState("");

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);

	const { data: assessments = [], isLoading } =
		trpc.assessments.getStudentResults.useQuery(
			{ studentId: student.id, termId },
			{ enabled: !!student.id && !!termId },
		);

	// Group assessments by subjectId and compute averages
	const bySubject = assessments.reduce<
		Record<
			string,
			{ subjectId: string; sum: number; count: number; types: string[] }
		>
	>((acc, a) => {
		const sid = a.subjectId;
		if (!acc[sid]) {
			acc[sid] = { subjectId: sid, sum: 0, count: 0, types: [] };
		}
		if (a.value !== null) {
			acc[sid].sum += Number(a.value);
			acc[sid].count += 1;
		}
		acc[sid].types.push(a.assessmentType);
		return acc;
	}, {});

	const rows = Object.values(bySubject).map((s) => ({
		subjectId: s.subjectId,
		avg: s.count > 0 ? Math.round((s.sum / s.count) * 100) / 100 : null,
		assessmentCount: s.count,
	}));

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<label className="font-medium text-foreground text-sm">
					{t("grades.term", "Term")}
				</label>
				<Select value={termId} onChange={(e) => setTermId(e.target.value)}>
					<SelectOption value="">
						— {t("grades.select_term", "Select a term")} —
					</SelectOption>
					{terms.map((term) => (
						<SelectOption key={term.id} value={term.id}>
							{t(`terms.term_${term.termNumber}`, `Term ${term.termNumber}`)}
						</SelectOption>
					))}
				</Select>
			</div>

			{!termId ? (
				<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
					<GraduationCap className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("grades.select_all", "Select a term to view grades")}
					</p>
				</div>
			) : isLoading ? (
				<div className="py-8 text-center text-muted-foreground text-sm">
					{t("common.loading", "Loading…")}
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
						<thead className="bg-muted/40 text-muted-foreground">
							<tr>
								<th className="px-4 py-2 text-left font-medium">
									{t("grades.subject", "Subject")}
								</th>
								<th className="px-4 py-2 text-right font-medium">
									{t("grades.col_avg", "Average /20")}
								</th>
								<th className="px-4 py-2 text-right font-medium">
									{t("grades.col_count", "Assessments")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{rows.map((row) => (
								<tr
									key={row.subjectId}
									className="transition-colors hover:bg-muted/20"
								>
									<td className="px-4 py-2 font-mono text-muted-foreground text-xs">
										{row.subjectId}
									</td>
									<td className="px-4 py-2 text-right font-medium">
										{row.avg !== null ? row.avg : "—"}
									</td>
									<td className="px-4 py-2 text-right text-muted-foreground">
										{row.assessmentCount}
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
