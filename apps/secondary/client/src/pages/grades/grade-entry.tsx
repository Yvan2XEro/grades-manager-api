import { CheckCircle, GraduationCap, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function GradeEntry() {
	const { t } = useTranslation();
	const [classId, setClassId] = useState("");
	const [subjectId, setSubjectId] = useState("");
	const [termId, setTermId] = useState("");
	const [assessmentType, setAssessmentType] = useState("sequence_1");
	const [saved, setSaved] = useState(false);

	const { data: classes = [] } = trpc.classes.list.useQuery({});
	const { data: subjects = [] } = trpc.subjects.list.useQuery();
	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];
	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);
	const { data: enrollments = [] } = trpc.enrollments.list.useQuery(
		{ academicYearId: activeYear?.id ?? "", classId },
		{ enabled: !!classId && !!activeYear?.id },
	);

	const batchUpsert = trpc.assessments.batchUpsert.useMutation({
		onSuccess: () => {
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		},
	});

	const [grades, setGrades] = useState<Record<string, string>>({});

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

	const handleSave = () => {
		if (!classId || !subjectId || !termId) return;
		const items = enrollments.flatMap((e) => {
			const studentId = (e as any).student?.id;
			if (!studentId) return [];
			const key = studentId;
			const raw = grades[key];
			const value =
				raw !== undefined && raw !== "" ? Number.parseFloat(raw) : null;
			return [{ studentId, classId, subjectId, termId, assessmentType, value }];
		});
		if (items.length === 0) return;
		batchUpsert.mutate({ items });
	};

	const canSave = classId && subjectId && termId;

	return (
		<div className="space-y-5">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("grades.title", "Saisie des notes")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t(
						"grades.subtitle",
						"Entrez les notes des élèves par matière et séquence",
					)}
				</p>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("grades.class", "Classe")}
					</label>
					<select
						value={classId}
						onChange={(e) => setClassId(e.target.value)}
						className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="">
							{t("grades.select_class", "— Sélectionner —")}
						</option>
						{classes.map((c) => (
							<option key={c.id} value={c.id}>
								{(c as any).name || c.id}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("grades.subject", "Matière")}
					</label>
					<select
						value={subjectId}
						onChange={(e) => setSubjectId(e.target.value)}
						className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="">
							{t("grades.select_subject", "— Sélectionner —")}
						</option>
						{subjects.map((s) => (
							<option key={s.id} value={s.id}>
								{(s as any).name || s.id}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("grades.term", "Trimestre")}
					</label>
					<select
						value={termId}
						onChange={(e) => setTermId(e.target.value)}
						className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="">
							{t("grades.select_term", "— Sélectionner —")}
						</option>
						{terms.map((trm) => (
							<option key={trm.id} value={trm.id}>
								{(trm as any).name || trm.id}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("grades.type", "Type d'évaluation")}
					</label>
					<select
						value={assessmentType}
						onChange={(e) => setAssessmentType(e.target.value)}
						className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						{ASSESSMENT_TYPES.map((a) => (
							<option key={a.value} value={a.value}>
								{a.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{canSave && (
				<div className="overflow-hidden rounded-xl border border-border">
					<div className="flex items-center justify-between bg-muted/30 px-4 py-3">
						<span className="font-medium text-foreground text-sm">
							{enrollments.length} {t("grades.students", "élèves")}
						</span>
						<button
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
							{saved
								? t("grades.saved", "Enregistré !")
								: t("grades.save", "Enregistrer")}
						</button>
					</div>
					<table className="w-full text-sm">
						<thead className="bg-muted/40 text-muted-foreground">
							<tr>
								<th className="px-4 py-2 text-left font-medium">
									{t("grades.col_student", "Élève")}
								</th>
								<th className="px-4 py-2 text-left font-medium">
									{t("grades.col_grade", "Note /20")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{enrollments.length === 0 ? (
								<tr>
									<td
										colSpan={2}
										className="px-4 py-8 text-center text-muted-foreground"
									>
										<div className="flex flex-col items-center gap-2">
											<GraduationCap className="h-8 w-8 opacity-30" />
											<p>
												{t(
													"grades.no_students",
													"Aucun élève dans cette classe",
												)}
											</p>
										</div>
									</td>
								</tr>
							) : (
								enrollments.map((e) => {
									const student = (e as any).student;
									if (!student) return null;
									return (
										<tr
											key={student.id}
											className="transition-colors hover:bg-muted/20"
										>
											<td className="px-4 py-2 font-medium text-foreground">
												{student.lastName} {student.firstName}
											</td>
											<td className="px-4 py-2">
												<input
													type="number"
													min="0"
													max="20"
													step="0.25"
													placeholder="—"
													value={grades[student.id] ?? ""}
													onChange={(ev) =>
														setGrades((prev) => ({
															...prev,
															[student.id]: ev.target.value,
														}))
													}
													className="w-20 rounded border border-input bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
												/>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			)}

			{!canSave && (
				<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
					<GraduationCap className="h-12 w-12 opacity-20" />
					<p className="font-medium">
						{t(
							"grades.select_all",
							"Sélectionnez une classe, une matière et un trimestre",
						)}
					</p>
				</div>
			)}
		</div>
	);
}
