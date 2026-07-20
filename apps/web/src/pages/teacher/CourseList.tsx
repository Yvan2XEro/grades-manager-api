import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	CircleDashed,
	ClipboardList,
	Filter,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "@/lib/toast";
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";

type Status = "no_exam" | "not_started" | "partial" | "complete";

interface Course {
	id: string;
	name: string;
	code: string;
	class_name: string;
	class_id: string;
	program_name: string;
	program_id: string | null;
	semester_id: string | null;
	teacher_id: string | null;
	teacher_label: string;
	student_count: number;
	exam_count: number;
	exam_types: string[];
	grades_posted: number;
	grades_expected: number;
	status: Status;
	isDelegated?: boolean;
}

const PAGE_SIZE = 12;

function deriveStatus(
	examCount: number,
	posted: number,
	expected: number,
): Status {
	if (examCount === 0) return "no_exam";
	if (expected === 0 || posted === 0) return "not_started";
	if (posted >= expected) return "complete";
	return "partial";
}

const STATUS_META: Record<
	Status,
	{
		labelKey: string;
		defaultLabel: string;
		variant: "default" | "secondary" | "destructive" | "outline";
		icon: typeof CheckCircle2;
	}
> = {
	no_exam: {
		labelKey: "teacher.courses.status.noExam",
		defaultLabel: "Aucun examen",
		variant: "outline",
		icon: XCircle,
	},
	not_started: {
		labelKey: "teacher.courses.status.notStarted",
		defaultLabel: "À saisir",
		variant: "destructive",
		icon: CircleDashed,
	},
	partial: {
		labelKey: "teacher.courses.status.partial",
		defaultLabel: "Partiel",
		variant: "secondary",
		icon: CircleDashed,
	},
	complete: {
		labelKey: "teacher.courses.status.complete",
		defaultLabel: "Complet",
		variant: "default",
		icon: CheckCircle2,
	},
};

export default function CourseList({
	basePath = "/teacher",
}: {
	basePath?: string;
}) {
	const { user } = useStore();
	const { t } = useTranslation();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);
	const [classFilter, setClassFilter] = useState<string>("__all__");
	const [semesterFilter, setSemesterFilter] = useState<string>("__all__");
	const [statusFilter, setStatusFilter] = useState<string>("__all__");
	const [examTypeFilter, setExamTypeFilter] = useState<string>("__all__");
	const [programFilter, setProgramFilter] = useState<string>("__all__");
	const [teacherFilter, setTeacherFilter] = useState<string>("__all__");
	const [delegationFilter, setDelegationFilter] = useState<string>("__all__"); // __all__ | mine | delegated
	const [page, setPage] = useState(0);

	// Reset page when any filter changes
	useEffect(() => {
		setPage(0);
	}, [
		debouncedSearch,
		classFilter,
		semesterFilter,
		statusFilter,
		examTypeFilter,
		programFilter,
		teacherFilter,
		delegationFilter,
	]);

	const semestersQuery = useQuery({
		queryKey: ["semesters", "all"],
		queryFn: async () => {
			const { items } = await trpcClient.semesters.list.query({ limit: 50 });
			return items;
		},
	});

	const examTypesCatalogQuery = useQuery({
		queryKey: ["examTypes", "catalog"],
		queryFn: async () => {
			const { items } = await trpcClient.examTypes.list.query({ limit: 100 });
			return items as Array<{ id: string; name: string }>;
		},
	});

	const {
		data: courses,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["teacherCourses", user?.id],
		queryFn: async (): Promise<Course[]> => {
			if (!user) return [];

			const { items: years } = await trpcClient.academicYears.list.query({});
			const activeYear = years.find((y) => y.isActive);
			if (!activeYear) return [];

			const { items } = await trpcClient.classCourses.list.query({
				academicYearId: activeYear.id,
				limit: 500,
			});

			return items.map((cc) => {
				const examCount = cc.examCount ?? 0;
				const posted = cc.gradesPosted ?? 0;
				const expected = cc.gradesExpected ?? 0;
				const teacherLabel = [cc.teacherFirstName, cc.teacherLastName]
					.filter(Boolean)
					.join(" ")
					.trim();
				return {
					id: cc.id,
					name: cc.courseName ?? "",
					code: cc.code,
					class_name: cc.className ?? "",
					class_id: cc.class,
					program_name: cc.programName ?? "",
					program_id: cc.programId ?? null,
					semester_id: cc.semesterId ?? null,
					teacher_id: cc.teacher ?? null,
					teacher_label: teacherLabel,
					student_count: cc.studentCount ?? 0,
					exam_count: examCount,
					exam_types: cc.examTypes ?? [],
					grades_posted: posted,
					grades_expected: expected,
					status: deriveStatus(examCount, posted, expected),
					isDelegated: cc.isDelegated,
				};
			});
		},
		enabled: !!user,
	});

	useEffect(() => {
		if (isError && error instanceof Error) {
			toast.error(error.message);
		}
	}, [isError, error]);

	// Derive distinct classes from data for the class select
	const classOptions = useMemo(() => {
		if (!courses) return [];
		const map = new Map<string, string>();
		for (const c of courses) {
			if (c.class_id && !map.has(c.class_id)) {
				map.set(c.class_id, c.class_name);
			}
		}
		return Array.from(map.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [courses]);

	// Distinct exam types: catalog ∪ what's actually present in the data,
	// so the dropdown is always populated even when the catalog hasn't loaded.
	const examTypeOptions = useMemo(() => {
		const set = new Set<string>();
		for (const t of examTypesCatalogQuery.data ?? []) set.add(t.name);
		for (const c of courses ?? []) for (const t of c.exam_types) set.add(t);
		return Array.from(set).sort();
	}, [examTypesCatalogQuery.data, courses]);

	const programOptions = useMemo(() => {
		if (!courses) return [];
		const map = new Map<string, string>();
		for (const c of courses) {
			if (c.program_id && !map.has(c.program_id)) {
				map.set(c.program_id, c.program_name || c.program_id);
			}
		}
		return Array.from(map.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [courses]);

	const teacherOptions = useMemo(() => {
		if (!courses) return [];
		const map = new Map<string, string>();
		for (const c of courses) {
			if (c.teacher_id && c.teacher_label && !map.has(c.teacher_id)) {
				map.set(c.teacher_id, c.teacher_label);
			}
		}
		return Array.from(map.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [courses]);

	// Semester options vary with the selected class (when set) and otherwise
	// only show semesters that actually appear in the loaded data.
	const semesterOptions = useMemo(() => {
		const all = semestersQuery.data ?? [];
		if (!courses) return all;
		const allowed = new Set<string>();
		for (const c of courses) {
			if (classFilter !== "__all__" && c.class_id !== classFilter) continue;
			if (c.semester_id) allowed.add(c.semester_id);
		}
		return all.filter((s) => allowed.has(s.id));
	}, [semestersQuery.data, courses, classFilter]);

	// If the current semester filter is no longer in the allowed list, reset it.
	useEffect(() => {
		if (semesterFilter === "__all__") return;
		if (!semesterOptions.some((s) => s.id === semesterFilter)) {
			setSemesterFilter("__all__");
		}
	}, [semesterOptions, semesterFilter]);

	const filtered = useMemo(() => {
		if (!courses) return [];
		const q = debouncedSearch.trim().toLowerCase();
		return courses.filter((c) => {
			if (classFilter !== "__all__" && c.class_id !== classFilter) return false;
			if (programFilter !== "__all__" && c.program_id !== programFilter)
				return false;
			if (teacherFilter !== "__all__" && c.teacher_id !== teacherFilter)
				return false;
			if (semesterFilter !== "__all__" && c.semester_id !== semesterFilter)
				return false;
			if (statusFilter !== "__all__" && c.status !== statusFilter) return false;
			if (
				examTypeFilter !== "__all__" &&
				!c.exam_types.includes(examTypeFilter)
			)
				return false;
			if (delegationFilter === "mine" && c.isDelegated) return false;
			if (delegationFilter === "delegated" && !c.isDelegated) return false;
			if (q) {
				const hay =
					`${c.name} ${c.code} ${c.class_name} ${c.program_name} ${c.teacher_label}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [
		courses,
		debouncedSearch,
		classFilter,
		semesterFilter,
		statusFilter,
		examTypeFilter,
		programFilter,
		teacherFilter,
		delegationFilter,
	]);

	// Stats summary across the (filtered) set
	const summary = useMemo(() => {
		const s = {
			total: filtered.length,
			complete: 0,
			partial: 0,
			notStarted: 0,
			noExam: 0,
		};
		for (const c of filtered) {
			if (c.status === "complete") s.complete += 1;
			else if (c.status === "partial") s.partial += 1;
			else if (c.status === "not_started") s.notStarted += 1;
			else s.noExam += 1;
		}
		return s;
	}, [filtered]);

	const resetFilters = () => {
		setSearch("");
		setClassFilter("__all__");
		setSemesterFilter("__all__");
		setStatusFilter("__all__");
		setExamTypeFilter("__all__");
		setProgramFilter("__all__");
		setTeacherFilter("__all__");
		setDelegationFilter("__all__");
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-10 w-10 text-primary" />
			</div>
		);
	}

	const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
	const hasActiveFilters =
		!!debouncedSearch ||
		classFilter !== "__all__" ||
		semesterFilter !== "__all__" ||
		statusFilter !== "__all__" ||
		examTypeFilter !== "__all__" ||
		programFilter !== "__all__" ||
		teacherFilter !== "__all__" ||
		delegationFilter !== "__all__";

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-foreground">{t("teacher.courses.title")}</h2>
				<p className="text-muted-foreground">{t("teacher.courses.subtitle")}</p>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="flex flex-col gap-3 py-4">
					<div className="relative w-full">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("teacher.courses.searchPlaceholder", {
								defaultValue: "Rechercher un cours, classe ou programme…",
							})}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<Select value={classFilter} onValueChange={setClassFilter}>
							<SelectTrigger className="w-[200px]">
								<SelectValue
									placeholder={t("teacher.courses.filters.class", {
										defaultValue: "Classe",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									{t("teacher.courses.filters.allClasses", {
										defaultValue: "Toutes les classes",
									})}
								</SelectItem>
								{classOptions.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={programFilter} onValueChange={setProgramFilter}>
							<SelectTrigger className="w-[200px]">
								<SelectValue
									placeholder={t("teacher.courses.filters.program", {
										defaultValue: "Programme",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									{t("teacher.courses.filters.allPrograms", {
										defaultValue: "Tous programmes",
									})}
								</SelectItem>
								{programOptions.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={teacherFilter} onValueChange={setTeacherFilter}>
							<SelectTrigger className="w-[200px]">
								<SelectValue
									placeholder={t("teacher.courses.filters.teacher", {
										defaultValue: "Enseignant",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									{t("teacher.courses.filters.allTeachers", {
										defaultValue: "Tous enseignants",
									})}
								</SelectItem>
								{teacherOptions.map((tc) => (
									<SelectItem key={tc.id} value={tc.id}>
										{tc.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={semesterFilter} onValueChange={setSemesterFilter}>
							<SelectTrigger className="w-[160px]">
								<SelectValue
									placeholder={t("teacher.courses.filters.semester", {
										defaultValue: "Semestre",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									{t("teacher.courses.filters.allSemesters", {
										defaultValue: "Tous semestres",
									})}
								</SelectItem>
								{semesterOptions.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-[160px]">
								<SelectValue
									placeholder={t("teacher.courses.filters.status", {
										defaultValue: "Statut",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									{t("teacher.courses.filters.allStatuses", {
										defaultValue: "Tous statuts",
									})}
								</SelectItem>
								<SelectItem value="not_started">
									{STATUS_META.not_started.defaultLabel}
								</SelectItem>
								<SelectItem value="partial">
									{STATUS_META.partial.defaultLabel}
								</SelectItem>
								<SelectItem value="complete">
									{STATUS_META.complete.defaultLabel}
								</SelectItem>
								<SelectItem value="no_exam">
									{STATUS_META.no_exam.defaultLabel}
								</SelectItem>
							</SelectContent>
						</Select>
						<Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
							<SelectTrigger className="w-[160px]">
								<SelectValue
									placeholder={t("teacher.courses.filters.examType", {
										defaultValue: "Type d'examen",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									{t("teacher.courses.filters.allExamTypes", {
										defaultValue: "Tous types",
									})}
								</SelectItem>
								{examTypeOptions.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={delegationFilter}
							onValueChange={setDelegationFilter}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue
									placeholder={t("teacher.courses.filters.delegation", {
										defaultValue: "Affectation",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									{t("teacher.courses.filters.allDelegations", {
										defaultValue: "Tous",
									})}
								</SelectItem>
								<SelectItem value="mine">
									{t("teacher.courses.filters.mine", {
										defaultValue: "Mes cours",
									})}
								</SelectItem>
								<SelectItem value="delegated">
									{t("teacher.courses.filters.delegated", {
										defaultValue: "Délégués",
									})}
								</SelectItem>
							</SelectContent>
						</Select>
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={resetFilters}>
								<Filter className="mr-1 h-3.5 w-3.5" />
								{t("common.actions.reset", { defaultValue: "Réinitialiser" })}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Summary line */}
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<span className="text-muted-foreground">
					{t("teacher.courses.summary", {
						defaultValue: "{{n}} cours",
						n: summary.total,
					})}
				</span>
				{summary.complete > 0 && (
					<Badge variant="default" className="gap-1">
						<CheckCircle2 className="h-3 w-3" /> {summary.complete}{" "}
						{STATUS_META.complete.defaultLabel}
					</Badge>
				)}
				{summary.partial > 0 && (
					<Badge variant="secondary" className="gap-1">
						<CircleDashed className="h-3 w-3" /> {summary.partial}{" "}
						{STATUS_META.partial.defaultLabel}
					</Badge>
				)}
				{summary.notStarted > 0 && (
					<Badge variant="destructive" className="gap-1">
						<CircleDashed className="h-3 w-3" /> {summary.notStarted}{" "}
						{STATUS_META.not_started.defaultLabel}
					</Badge>
				)}
				{summary.noExam > 0 && (
					<Badge variant="outline" className="gap-1">
						<XCircle className="h-3 w-3" /> {summary.noExam}{" "}
						{STATUS_META.no_exam.defaultLabel}
					</Badge>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{visible.length ? (
					visible.map((course) => {
						const meta = STATUS_META[course.status];
						const Icon = meta.icon;
						const ratio = course.grades_expected
							? Math.round(
									(course.grades_posted / course.grades_expected) * 100,
								)
							: 0;
						return (
							<Card key={course.id} className="flex h-full flex-col">
								<CardHeader className="flex flex-col gap-2">
									<div className="flex w-full items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<CardTitle
												className="line-clamp-2 break-words"
												title={course.name}
											>
												{course.name}
											</CardTitle>
											<CardDescription
												className="line-clamp-2 break-words"
												title={`${course.class_name} • ${course.program_name}`}
											>
												{course.class_name} • {course.program_name}
											</CardDescription>
										</div>
										<div className="flex shrink-0 flex-col items-end gap-1">
											<Badge variant={meta.variant} className="gap-1">
												<Icon className="h-3 w-3" />
												{meta.defaultLabel}
											</Badge>
											{course.isDelegated && (
												<Badge variant="outline" className="text-[10px]">
													{t("teacher.courses.delegatedBadge", {
														defaultValue: "Délégué",
													})}
												</Badge>
											)}
										</div>
									</div>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col gap-3">
									<div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm">
										<div className="flex items-center gap-1.5">
											<Users className="h-4 w-4" />
											<span>{course.student_count}</span>
										</div>
										<div className="flex items-center gap-1.5">
											<ClipboardList className="h-4 w-4" />
											<span>{course.exam_count}</span>
										</div>
										<div className="font-medium text-foreground">
											{course.grades_posted} / {course.grades_expected}
										</div>
									</div>
									{/* Progress bar */}
									<div className="h-1.5 overflow-hidden rounded-full bg-muted">
										<div
											className={`h-full transition-all ${
												course.status === "complete"
													? "bg-green-500"
													: course.status === "partial"
														? "bg-amber-500"
														: course.status === "not_started"
															? "bg-red-400"
															: "bg-muted-foreground/30"
											}`}
											style={{ width: `${ratio}%` }}
										/>
									</div>
								</CardContent>
								<CardFooter className="justify-between gap-2">
									<span className="text-muted-foreground text-xs">
										{ratio}%
									</span>
									<div className="flex gap-1">
										<Button
											asChild
											variant="outline"
											size="sm"
											title={t("teacher.courses.actions.viewGrades")}
										>
											<Link to={`${basePath}/grades/${course.id}`}>
												{t("teacher.courses.actions.viewGrades", {
													defaultValue: "Détail",
												})}
											</Link>
										</Button>
										<Button asChild size="sm">
											<Link to={`${basePath}/grades/${course.id}/fast`}>
												{t("teacher.courses.actions.fastEntry", {
													defaultValue: "Saisie rapide",
												})}
											</Link>
										</Button>
									</div>
								</CardFooter>
							</Card>
						);
					})
				) : (
					<Card className="col-span-full">
						<CardContent className="flex flex-col items-center gap-3 py-10 text-center">
							<BookOpen className="h-14 w-14 text-muted-foreground/40" />
							<div>
								<p className="font-semibold text-lg">
									{hasActiveFilters
										? t("teacher.courses.noMatch", {
												defaultValue: "Aucun cours ne correspond aux filtres",
											})
										: t("teacher.courses.empty.title")}
								</p>
								<p className="text-muted-foreground text-xs">
									{hasActiveFilters
										? t("teacher.courses.noMatchHint", {
												defaultValue:
													"Essayez de réinitialiser ou modifier les filtres.",
											})
										: t("teacher.courses.empty.description")}
								</p>
							</div>
							{hasActiveFilters && (
								<Button variant="outline" size="sm" onClick={resetFilters}>
									{t("common.actions.reset", { defaultValue: "Réinitialiser" })}
								</Button>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{filtered.length > PAGE_SIZE && (
				<div className="flex items-center justify-end gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => p - 1)}
						disabled={page === 0}
					>
						<ChevronLeft className="mr-1 h-4 w-4" />
						{t("common.pagination.previous", { defaultValue: "Précédent" })}
					</Button>
					<span className="text-muted-foreground text-xs">
						{page + 1} / {Math.ceil(filtered.length / PAGE_SIZE)}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => p + 1)}
						disabled={(page + 1) * PAGE_SIZE >= filtered.length}
					>
						{t("common.pagination.next", { defaultValue: "Suivant" })}
						<ChevronRight className="ml-1 h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
