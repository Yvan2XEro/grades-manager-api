import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowUpDown,
	BookOpen,
	Check,
	Eye,
	Lock,
	Search,
	Send,
	Users,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { examStatusVariant } from "@/lib/exam-status";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
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

type SortBy = "relevance" | "name" | "class";

function coursePriority(course: CourseData): number {
	if (course.exams.length === 0) return 4;
	const hasAction = course.exams.some(
		(e) =>
			e.status === "locked" ||
			(!e.isLocked && !["approved", "submitted"].includes(e.status)),
	);
	if (hasAction) return 0;
	if (course.exams.some((e) => e.status === "submitted")) return 1;
	if (course.exams.some((e) => e.status === "approved")) return 2;
	return 3;
}

// ─── Compact Exam Row ─────────────────────────────────────────────────────────

function CompactExamRow({
	exam,
	studentCount,
	classCourseId,
	basePath,
}: {
	exam: ExamData;
	studentCount: number;
	classCourseId: string;
	basePath: string;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
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
			queryClient.invalidateQueries({ queryKey: ["teacher-hub-courses"] });
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
	const allGraded = graded >= studentCount && studentCount > 0;
	const canEnter = !exam.isLocked && ["draft", "open"].includes(exam.status);
	const canSubmit =
		(exam.isLocked && ["draft", "open"].includes(exam.status)) ||
		exam.status === "locked";

	const goToGradeEntry = () => navigate(`${basePath}/grades/${classCourseId}`);

	const actionButton = () => {
		if (canSubmit)
			return (
				<Button
					size="sm"
					className="h-7 px-2.5 text-xs"
					onClick={() => submitMutation.mutate()}
					disabled={submitMutation.isPending}
				>
					<Send className="mr-1 h-3 w-3" />
					Soumettre
				</Button>
			);
		if (canEnter)
			return (
				<Button
					size="sm"
					variant="outline"
					className="h-7 px-2.5 text-xs"
					onClick={goToGradeEntry}
				>
					Saisir
				</Button>
			);
		return (
			<Button
				size="sm"
				variant="ghost"
				className="h-7 px-2.5 text-muted-foreground text-xs"
				onClick={goToGradeEntry}
			>
				<Eye className="mr-1 h-3 w-3" />
				Voir
			</Button>
		);
	};

	return (
		<div className="flex items-center gap-3 px-4 py-2.5 text-sm">
			<div className="min-w-0 flex-1">
				<span className="font-medium text-foreground text-xs">{exam.name}</span>
				<span className="ml-1 text-muted-foreground text-xs">
					{exam.percentage}%
				</span>
			</div>

			<div className="flex w-14 shrink-0 items-center gap-1">
				<span
					className={cn(
						"font-mono text-xs tabular-nums",
						allGraded
							? "text-emerald-600 dark:text-emerald-400"
							: "text-muted-foreground",
					)}
				>
					{graded}/{studentCount}
				</span>
				{allGraded && <Check className="h-3 w-3 text-emerald-500" />}
			</div>

			<span className="w-14 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
				{avg ? `moy ${avg}` : ""}
			</span>

			<div className="flex shrink-0 items-center gap-2">
				{exam.isLocked && (
					<Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
				)}
				<Badge
					variant={examStatusVariant(exam.status)}
					className="hidden text-xs sm:flex"
				>
					{exam.status}
				</Badge>
				{actionButton()}
			</div>
		</div>
	);
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function TeacherCourseCard({
	course,
	basePath,
}: {
	course: CourseData;
	basePath: string;
}) {
	const hasPendingAction = course.exams.some(
		(e) =>
			e.status === "locked" ||
			(!e.isLocked && !["approved", "submitted"].includes(e.status)),
	);

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<div className="flex items-start justify-between border-b bg-muted/30 px-4 py-3">
				<div className="flex items-start gap-3">
					<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
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
				<div className="flex shrink-0 items-center gap-2 text-muted-foreground text-xs">
					<Users className="h-3.5 w-3.5" />
					<span>{course.studentCount}</span>
					{hasPendingAction && (
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
							<AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
						</span>
					)}
				</div>
			</div>

			{course.exams.length === 0 ? (
				<p className="px-4 py-5 text-center text-muted-foreground text-sm">
					Aucun examen pour ce cours
				</p>
			) : (
				<div className="divide-y">
					{course.exams.map((exam) => (
						<CompactExamRow
							key={exam.id}
							exam={exam}
							studentCount={course.studentCount}
							classCourseId={course.classCourseId}
							basePath={basePath}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ─── TeacherHub ───────────────────────────────────────────────────────────────

export default function TeacherHub({
	basePath = "/teacher",
}: {
	basePath?: string;
}) {
	const [search, setSearch] = useState("");
	const [filterAction, setFilterAction] = useState(false);
	const [sortBy, setSortBy] = useState<SortBy>("relevance");

	const { data: coursesData, isLoading } = useQuery({
		queryKey: ["teacher-hub-courses", basePath],
		queryFn: () => trpcClient.classCourses.teacherOverview.query(),
	});

	const courses = coursesData ?? [];

	const actionCount = useMemo(
		() =>
			courses.filter((c) =>
				c.exams.some(
					(e) =>
						e.status === "locked" ||
						(!e.isLocked && !["approved", "submitted"].includes(e.status)),
				),
			).length,
		[courses],
	);

	const filteredCourses = useMemo(() => {
		let list = [...courses];
		if (search) {
			const q = search.toLowerCase();
			list = list.filter(
				(c) =>
					c.courseName.toLowerCase().includes(q) ||
					c.className.toLowerCase().includes(q) ||
					c.programName.toLowerCase().includes(q),
			);
		}
		if (filterAction) {
			list = list.filter((c) =>
				c.exams.some(
					(e) =>
						e.status === "locked" ||
						(!e.isLocked && !["approved", "submitted"].includes(e.status)),
				),
			);
		}
		if (sortBy === "relevance") {
			list.sort((a, b) => coursePriority(a) - coursePriority(b));
		} else if (sortBy === "name") {
			list.sort((a, b) => a.courseName.localeCompare(b.courseName));
		} else if (sortBy === "class") {
			list.sort((a, b) => a.className.localeCompare(b.className));
		}
		return list;
	}, [courses, search, filterAction, sortBy]);

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
				<>
					{/* Filter bar */}
					<div className="flex flex-wrap items-center gap-3">
						<div className="relative min-w-[200px] flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Rechercher un cours ou une classe…"
								className="pl-9"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground transition-colors hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>

						<Button
							variant={filterAction ? "default" : "outline"}
							size="sm"
							onClick={() => setFilterAction((v) => !v)}
							className="shrink-0 gap-2"
						>
							<AlertCircle className="h-4 w-4" />
							Action requise
							{actionCount > 0 && (
								<span
									className={cn(
										"rounded-full px-1.5 py-0.5 font-bold text-xs",
										filterAction
											? "bg-white/20 text-white"
											: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
									)}
								>
									{actionCount}
								</span>
							)}
						</Button>

						<Select
							value={sortBy}
							onValueChange={(v) => setSortBy(v as SortBy)}
						>
							<SelectTrigger className="h-9 w-auto shrink-0 gap-2 text-sm">
								<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								<SelectItem value="relevance">Pertinence</SelectItem>
								<SelectItem value="name">Nom A→Z</SelectItem>
								<SelectItem value="class">Classe</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Course grid */}
					{filteredCourses.length === 0 ? (
						<div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
							Aucun cours ne correspond à votre recherche.
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2">
							{filteredCourses.map((course) => (
								<TeacherCourseCard
									key={course.classCourseId}
									course={course}
									basePath={basePath}
								/>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
