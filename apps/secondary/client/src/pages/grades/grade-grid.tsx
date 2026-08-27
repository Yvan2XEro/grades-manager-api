import { CheckCircle, GraduationCap, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const ASSESSMENT_TYPES = [
	{ value: "sequence_1", label: "Séq. 1" },
	{ value: "sequence_2", label: "Séq. 2" },
	{ value: "sequence_3", label: "Séq. 3" },
	{ value: "sequence_4", label: "Séq. 4" },
	{ value: "sequence_5", label: "Séq. 5" },
	{ value: "sequence_6", label: "Séq. 6" },
	{ value: "end_of_term_exam", label: "Exam" },
	{ value: "class_test", label: "Contrôle" },
	{ value: "quiz", label: "Quiz" },
];

export function GradeGrid() {
	const { t } = useTranslation();
	const { classId, subjectId, termId } = useParams<{
		classId: string;
		subjectId: string;
		termId: string;
	}>();

	const [saved, setSaved] = useState(false);
	// grades[studentId][assessmentType] = value string
	const [grades, setGrades] = useState<Record<string, Record<string, string>>>(
		{},
	);

	const { data: classData } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);

	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const subject = subjectsData?.items?.find((s: any) => s.id === subjectId);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);
	const term = terms.find((trm: any) => trm.id === termId);

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{
			academicYearId: activeYear?.id ?? "",
			classId: classId ?? "",
			pageSize: 200,
		},
		{ enabled: !!classId && !!activeYear?.id },
	);
	const enrollments = enrollmentsData?.items ?? [];

	const { data: existingAssessments = [] } =
		trpc.assessments.listForClass.useQuery(
			{
				classId: classId!,
				subjectId: subjectId!,
				termId: termId!,
			},
			{ enabled: !!classId && !!subjectId && !!termId },
		);

	// Determine which assessment types are present (default: sequence_1, sequence_2)
	const presentTypes = Array.from(
		new Set(existingAssessments.map((a: any) => a.assessmentType)),
	);
	const activeTypes =
		presentTypes.length > 0 ? presentTypes : ["sequence_1", "sequence_2"];
	const typeLabels = Object.fromEntries(
		ASSESSMENT_TYPES.map((a) => [a.value, a.label]),
	);

	// Pre-fill grades from existing assessments
	useEffect(() => {
		if (existingAssessments.length === 0) return;
		const prefill: Record<string, Record<string, string>> = {};
		for (const a of existingAssessments as any[]) {
			if (!prefill[a.studentId]) prefill[a.studentId] = {};
			prefill[a.studentId][a.assessmentType] =
				a.value !== null ? String(a.value) : "";
		}
		setGrades((prev) => {
			const merged = { ...prev };
			for (const [sid, types] of Object.entries(prefill)) {
				if (!merged[sid]) merged[sid] = {};
				for (const [type, val] of Object.entries(types)) {
					if (merged[sid][type] === undefined) {
						merged[sid][type] = val;
					}
				}
			}
			return merged;
		});
	}, [existingAssessments]);

	const batchUpsert = trpc.assessments.batchUpsert.useMutation({
		onSuccess: () => {
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		},
	});

	const handleSave = () => {
		if (!classId || !subjectId || !termId) return;
		const items: any[] = [];
		for (const e of enrollments as any[]) {
			const student = e.student;
			if (!student) continue;
			for (const type of activeTypes) {
				const raw = grades[student.id]?.[type];
				const value =
					raw !== undefined && raw !== "" ? Number.parseFloat(raw) : null;
				items.push({
					studentId: student.id,
					classId,
					subjectId,
					termId,
					assessmentType: type,
					value,
				});
			}
		}
		if (items.length === 0) return;
		batchUpsert.mutate({ items });
	};

	const setGrade = (studentId: string, type: string, value: string) => {
		setGrades((prev) => ({
			...prev,
			[studentId]: { ...(prev[studentId] ?? {}), [type]: value },
		}));
	};

	return (
		<div className="space-y-5">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("grades.grid_title", "Grade Sheet")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{[classData?.name, subject?.name, (term as any)?.name]
						.filter(Boolean)
						.join(" · ")}
				</p>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<div className="flex items-center justify-between bg-muted/30 px-4 py-3">
					<span className="font-medium text-foreground text-sm">
						{enrollments.length} {t("grades.students", "students")}
					</span>
					<button
						type="button"
						onClick={handleSave}
						disabled={batchUpsert.isPending}
						className={cn(
							"inline-flex items-center gap-2 rounded-lg px-4 py-1.5 font-medium text-sm transition-colors",
							saved
								? "bg-green-500 text-white"
								: "bg-primary text-primary-foreground hover:bg-primary/90",
						)}
					>
						{saved ? (
							<CheckCircle className="h-4 w-4" />
						) : (
							<Save className="h-4 w-4" />
						)}
						{saved ? t("grades.saved", "Saved!") : t("grades.save", "Save")}
					</button>
				</div>

				{enrollments.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
						<GraduationCap className="h-10 w-10 opacity-20" />
						<p className="font-medium">
							{t("grades.no_students", "No students in this class")}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-muted/40 text-muted-foreground">
								<tr>
									<th className="px-4 py-2 text-left font-medium">
										{t("grades.col_student", "Student")}
									</th>
									{activeTypes.map((type) => (
										<th
											key={type}
											className="px-3 py-2 text-center font-medium"
										>
											{typeLabels[type] ?? type}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{(enrollments as any[]).map((e) => {
									const student = e.student;
									if (!student) return null;
									return (
										<tr
											key={student.id}
											className="transition-colors hover:bg-muted/20"
										>
											<td className="px-4 py-2 font-medium text-foreground">
												{student.lastName} {student.firstName}
											</td>
											{activeTypes.map((type) => (
												<td key={type} className="px-3 py-2 text-center">
													<input
														type="number"
														min="0"
														max="20"
														step="0.25"
														placeholder="—"
														value={grades[student.id]?.[type] ?? ""}
														onChange={(ev) =>
															setGrade(student.id, type, ev.target.value)
														}
														className="w-16 rounded border border-input bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
													/>
												</td>
											))}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
