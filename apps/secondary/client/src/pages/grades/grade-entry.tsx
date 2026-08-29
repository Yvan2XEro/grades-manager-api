import {
	AlertTriangle,
	BookOpen,
	Check,
	CheckCircle,
	ChevronsUpDown,
	Download,
	GraduationCap,
	LayoutGrid,
	Loader2,
	Save,
	Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PillCombobox } from "@/components/ui/combobox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const ALL_ASSESSMENT_TYPES = [
	{ value: "sequence_1", label: "Seq. 1", termNumbers: [1] },
	{ value: "sequence_2", label: "Seq. 2", termNumbers: [1] },
	{ value: "sequence_3", label: "Seq. 3", termNumbers: [2] },
	{ value: "sequence_4", label: "Seq. 4", termNumbers: [2] },
	{ value: "sequence_5", label: "Seq. 5", termNumbers: [3] },
	{ value: "sequence_6", label: "Seq. 6", termNumbers: [3] },
	{ value: "end_of_term_exam", label: "Exam", termNumbers: [1, 2, 3] },
	{ value: "class_test", label: "Class Test", termNumbers: [1, 2, 3] },
	{ value: "quiz", label: "Quiz", termNumbers: [1, 2, 3] },
];

function assessmentLabel(value: string) {
	return ALL_ASSESSMENT_TYPES.find((a) => a.value === value)?.label ?? value;
}

const AVATAR_PALETTE = [
	"bg-blue-500",
	"bg-emerald-500",
	"bg-violet-500",
	"bg-orange-500",
	"bg-pink-500",
	"bg-teal-500",
	"bg-indigo-500",
	"bg-rose-500",
	"bg-amber-600",
	"bg-cyan-500",
];

function avatarBg(seed: string): string {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
	return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function getInitials(first: string, last: string): string {
	return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

function gradeClass(v: number): string {
	return v >= 10
		? "text-emerald-600 dark:text-emerald-400"
		: "text-rose-600 dark:text-rose-400";
}

function gradeBadgeClass(v: number): string {
	return v >= 10
		? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
		: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400";
}

function gradeInputClass(v: number): string {
	return v >= 10
		? "border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
		: "border-rose-200 bg-rose-50/50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-400";
}

function timeAgo(date: Date): string {
	const secs = Math.floor((Date.now() - date.getTime()) / 1000);
	if (secs < 60) return "just now";
	if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
	return `${Math.floor(secs / 3600)} h ago`;
}

export function GradeEntry() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	useBreadcrumbs([{ label: t("grades.title", "Grade entry") }]);

	const [subjectOpen, setSubjectOpen] = useState(false);
	const [savedAt, setSavedAt] = useState<Date | null>(null);
	const [savedAgoText, setSavedAgoText] = useState("");
	const [grades, setGrades] = useState<Record<string, string>>({});
	const [originalGrades, setOriginalGrades] = useState<Record<string, string>>(
		{},
	);
	const [pendingType, setPendingType] = useState<string | null>(null);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const classId = searchParams.get("classId") ?? "";
	const subjectId = searchParams.get("subjectId") ?? "";
	const termId = searchParams.get("termId") ?? "";
	const assessmentType = searchParams.get("assessmentType") ?? "sequence_1";

	const setParam = (key: string, val: string, clearKeys?: string[]) =>
		setSearchParams((prev) => {
			const n = new URLSearchParams(prev);
			n.set(key, val);
			for (const k of clearKeys ?? []) n.delete(k);
			return n;
		});

	const { data: classesData } = trpc.classes.list.useQuery({ pageSize: 200 });
	const allClasses = classesData?.items ?? [];
	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);

	// Teacher scoping: fetch only this user's own assignments
	const { data: myAssignments = [] } =
		trpc.subjectAssignments.listMine.useQuery(
			{ academicYearId: activeYear?.id ?? "" },
			{ enabled: !!activeYear?.id },
		);
	const isTeacherScoped = myAssignments.length > 0;
	const teacherClassIds = useMemo(
		() => new Set(myAssignments.map((a) => a.assignment.classId)),
		[myAssignments],
	);
	const classes = useMemo(
		() =>
			isTeacherScoped
				? allClasses.filter((c) => teacherClassIds.has(c.id))
				: allClasses,
		[isTeacherScoped, allClasses, teacherClassIds],
	);

	// All assignments for the class (used only when not teacher-scoped, i.e., admin)
	const { data: classAssignmentsAll = [] } =
		trpc.subjectAssignments.list.useQuery(
			{ classId, academicYearId: activeYear?.id ?? "" },
			{ enabled: !!classId && !!activeYear?.id && !isTeacherScoped },
		);
	const classAssignments = useMemo(
		() =>
			isTeacherScoped
				? myAssignments.filter((a) => a.assignment.classId === classId)
				: classAssignmentsAll,
		[isTeacherScoped, myAssignments, classAssignmentsAll, classId],
	);
	const classSubjectOptions = useMemo(
		() =>
			classAssignments.map((a) => ({
				value: a.subject.id,
				label: a.subject.name,
			})),
		[classAssignments],
	);

	const { data: enrollmentsData, isFetching: enrollmentsFetching } =
		trpc.enrollments.list.useQuery(
			{ academicYearId: activeYear?.id ?? "", classId, pageSize: 200 },
			{ enabled: !!classId && !!activeYear?.id },
		);
	const enrollments = enrollmentsData?.items ?? [];

	const canQuery = !!classId && !!subjectId && !!termId;
	const { data: assessmentsData, isFetching: assessmentsFetching } =
		trpc.assessments.listForClass.useQuery(
			{ classId, subjectId, termId },
			{ enabled: canQuery },
		);

	// Load grades from fetched data
	useEffect(() => {
		if (!assessmentsData) return;
		const loaded: Record<string, string> = {};
		for (const a of assessmentsData) {
			if (a.assessmentType !== assessmentType) continue;
			if (a.value !== null && a.value !== undefined) {
				loaded[a.studentId] = String(a.value);
			}
		}
		setGrades(loaded);
		setOriginalGrades(loaded);
	}, [assessmentsData, assessmentType]);

	// Reset when context changes
	useEffect(() => {
		setGrades({});
		setOriginalGrades({});
	}, [classId, subjectId, termId]);

	const batchUpsert = trpc.assessments.batchUpsert.useMutation({
		onSuccess: () => {
			const now = new Date();
			setSavedAt(now);
			setSavedAgoText(timeAgo(now));
			setOriginalGrades({ ...grades });
		},
	});

	// Update "saved ago" display every 30s
	useEffect(() => {
		if (!savedAt) return;
		const id = setInterval(() => setSavedAgoText(timeAgo(savedAt)), 30_000);
		return () => clearInterval(id);
	}, [savedAt]);

	const changeCount = Object.keys({ ...grades, ...originalGrades }).filter(
		(id) => (grades[id] ?? "") !== (originalGrades[id] ?? ""),
	).length;

	const currentSubject = classAssignments.find(
		(a) => a.subject.id === subjectId,
	)?.subject;
	const currentAssignment = classAssignments.find(
		(a) => a.subject.id === subjectId,
	)?.assignment;
	const _currentClass = classes.find((c) => c.id === classId);
	const currentTerm = terms.find((trm) => trm.id === termId);
	const canSave = !!classId && !!subjectId && !!termId;

	const availableAssessmentTypes = useMemo(() => {
		if (!currentTerm) return ALL_ASSESSMENT_TYPES;
		return ALL_ASSESSMENT_TYPES.filter((a) =>
			a.termNumbers.includes(currentTerm.termNumber),
		);
	}, [currentTerm]);

	// Sequence columns for current term (for reference data)
	const termSeqTypes = useMemo(() => {
		if (!currentTerm) return [];
		return ALL_ASSESSMENT_TYPES.filter(
			(a) =>
				a.termNumbers.length === 1 &&
				a.termNumbers[0] === currentTerm.termNumber,
		);
	}, [currentTerm]);

	const refSeqTypes = useMemo(
		() => termSeqTypes.filter((s) => s.value !== assessmentType),
		[termSeqTypes, assessmentType],
	);

	// Auto-clear assessmentType when invalid for selected term
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!currentTerm) return;
		if (!availableAssessmentTypes.find((a) => a.value === assessmentType)) {
			const first = availableAssessmentTypes[0];
			if (first) setParam("assessmentType", first.value);
		}
	}, [currentTerm?.termNumber]);

	useEffect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (changeCount > 0) {
				e.preventDefault();
				e.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [changeCount]);

	const handleSave = () => {
		if (!classId || !subjectId || !termId) return;
		const items = enrollments.flatMap((e) => {
			const student = e.student;
			if (!student) return [];
			const raw = grades[student.id];
			const value =
				raw !== undefined && raw !== "" ? Number.parseFloat(raw) : null;
			return [
				{
					studentId: student.id,
					classId,
					subjectId,
					termId,
					assessmentType,
					value,
				},
			];
		});
		if (items.length === 0) return;
		batchUpsert.mutate({ items });
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number,
	) => {
		if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
			e.preventDefault();
			inputRefs.current[index + 1]?.focus();
		} else if (e.key === "Tab" && e.shiftKey) {
			e.preventDefault();
			inputRefs.current[index - 1]?.focus();
		} else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			if (changeCount > 0 && canSave) handleSave();
		}
	};

	const isLoading = enrollmentsFetching || assessmentsFetching;

	// Get historical grade for a student from assessmentsData
	const getHistGrade = (studentId: string, aType: string): number | null => {
		const found = assessmentsData?.find(
			(x) => x.studentId === studentId && x.assessmentType === aType,
		);
		return found?.value !== null && found?.value !== undefined
			? Number(found.value)
			: null;
	};

	// Stats
	const gradeValues = Object.values(grades)
		.map((v) => Number.parseFloat(v))
		.filter((v) => !Number.isNaN(v) && v >= 0 && v <= 20);
	const statsCount = gradeValues.length;
	const statsAvg =
		statsCount > 0 ? gradeValues.reduce((a, b) => a + b, 0) / statsCount : null;
	const statsMin = statsCount > 0 ? Math.min(...gradeValues) : null;
	const statsMax = statsCount > 0 ? Math.max(...gradeValues) : null;

	const missingCount = canSave
		? enrollments.filter((e) => !(grades[e.student?.id ?? ""] ?? "")).length
		: 0;

	// Term avg per student (memoized)
	const termAvgByStudent = useMemo(() => {
		const result: Record<string, number | null> = {};
		for (const e of enrollments) {
			const student = e.student;
			if (!student) continue;
			const vals = termSeqTypes
				.map((s) => {
					if (s.value === assessmentType) {
						const raw = grades[student.id];
						return raw !== undefined && raw !== ""
							? Number.parseFloat(raw)
							: null;
					}
					return getHistGrade(student.id, s.value);
				})
				.filter((v): v is number => v !== null && !Number.isNaN(v));
			result[student.id] =
				vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
		}
		return result;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enrollments, grades, assessmentsData, termSeqTypes, assessmentType]);

	// Class averages for reference sequences (footer)
	const refSeqClassAvgs = useMemo(
		() =>
			refSeqTypes.map((s) => {
				if (!assessmentsData) return null;
				const vals = assessmentsData
					.filter((a) => a.assessmentType === s.value && a.value !== null)
					.map((a) => Number(a.value));
				return vals.length > 0
					? vals.reduce((a, b) => a + b, 0) / vals.length
					: null;
			}),
		[refSeqTypes, assessmentsData],
	);

	const classTermAvg = useMemo(() => {
		const vals = Object.values(termAvgByStudent).filter(
			(v): v is number => v !== null,
		);
		return vals.length > 0
			? vals.reduce((a, b) => a + b, 0) / vals.length
			: null;
	}, [termAvgByStudent]);

	// Coefficient from assignment
	const coeff = (
		currentAssignment as { coefficient?: number | null } | undefined
	)?.coefficient;

	const colCount =
		4 + refSeqTypes.length + (termSeqTypes.length > 0 ? 1 : 0) + 1;

	return (
		<div className="flex flex-col gap-4">
			{/* Unsaved changes modal */}
			{pendingType && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
						<div className="flex items-start gap-3">
							<AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
							<div>
								<p className="font-semibold text-foreground">
									{t("grades.switch_type_title", "Unsaved changes")}
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{t(
										"grades.switch_type_body",
										"You have {{count}} unsaved change(s). Switch assessment type and lose them?",
										{ count: changeCount },
									)}
								</p>
							</div>
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPendingType(null)}
							>
								{t("grades.unsaved_stay", "Stay")}
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => {
									setParam("assessmentType", pendingType);
									setPendingType(null);
								}}
							>
								{t("grades.switch_anyway", "Switch anyway")}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* ─── Toolbar ─────────────────────────────────────────────────────
			     Workflow order (left → right): Class → Subject → Term → Sequence
			     ────────────────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
				{/* 1. Class selector — must come first to enable subject list */}
				<PillCombobox
					options={classes.map((c) => ({ value: c.id, label: c.name }))}
					value={classId}
					onValueChange={(v) => setParam("classId", v, ["subjectId"])}
					placeholder={t("grades.select_class", "Class…")}
				/>

				{/* 2. Subject selector — searchable pill matching other selectors */}
				<Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							disabled={!classId}
							className={cn(
								"inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 font-medium text-xs transition-colors",
								classId
									? "cursor-pointer bg-muted/50 hover:bg-muted"
									: "cursor-not-allowed bg-muted/20 opacity-50",
								subjectId ? "text-foreground" : "text-muted-foreground",
							)}
						>
							<BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
							<span className="max-w-[160px] truncate">
								{currentSubject?.name ??
									(classId
										? t("grades.select_subject", "Subject…")
										: t("grades.select_class_first", "Select class first"))}
							</span>
							{coeff != null && (
								<span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-semibold text-[10px] text-primary">
									×{coeff}
								</span>
							)}
							<ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40" />
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-56 p-0" align="start">
						<Command>
							{classSubjectOptions.length > 7 && (
								<CommandInput placeholder={t("common.search", "Search…")} />
							)}
							<CommandList>
								<CommandEmpty>
									{t("common.no_results", "No results.")}
								</CommandEmpty>
								<CommandGroup>
									{classSubjectOptions.map((opt) => (
										<CommandItem
											key={opt.value}
											value={opt.label}
											onSelect={() => {
												setParam("subjectId", opt.value);
												setSubjectOpen(false);
											}}
											className="gap-2"
										>
											<Check
												className={cn(
													"h-4 w-4 shrink-0",
													subjectId === opt.value
														? "text-primary opacity-100"
														: "opacity-0",
												)}
											/>
											{opt.label}
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>

				<div className="h-5 w-px bg-border" />

				{/* 3. Term */}
				<PillCombobox
					options={terms.map((trm) => ({
						value: trm.id,
						label: t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`),
					}))}
					value={termId}
					onValueChange={(v) => setParam("termId", v)}
					placeholder={t("grades.select_term", "Term…")}
				/>

				{/* 4. Sequence */}
				<Select
					value={assessmentType}
					onValueChange={(val) => {
						if (changeCount > 0) setPendingType(val);
						else setParam("assessmentType", val);
					}}
				>
					<SelectTrigger className="h-8 w-auto min-w-[80px] rounded-full border-border bg-muted/50 font-medium text-xs">
						<SelectValue>{assessmentLabel(assessmentType)}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{availableAssessmentTypes.map((a) => (
							<SelectItem key={a.value} value={a.value}>
								{a.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="flex-1" />

				{/* Utility: Import / Export */}
				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-1.5 rounded-full"
					disabled
				>
					<Upload className="h-3.5 w-3.5" />
					{t("grades.import_csv", "Import CSV")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-1.5 rounded-full"
					disabled
				>
					<Download className="h-3.5 w-3.5" />
					{t("grades.export", "Export")}
				</Button>

				{/* Full grid view — only when class+subject+term are selected */}
				{canSave && (
					<Button
						asChild
						variant="outline"
						size="sm"
						className="h-8 gap-1.5 rounded-full"
					>
						<Link to={`/grades/${classId}/${subjectId}/${termId}`}>
							<LayoutGrid className="h-3.5 w-3.5" />
							{t("grades.full_grid", "Full grid")}
						</Link>
					</Button>
				)}

				<div className="h-5 w-px bg-border" />

				{/* Missing badge */}
				{canSave && missingCount > 0 && (
					<span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
						{missingCount} {t("grades.missing", "missing")}
					</span>
				)}

				{/* Save */}
				<Button
					size="sm"
					onClick={handleSave}
					disabled={batchUpsert.isPending || changeCount === 0 || !canSave}
					className={cn(
						"gap-1.5",
						savedAt && changeCount === 0 && !batchUpsert.isPending
							? "bg-emerald-600 text-white hover:bg-emerald-700"
							: "",
					)}
				>
					{batchUpsert.isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : savedAt && changeCount === 0 ? (
						<CheckCircle className="h-3.5 w-3.5" />
					) : (
						<Save className="h-3.5 w-3.5" />
					)}
					{savedAt && changeCount === 0
						? t("grades.saved", "Saved!")
						: changeCount > 0
							? `${t("grades.save", "Save")} (${changeCount})`
							: t("grades.save", "Save")}
				</Button>
			</div>

			{/* Empty state */}
			{!canSave && (
				<div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
					<GraduationCap className="h-12 w-12 opacity-20" />
					<p className="font-medium">
						{t(
							"grades.select_all",
							"Select a class, subject and term to begin",
						)}
					</p>
				</div>
			)}

			{/* Grade table */}
			{canSave && (
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="w-10 px-3 py-2.5 text-center font-medium text-muted-foreground text-xs">
									#
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">
									{t("grades.col_student", "Student")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
									{t("grades.col_reg", "Reg. #")}
								</th>
								<th className="min-w-[160px] px-4 py-2.5 text-center">
									<span className="font-medium text-xs uppercase tracking-wide">
										{t("grades.col_grade", "Grade /20")}
									</span>
									{currentSubject && (
										<span className="ml-1 font-normal text-muted-foreground text-xs">
											· {currentSubject.name} ·{" "}
											{assessmentLabel(assessmentType)}
										</span>
									)}
								</th>
								{refSeqTypes.map((s) => (
									<th
										key={s.value}
										className="px-4 py-2.5 text-center font-medium text-muted-foreground/70 text-xs uppercase tracking-wide"
									>
										{s.label}
									</th>
								))}
								{termSeqTypes.length > 0 && (
									<th className="px-4 py-2.5 text-center font-medium text-xs uppercase tracking-wide">
										T{currentTerm?.termNumber ?? ""}{" "}
										{t("grades.col_avg", "AVG")}
									</th>
								)}
								<th className="px-4 py-2.5 text-center font-medium text-muted-foreground/60 text-xs uppercase tracking-wide">
									{t("grades.col_notes", "Notes")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{isLoading ? (
								Array.from({ length: 8 }, (_, i) => (
									<tr
										key={i}
										className={cn(
											"animate-pulse",
											i % 2 === 1 && "bg-muted/15",
										)}
									>
										<td className="px-3 py-3 text-center">
											<div className="mx-auto h-3 w-5 rounded bg-muted" />
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2.5">
												<div className="h-8 w-8 rounded-full bg-muted" />
												<div className="h-3 w-32 rounded bg-muted" />
											</div>
										</td>
										<td className="px-4 py-3">
											<div className="h-3 w-20 rounded bg-muted" />
										</td>
										<td className="px-4 py-3">
											<div className="mx-auto h-8 w-28 rounded bg-muted" />
										</td>
										{refSeqTypes.map((s) => (
											<td key={s.value} className="px-4 py-3">
												<div className="mx-auto h-3 w-10 rounded bg-muted" />
											</td>
										))}
										{termSeqTypes.length > 0 && (
											<td className="px-4 py-3">
												<div className="mx-auto h-3 w-12 rounded bg-muted" />
											</td>
										)}
										<td className="px-4 py-3">
											<div className="mx-auto h-3 w-4 rounded bg-muted" />
										</td>
									</tr>
								))
							) : enrollments.length === 0 ? (
								<tr>
									<td
										colSpan={colCount}
										className="px-4 py-10 text-center text-muted-foreground"
									>
										<div className="flex flex-col items-center gap-2">
											<GraduationCap className="h-8 w-8 opacity-30" />
											<p>
												{t("grades.no_students", "No students in this class")}
											</p>
										</div>
									</td>
								</tr>
							) : (
								<>
									{enrollments.map((e, index) => {
										const student = e.student;
										if (!student) return null;
										const currentVal = grades[student.id] ?? "";
										const isDirty =
											currentVal !== (originalGrades[student.id] ?? "");
										const numVal =
											currentVal !== "" ? Number.parseFloat(currentVal) : null;
										const isMissing = currentVal === "";
										const termAvg = termAvgByStudent[student.id] ?? null;

										return (
											<tr
												key={student.id}
												className={cn(
													"transition-colors hover:bg-muted/20",
													index % 2 === 1 &&
														"bg-black/[0.04] dark:bg-white/[0.05]",
												)}
											>
												{/* Row number */}
												<td className="px-3 py-2.5 text-center text-muted-foreground text-xs tabular-nums">
													{index + 1}
												</td>

												{/* Student: avatar + name */}
												<td className="px-4 py-2.5">
													<div className="flex items-center gap-2.5">
														<div
															className={cn(
																"flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white text-xs",
																avatarBg(
																	`${student.firstName}${student.lastName}`,
																),
															)}
														>
															{getInitials(student.firstName, student.lastName)}
														</div>
														<span className="font-medium text-foreground">
															{student.lastName} {student.firstName}
														</span>
													</div>
												</td>

												{/* Registration number */}
												<td className="px-4 py-2.5">
													<span className="font-mono text-muted-foreground text-xs">
														{(student as { registrationNumber?: string | null })
															.registrationNumber ?? "—"}
													</span>
												</td>

												{/* Grade input */}
												<td className="px-4 py-2.5">
													<div className="flex justify-center">
														<Input
															ref={(el) => {
																inputRefs.current[index] = el;
															}}
															type="number"
															min="0"
															max="20"
															step="any"
															placeholder="—"
															value={currentVal}
															onChange={(ev) =>
																setGrades((prev) => ({
																	...prev,
																	[student.id]: ev.target.value,
																}))
															}
															onKeyDown={(ev) => handleKeyDown(ev, index)}
															className={cn(
																"w-28 text-center font-mono font-semibold text-base",
																isMissing
																	? "border-destructive/40 border-dashed text-muted-foreground/40 placeholder:text-destructive/30"
																	: numVal !== null
																		? gradeInputClass(numVal)
																		: "",
																isDirty && "ring-2 ring-amber-400/60",
															)}
														/>
													</div>
												</td>

												{/* Reference sequence columns (read-only) */}
												{refSeqTypes.map((s) => {
													const hg = getHistGrade(student.id, s.value);
													return (
														<td
															key={s.value}
															className="px-4 py-2.5 text-center"
														>
															{hg !== null ? (
																<span
																	className={cn(
																		"text-sm tabular-nums",
																		gradeClass(hg),
																	)}
																>
																	{hg}
																</span>
															) : (
																<span className="text-muted-foreground/40 text-sm">
																	—
																</span>
															)}
														</td>
													);
												})}

												{/* Term average */}
												{termSeqTypes.length > 0 && (
													<td className="px-4 py-2.5 text-center">
														{termAvg !== null ? (
															<span
																className={cn(
																	"inline-flex items-center rounded-md px-2 py-0.5 font-semibold text-sm tabular-nums",
																	gradeBadgeClass(termAvg),
																)}
															>
																{termAvg.toFixed(2)}
															</span>
														) : (
															<span className="text-muted-foreground/40 text-sm">
																—
															</span>
														)}
													</td>
												)}

												{/* Notes */}
												<td className="px-4 py-2.5 text-center text-muted-foreground/40 text-sm">
													—
												</td>
											</tr>
										);
									})}

									{/* Class average footer row */}
									<tr className="border-border border-t-2 bg-muted/40 font-semibold">
										<td />
										<td
											colSpan={2}
											className="px-4 py-2.5 text-muted-foreground text-xs uppercase tracking-wide"
										>
											{t("grades.class_average", "Class average")}
										</td>
										<td className="px-4 py-2.5 text-center">
											{statsAvg !== null ? (
												<span
													className={cn(
														"text-sm tabular-nums",
														gradeClass(statsAvg),
													)}
												>
													{statsAvg.toFixed(2)}
												</span>
											) : (
												<span className="text-muted-foreground/40">—</span>
											)}
										</td>
										{refSeqClassAvgs.map((avg, i) => (
											<td
												key={refSeqTypes[i]?.value}
												className="px-4 py-2.5 text-center"
											>
												{avg !== null ? (
													<span
														className={cn(
															"text-sm tabular-nums",
															gradeClass(avg),
														)}
													>
														{avg.toFixed(2)}
													</span>
												) : (
													<span className="text-muted-foreground/40">—</span>
												)}
											</td>
										))}
										{termSeqTypes.length > 0 && (
											<td className="px-4 py-2.5 text-center">
												{classTermAvg !== null ? (
													<span
														className={cn(
															"text-sm tabular-nums",
															gradeClass(classTermAvg),
														)}
													>
														{classTermAvg.toFixed(2)}
													</span>
												) : (
													<span className="text-muted-foreground/40">—</span>
												)}
											</td>
										)}
										<td />
									</tr>
								</>
							)}
						</tbody>
					</table>

					{/* Bottom status bar */}
					<div className="flex items-center justify-between border-border border-t bg-muted/20 px-4 py-2 text-muted-foreground text-xs">
						<span className="flex items-center gap-2">
							<span>
								<span className="font-semibold text-foreground tabular-nums">
									{enrollments.length}
								</span>{" "}
								{t("grades.students", "students")}
							</span>
							<span className="text-border">·</span>
							<span>
								<span className="font-semibold text-foreground tabular-nums">
									{statsCount}
								</span>{" "}
								{t("grades.graded", "graded")}
							</span>
							<span className="text-border">·</span>
							<span
								className={
									missingCount > 0
										? "font-semibold text-amber-600 dark:text-amber-400"
										: ""
								}
							>
								<span className="tabular-nums">{missingCount}</span>{" "}
								{t("grades.missing", "missing")}
							</span>
							{statsAvg !== null && (
								<>
									<span className="text-border">·</span>
									<span>
										{t("grades.class_avg_label", "Avg:")}{" "}
										<span
											className={cn(
												"font-semibold tabular-nums",
												gradeClass(statsAvg),
											)}
										>
											{statsAvg.toFixed(2)}
										</span>
									</span>
									<span className="text-border">·</span>
									<span>
										{t("grades.class_min_label", "Min:")}{" "}
										<span
											className={cn(
												"font-semibold tabular-nums",
												gradeClass(statsMin!),
											)}
										>
											{statsMin?.toFixed(2)}
										</span>
									</span>
									<span className="text-border">·</span>
									<span>
										{t("grades.class_max_label", "Max:")}{" "}
										<span
											className={cn(
												"font-semibold tabular-nums",
												gradeClass(statsMax!),
											)}
										>
											{statsMax?.toFixed(2)}
										</span>
									</span>
								</>
							)}
						</span>
						<span>
							{savedAt
								? `${t("grades.last_saved", "Last saved")} · ${savedAgoText}`
								: changeCount > 0
									? t("grades.unsaved_changes", "Unsaved changes")
									: ""}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
