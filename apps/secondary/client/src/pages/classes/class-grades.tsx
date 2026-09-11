import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

type Assignment = {
	assignment: { id: string; subjectId: string };
	staff: { id: string; firstName: string; lastName: string };
	subject: {
		id: string;
		name: string;
		nameFr: string | null;
		code: string | null;
	};
};

export function ClassGrades() {
	const { t } = useTranslation();
	const { id: classId } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const { data: klass } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);
	useBreadcrumbs([
		{ label: t("nav.classes", "Classes"), href: "/classes" },
		{ label: klass?.name ?? "…", href: `/classes/${classId}` },
		{ label: t("classes.tab_grades", "Grades") },
	]);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);

	const { data: assignments = [] } = trpc.subjectAssignments.list.useQuery(
		{ academicYearId: activeYear?.id ?? "", classId: classId! },
		{ enabled: !!activeYear?.id && !!classId },
	);
	const typedAssignments = assignments as Assignment[];

	// Enrollment count for completion indicators
	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{ classId: classId!, academicYearId: activeYear?.id ?? "", pageSize: 200 },
		{ enabled: !!classId && !!activeYear?.id },
	);
	const totalStudents = enrollmentsData?.items.length ?? 0;

	// Completion matrix: matrix[termId][subjectId] = number of graded students
	const { data: completionMatrix } =
		trpc.assessments.getCompletionMatrix.useQuery(
			{ classId: classId! },
			{ enabled: !!classId },
		);

	const handleOpen = (subjectId: string, termId: string) => {
		navigate(`/grades/${classId}/${subjectId}/${termId}`);
	};

	const noData = typedAssignments.length === 0 || terms.length === 0;

	return (
		<div className="space-y-4">
			<div>
				<h2 className="font-semibold text-foreground">
					{t("grades.title", "Grades")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						"grades.class_tab_hint",
						"Select a subject and term to enter grades",
					)}
				</p>
			</div>

			{noData ? (
				<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
					<GraduationCap className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{typedAssignments.length === 0
							? t(
									"grades.no_assignments",
									"No subjects assigned to this class yet",
								)
							: t(
									"grades.no_subjects_or_terms",
									"No subjects or terms configured yet",
								)}
					</p>
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-3 text-left font-medium">
									{t("subjects.col_name", "Subject")}
								</th>
								<th className="px-4 py-3 text-left font-medium text-xs">
									{t("staff.col_name", "Teacher")}
								</th>
								{terms.map((trm) => (
									<th
										key={trm.id}
										className="px-4 py-3 text-center font-medium"
									>
										{t(
											`terms.term_${trm.termNumber}`,
											`Term ${trm.termNumber}`,
										)}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{typedAssignments.map((a) => (
								<tr
									key={a.assignment.id}
									className="transition-colors hover:bg-muted/20"
								>
									<td className="px-4 py-3 font-medium text-foreground">
										{a.subject.name}
									</td>
									<td className="px-4 py-3 text-muted-foreground text-xs">
										{a.staff.lastName} {a.staff.firstName}
									</td>
									{terms.map((trm) => {
										const graded =
											completionMatrix?.[trm.id]?.[a.assignment.subjectId] ?? 0;
										const pct =
											totalStudents > 0
												? Math.round((graded / totalStudents) * 100)
												: 0;
										const isComplete =
											totalStudents > 0 && graded >= totalStudents;
										return (
											<td key={trm.id} className="px-4 py-3 text-center">
												<button
													type="button"
													onClick={() =>
														handleOpen(a.assignment.subjectId, trm.id)
													}
													className={`group flex flex-col items-center gap-0.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary ${isComplete ? "border-green-500/40 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "border-border text-muted-foreground"}`}
												>
													<span className="font-medium">
														{totalStudents > 0
															? `${graded}/${totalStudents}`
															: t("grades.open_grid", "Open")}
													</span>
													{totalStudents > 0 && (
														<div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
															<div
																className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-primary/60"}`}
																style={{ width: `${pct}%` }}
															/>
														</div>
													)}
												</button>
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
