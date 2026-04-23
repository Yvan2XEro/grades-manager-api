import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	BookOpen,
	Check,
	ChevronDown,
	ChevronUp,
	Lock,
	Save,
	Send,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradingProgress } from "@/components/ui/grading-progress";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { examStatusVariant } from "@/lib/exam-status";
import { toast } from "@/lib/toast";
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";

interface ExamData {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	isLocked: boolean;
	status: string;
	canEdit: boolean;
	classCourseId: string;
}

interface CourseData {
	classCourseId: string;
	courseName: string;
	className: string;
	programName: string;
	studentCount: number;
	exams: ExamData[];
	isDelegated: boolean;
}

type GradeInput = { studentId: string; examId: string; score: number };

// ─── Inline Grade Panel ──────────────────────────────────────────────────────

function InlineGradePanel({
	exam,
	classCourseId,
}: {
	exam: ExamData;
	classCourseId: string;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { register, handleSubmit, reset } = useForm({ shouldUnregister: true });

	const rosterQuery = useQuery({
		queryKey: ["roster", classCourseId],
		queryFn: () =>
			trpcClient.classCourses.roster
				.query({ id: classCourseId })
				.then((r) => r.students),
	});

	const gradesQuery = useQuery({
		queryKey: ["grades", exam.id],
		queryFn: () =>
			trpcClient.grades.listByExam
				.query({ examId: exam.id })
				.then((r) => r.items),
	});

	const gradesByStudent = useMemo(() => {
		const map: Record<string, { score: number; id: string }> = {};
		for (const g of gradesQuery.data ?? []) {
			map[g.student] = { score: Number(g.score), id: g.id };
		}
		return map;
	}, [gradesQuery.data]);

	const saveGrades = useMutation({
		mutationFn: async (payload: {
			inserts: GradeInput[];
			deletes: string[];
		}) => {
			await Promise.all([
				...payload.inserts.map((g) => trpcClient.grades.upsertNote.mutate(g)),
				...payload.deletes.map((id) =>
					trpcClient.grades.deleteNote.mutate({ id }),
				),
			]);
		},
		onSuccess: () => {
			toast.success(
				t("teacher.gradeEntry.toast.saveSuccess", {
					defaultValue: "Notes enregistrées",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["grades", exam.id] });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const lockMutation = useMutation({
		mutationFn: () =>
			trpcClient.exams.lock.mutate({ examId: exam.id, lock: true }),
		onSuccess: () => {
			toast.success(
				t("teacher.gradeEntry.toast.lockSuccess", {
					defaultValue: "Examen verrouillé",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["hub-exams", classCourseId] });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const submitMutation = useMutation({
		mutationFn: () => trpcClient.exams.submit.mutate({ examId: exam.id }),
		onSuccess: () => {
			toast.success(
				t("teacher.workflow.toast.submitted", {
					defaultValue: "Examen soumis",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["hub-exams", classCourseId] });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const onSubmitForm = handleSubmit((formValues) => {
		if (!exam.canEdit) {
			toast.error(
				t("teacher.gradeEntry.delegates.readOnlyToast", {
					defaultValue: "Lecture seule",
				}),
			);
			return;
		}
		const values = formValues as Record<string, string | number | undefined>;
		const inserts: GradeInput[] = [];
		const deletes: string[] = [];
		for (const [field, rawValue] of Object.entries(values)) {
			if (!field.startsWith("s_")) continue;
			const studentId = field.slice(2);
			if (rawValue === "" || rawValue == null) {
				const existing = gradesByStudent[studentId];
				if (existing?.id) deletes.push(existing.id);
			} else {
				const score = Number(rawValue);
				if (!Number.isNaN(score) && score >= 0 && score <= 20) {
					inserts.push({ studentId, examId: exam.id, score });
				}
			}
		}
		if (!inserts.length && !deletes.length) return;
		saveGrades.mutate({ inserts, deletes });
	});

	const roster = rosterQuery.data ?? [];
	const graded = Object.keys(gradesByStudent).length;
	const allGraded = graded >= roster.length && roster.length > 0;

	const isLoading = rosterQuery.isLoading || gradesQuery.isLoading;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center border-t bg-muted/20 py-6">
				<Spinner className="h-5 w-5" />
			</div>
		);
	}

	return (
		<div className="border-t bg-muted/20 px-4 py-4">
			<div className="mb-3 flex items-center justify-between">
				<GradingProgress graded={graded} total={roster.length} />
				<div className="flex items-center gap-2">
					{exam.isLocked && (
						<Badge variant="success" className="gap-1">
							<Lock className="h-3 w-3" />
							Verrouillé
						</Badge>
					)}
				</div>
			</div>

			<form onSubmit={onSubmitForm}>
				<div className="overflow-hidden rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10 text-center">#</TableHead>
								<TableHead>Matricule</TableHead>
								<TableHead>Nom</TableHead>
								<TableHead className="w-28">Note /20</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{roster.map((student, i) => {
								const existing = gradesByStudent[student.id];
								return (
									<TableRow key={student.id}>
										<TableCell className="text-center text-muted-foreground text-xs">
											{i + 1}
										</TableCell>
										<TableCell className="font-mono text-xs">
											{student.registrationNumber}
										</TableCell>
										<TableCell className="text-sm">
											{student.firstName} {student.lastName}
										</TableCell>
										<TableCell>
											<input
												type="number"
												step="0.01"
												min={0}
												max={20}
												defaultValue={existing?.score ?? ""}
												disabled={exam.isLocked || !exam.canEdit}
												{...register(`s_${student.id}`)}
												className="w-24 rounded border bg-background px-2 py-1 text-sm tabular-nums disabled:opacity-50"
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>

				<div className="mt-3 flex items-center justify-between gap-2">
					<div className="flex gap-2">
						{!exam.isLocked && (
							<Button
								type="submit"
								size="sm"
								variant="outline"
								disabled={saveGrades.isPending || !exam.canEdit}
							>
								<Save className="mr-1 h-3.5 w-3.5" />
								Enregistrer
							</Button>
						)}
						{!exam.isLocked && allGraded && exam.canEdit && (
							<Button
								type="button"
								size="sm"
								onClick={() => lockMutation.mutate()}
								disabled={lockMutation.isPending}
							>
								<Lock className="mr-1 h-3.5 w-3.5" />
								Verrouiller l'examen
							</Button>
						)}
					</div>
					{exam.isLocked && exam.status === "locked" && (
						<Button
							type="button"
							size="sm"
							onClick={() => submitMutation.mutate()}
							disabled={submitMutation.isPending}
						>
							<Send className="mr-1 h-3.5 w-3.5" />
							Soumettre pour approbation
						</Button>
					)}
				</div>
			</form>
		</div>
	);
}

// ─── Exam Row ────────────────────────────────────────────────────────────────

function ExamRow({
	exam,
	studentCount,
	classCourseId,
	isExpanded,
	onToggle,
}: {
	exam: ExamData;
	studentCount: number;
	classCourseId: string;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const gradesQuery = useQuery({
		queryKey: ["grades-summary", exam.id],
		queryFn: () =>
			trpcClient.grades.listByExam
				.query({ examId: exam.id })
				.then((r) => r.items),
	});

	const submitMutation = useMutation({
		mutationFn: () => trpcClient.exams.submit.mutate({ examId: exam.id }),
		onSuccess: () => {
			toast.success(
				t("teacher.workflow.toast.submitted", { defaultValue: "Soumis" }),
			);
			queryClient.invalidateQueries({ queryKey: ["hub-exams", classCourseId] });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const grades = gradesQuery.data ?? [];
	const graded = grades.length;
	const avg =
		graded > 0
			? (grades.reduce((sum, g) => sum + Number(g.score), 0) / graded).toFixed(
					1,
				)
			: null;

	const cta = () => {
		switch (exam.status) {
			case "draft":
			case "open":
				if (!exam.isLocked)
					return (
						<Button size="sm" variant="outline" onClick={onToggle}>
							Saisir notes
						</Button>
					);
				return (
					<Button
						size="sm"
						onClick={() => submitMutation.mutate()}
						disabled={submitMutation.isPending}
					>
						<Send className="mr-1 h-3.5 w-3.5" />
						Soumettre
					</Button>
				);
			case "locked":
				return (
					<Button
						size="sm"
						onClick={() => submitMutation.mutate()}
						disabled={submitMutation.isPending}
					>
						<Send className="mr-1 h-3.5 w-3.5" />
						Soumettre
					</Button>
				);
			case "submitted":
				return <Badge variant="warning">En attente d'approbation</Badge>;
			case "approved":
				return (
					<Badge variant="success">
						<Check className="mr-1 h-3 w-3" />
						Approuvé
					</Badge>
				);
			case "rejected":
				return <Badge variant="destructive">Rejeté</Badge>;
			default:
				return null;
		}
	};

	const canExpand = !exam.isLocked && ["draft", "open"].includes(exam.status);

	return (
		<>
			<div
				className={`flex items-center gap-4 px-4 py-2.5 text-sm ${canExpand ? "cursor-pointer hover:bg-muted/40" : ""} transition-colors`}
				onClick={canExpand ? onToggle : undefined}
			>
				<div className="w-28 shrink-0">
					<span className="font-medium text-foreground">{exam.name}</span>
					<span className="ml-1.5 text-muted-foreground text-xs">
						{exam.percentage}%
					</span>
				</div>

				<div className="flex-1">
					<GradingProgress graded={graded} total={studentCount} />
				</div>

				{avg && (
					<span className="w-16 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
						moy {avg}
					</span>
				)}

				<div className="flex shrink-0 items-center gap-2">
					<Badge variant={examStatusVariant(exam.status)} className="text-xs">
						{exam.status}
					</Badge>
					{cta()}
					{canExpand &&
						(isExpanded ? (
							<ChevronUp className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						))}
				</div>
			</div>
			{isExpanded && (
				<InlineGradePanel exam={exam} classCourseId={classCourseId} />
			)}
		</>
	);
}

// ─── Course Card ─────────────────────────────────────────────────────────────

function TeacherCourseCard({ course }: { course: CourseData }) {
	const [expandedExam, setExpandedExam] = useState<string | null>(null);

	const pendingAction = course.exams.find(
		(e) =>
			e.status === "locked" ||
			(!e.isLocked && e.status !== "approved" && e.status !== "submitted"),
	);

	const toggle = (examId: string) =>
		setExpandedExam((prev) => (prev === examId ? null : examId));

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
						<BookOpen className="h-4 w-4 text-primary" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="font-semibold text-foreground text-sm">
								{course.courseName}
							</span>
							{course.isDelegated && (
								<Badge variant="secondary" className="text-xs">
									Délégué
								</Badge>
							)}
						</div>
						<span className="text-muted-foreground text-xs">
							{course.className} · {course.programName}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3 text-muted-foreground text-xs">
					<span className="flex items-center gap-1">
						<Users className="h-3.5 w-3.5" />
						{course.studentCount}
					</span>
					<span>
						{course.exams.length} examen{course.exams.length > 1 ? "s" : ""}
					</span>
				</div>
			</div>

			{course.exams.length === 0 ? (
				<div className="px-4 py-6 text-center text-muted-foreground text-sm">
					Aucun examen pour ce cours
				</div>
			) : (
				<div className="divide-y">
					{course.exams.map((exam) => (
						<ExamRow
							key={exam.id}
							exam={exam}
							studentCount={course.studentCount}
							classCourseId={course.classCourseId}
							isExpanded={expandedExam === exam.id}
							onToggle={() => toggle(exam.id)}
						/>
					))}
				</div>
			)}

			{pendingAction && (
				<div className="flex items-center gap-2 border-t bg-amber-50/50 px-4 py-2 text-amber-700 text-xs dark:bg-amber-900/10 dark:text-amber-400">
					<AlertCircle className="h-3.5 w-3.5 shrink-0" />
					Action requise sur cet examen
				</div>
			)}
		</div>
	);
}

// ─── TeacherHub ──────────────────────────────────────────────────────────────

export default function TeacherHub({
	basePath = "/teacher",
}: {
	basePath?: string;
}) {
	const { user } = useStore();
	const teacherProfileId = user?.domainProfiles?.[0]?.id;

	const { data: coursesData, isLoading } = useQuery({
		queryKey: ["teacher-hub-courses", teacherProfileId],
		enabled: !!teacherProfileId,
		queryFn: async (): Promise<CourseData[]> => {
			const [{ items: years }, { items: classCourses }] = await Promise.all([
				trpcClient.academicYears.list.query({}),
				trpcClient.classCourses.list.query({
					teacherId: teacherProfileId,
					limit: 200,
				}),
			]);

			const activeYear = years.find((y) => y.isActive);
			if (!activeYear || !classCourses.length) return [];

			// Parallel fetch for all class courses
			const enriched = await Promise.all(
				classCourses.map(async (cc) => {
					const [klass, course, { items: exams }, { items: students }] =
						await Promise.all([
							trpcClient.classes.getById.query({ id: cc.class }),
							trpcClient.courses.getById.query({ id: cc.course }),
							trpcClient.exams.list.query({ classCourseId: cc.id }),
							trpcClient.students.list.query({ classId: cc.class }),
						]);

					if (klass.academicYear !== activeYear.id) return null;

					const program = await trpcClient.programs.getById.query({
						id: klass.program,
					});

					return {
						classCourseId: cc.id,
						courseName: course.name,
						className: klass.name,
						programName: program.name,
						studentCount: students.length,
						isDelegated: cc.isDelegated ?? false,
						exams: exams.map((e) => ({
							id: e.id,
							name: e.name,
							type: e.type,
							date: e.date,
							percentage: Number(e.percentage),
							isLocked: e.isLocked,
							status: (e as any).status ?? (e.isLocked ? "locked" : "open"),
							canEdit: (e as any).canEdit ?? true,
							classCourseId: cc.id,
						})),
					} satisfies CourseData;
				}),
			);

			return enriched.filter((c): c is CourseData => c !== null);
		},
	});

	const courses = coursesData ?? [];

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8 text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Mes cours & notes"
				description="Saisie des notes, verrouillage et soumission par cours"
			/>

			{courses.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<BookOpen className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground">Aucun cours assigné</p>
						<p className="text-muted-foreground text-sm">
							Vous n'avez aucun cours pour l'année académique en cours.
						</p>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					{courses.map((course) => (
						<TeacherCourseCard key={course.classCourseId} course={course} />
					))}
				</div>
			)}
		</div>
	);
}
