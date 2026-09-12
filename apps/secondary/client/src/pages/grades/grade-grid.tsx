import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle,
	GraduationCap,
	Loader2,
	MessageSquare,
	Save,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { errorToast } from "@/lib/error-toast";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { CommentsGridContent } from "./comments-grid";

// ─── Design helpers (mirrors grade-entry) ─────────────────────────────────────

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

function gradeColor(v: number): string {
	return v >= 10
		? "text-emerald-600 dark:text-emerald-400"
		: "text-rose-600 dark:text-rose-400";
}

function gradeBadgeCls(v: number): string {
	return v >= 10
		? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
		: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400";
}

function gradeInputCls(v: number): string {
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

// ─── Assessment type labels ────────────────────────────────────────────────────

const ASSESSMENT_LABELS: Record<string, string> = {
	sequence_1: "Seq. 1",
	sequence_2: "Seq. 2",
	sequence_3: "Seq. 3",
	sequence_4: "Seq. 4",
	sequence_5: "Seq. 5",
	sequence_6: "Seq. 6",
	end_of_term_exam: "Exam",
	class_test: "Class Test",
	quiz: "Quiz",
};

function aLabel(type: string) {
	return ASSESSMENT_LABELS[type] ?? type;
}

// ─── Unsaved warning dialog ────────────────────────────────────────────────────

function UnsavedDialog({
	open,
	onLeave,
	onStay,
}: {
	open: boolean;
	onLeave: () => void;
	onStay: () => void;
}) {
	const { t } = useTranslation();
	return (
		<Dialog open={open} onOpenChange={(v) => !v && onStay()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-amber-500" />
						{t("grades.unsaved_title", "Unsaved changes")}
					</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					{t(
						"grades.unsaved_body",
						"You have unsaved grade changes. If you leave now they will be lost.",
					)}
				</p>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="outline" onClick={onStay}>
						{t("grades.stay", "Stay and save")}
					</Button>
					<Button variant="destructive" onClick={onLeave}>
						{t("grades.discard", "Leave anyway")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GradeGrid() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { classId, subjectId, termId } = useParams<{
		classId: string;
		subjectId: string;
		termId: string;
	}>();

	useBreadcrumbs([
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
		{ label: t("grades.title", "Grade entry"), href: "/grades" },
		{ label: t("grades.grid_title", "Grade Sheet") },
	]);

	// grades[studentId][assessmentType] = value string
	const [grades, setGrades] = useState<Record<string, Record<string, string>>>(
		{},
	);
	const savedSnapshot = useRef<string>("{}");
	const [isDirty, setIsDirty] = useState(false);
	const [savedAt, setSavedAt] = useState<Date | null>(null);
	const [savedAgoText, setSavedAgoText] = useState("");
	const [pendingNavTo, setPendingNavTo] = useState<string | null>(null);
	const [showComments, setShowComments] = useState(false);

	// ── Queries ────────────────────────────────────────────────────────────────

	const { data: classData, isLoading: classLoading } =
		trpc.classes.get.useQuery({ id: classId! }, { enabled: !!classId });

	const { data: subjectsData, isLoading: subjectsLoading } =
		trpc.subjects.list.useQuery({ pageSize: 200 });
	const subject = subjectsData?.items?.find((s) => s.id === subjectId);

	const { data: years = [], isLoading: yearsLoading } =
		trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: terms = [], isLoading: termsLoading } =
		trpc.terms.list.useQuery(
			{ academicYearId: activeYear?.id ?? "" },
			{ enabled: !!activeYear?.id },
		);
	const term = terms.find((trm) => trm.id === termId);

	const { data: enrollmentsData, isLoading: enrollmentsLoading } =
		trpc.enrollments.list.useQuery(
			{
				academicYearId: activeYear?.id ?? "",
				classId: classId ?? "",
				pageSize: 200,
			},
			{ enabled: !!classId && !!activeYear?.id },
		);
	const enrollments = enrollmentsData?.items ?? [];

	const { data: existingAssessments = [], isLoading: assessmentsLoading } =
		trpc.assessments.listForClass.useQuery(
			{ classId: classId!, subjectId: subjectId!, termId: termId! },
			{ enabled: !!classId && !!subjectId && !!termId },
		);

	const isLoading =
		classLoading ||
		subjectsLoading ||
		yearsLoading ||
		termsLoading ||
		enrollmentsLoading ||
		assessmentsLoading;

	// Determine which columns to show
	const presentTypes = useMemo(
		() => Array.from(new Set(existingAssessments.map((a) => a.assessmentType))),
		[existingAssessments],
	);
	const activeTypes =
		presentTypes.length > 0 ? presentTypes : ["sequence_1", "sequence_2"];

	// Pre-fill grades
	useEffect(() => {
		if (existingAssessments.length === 0) return;
		const prefill: Record<string, Record<string, string>> = {};
		for (const a of existingAssessments) {
			if (!prefill[a.studentId]) prefill[a.studentId] = {};
			prefill[a.studentId][a.assessmentType] =
				a.value !== null ? String(a.value) : "";
		}
		setGrades((prev) => {
			const merged = { ...prev };
			for (const [sid, types] of Object.entries(prefill)) {
				if (!merged[sid]) merged[sid] = {};
				for (const [type, val] of Object.entries(types)) {
					if (merged[sid][type] === undefined) merged[sid][type] = val;
				}
			}
			return merged;
		});
		savedSnapshot.current = JSON.stringify(prefill);
		setIsDirty(false);
	}, [existingAssessments]);

	// ── Mutation ───────────────────────────────────────────────────────────────

	const batchUpsert = trpc.assessments.batchUpsert.useMutation({
		onSuccess: () => {
			const now = new Date();
			setSavedAt(now);
			setSavedAgoText(timeAgo(now));
			savedSnapshot.current = JSON.stringify(grades);
			setIsDirty(false);
		},
		onError: (err) => errorToast(err, t),
	});

	const handleSave = () => {
		if (!classId || !subjectId || !termId) return;
		const items: {
			studentId: string;
			classId: string;
			subjectId: string;
			termId: string;
			assessmentType: string;
			value: number | null;
		}[] = [];
		for (const e of enrollments) {
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
		setGrades((prev) => {
			const next = {
				...prev,
				[studentId]: { ...(prev[studentId] ?? {}), [type]: value },
			};
			setIsDirty(JSON.stringify(next) !== savedSnapshot.current);
			return next;
		});
	};

	// ── Effects ────────────────────────────────────────────────────────────────

	useEffect(() => {
		if (!savedAt) return;
		const id = setInterval(() => setSavedAgoText(timeAgo(savedAt)), 30_000);
		return () => clearInterval(id);
	}, [savedAt]);

	useEffect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [isDirty]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				if (isDirty) handleSave();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	// ── Navigation guard ───────────────────────────────────────────────────────

	const _guardedNavigate = (to: string) => {
		if (isDirty) setPendingNavTo(to);
		else navigate(to);
	};

	const handleBack = () => {
		if (isDirty) setPendingNavTo("__back__");
		else navigate(-1);
	};

	// ── Stats ──────────────────────────────────────────────────────────────────

	// Per-column class averages
	const colStats = useMemo(() => {
		return Object.fromEntries(
			activeTypes.map((type) => {
				const vals: number[] = [];
				for (const e of enrollments) {
					const sid = e.student?.id;
					if (!sid) continue;
					const raw = grades[sid]?.[type];
					if (raw === undefined || raw === "") continue;
					const v = Number.parseFloat(raw);
					if (!Number.isNaN(v)) vals.push(v);
				}
				const avg =
					vals.length > 0
						? vals.reduce((a, b) => a + b, 0) / vals.length
						: null;
				return [
					type,
					{
						avg: avg !== null ? Math.round(avg * 100) / 100 : null,
						max: vals.length > 0 ? Math.max(...vals) : null,
						min: vals.length > 0 ? Math.min(...vals) : null,
						count: vals.length,
					},
				];
			}),
		);
	}, [grades, activeTypes, enrollments]);

	// Per-student term averages
	const studentTermAvg = useMemo(() => {
		const result: Record<string, number | null> = {};
		for (const e of enrollments) {
			const sid = e.student?.id;
			if (!sid) continue;
			const vals = activeTypes
				.map((type) => {
					const raw = grades[sid]?.[type];
					if (raw === undefined || raw === "") return null;
					const v = Number.parseFloat(raw);
					return Number.isNaN(v) ? null : v;
				})
				.filter((v): v is number => v !== null);
			result[sid] =
				vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
		}
		return result;
	}, [grades, activeTypes, enrollments]);

	// Change count vs saved snapshot
	const changeCount = useMemo(() => {
		if (!isDirty) return 0;
		try {
			const snap = JSON.parse(savedSnapshot.current) as Record<
				string,
				Record<string, string>
			>;
			let count = 0;
			for (const e of enrollments) {
				const sid = e.student?.id;
				if (!sid) continue;
				for (const type of activeTypes) {
					const current = grades[sid]?.[type] ?? "";
					const saved = snap[sid]?.[type] ?? "";
					if (current !== saved) count++;
				}
			}
			return count;
		} catch {
			return 0;
		}
	}, [isDirty, grades, enrollments, activeTypes]);

	// Global stats for footer bar
	const allGradeVals = useMemo(() => {
		const vals: number[] = [];
		for (const e of enrollments) {
			const sid = e.student?.id;
			if (!sid) continue;
			for (const type of activeTypes) {
				const raw = grades[sid]?.[type];
				if (raw === undefined || raw === "") continue;
				const v = Number.parseFloat(raw);
				if (!Number.isNaN(v)) vals.push(v);
			}
		}
		return vals;
	}, [grades, activeTypes, enrollments]);

	const globalAvg =
		allGradeVals.length > 0
			? allGradeVals.reduce((a, b) => a + b, 0) / allGradeVals.length
			: null;
	const globalMin = allGradeVals.length > 0 ? Math.min(...allGradeVals) : null;
	const globalMax = allGradeVals.length > 0 ? Math.max(...allGradeVals) : null;
	const totalMissing = enrollments.reduce((acc, e) => {
		const sid = e.student?.id;
		if (!sid) return acc;
		return (
			acc + activeTypes.filter((type) => !(grades[sid]?.[type] ?? "")).length
		);
	}, 0);
	const totalGraded = allGradeVals.length;

	// ── Keyboard navigation ────────────────────────────────────────────────────

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		rowIdx: number,
		colIdx: number,
	) => {
		let nextRow = rowIdx;
		let nextCol = colIdx;
		if (e.key === "ArrowDown" || e.key === "Enter") {
			e.preventDefault();
			nextRow = rowIdx + 1;
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			nextRow = rowIdx - 1;
		} else if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
			e.preventDefault();
			nextCol = colIdx + 1;
		} else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
			e.preventDefault();
			nextCol = colIdx - 1;
		} else return;

		// Try same row next col first; wrap to next row if col out of range
		let target = document.querySelector<HTMLInputElement>(
			`input[data-row="${nextRow}"][data-col="${nextCol}"]`,
		);
		if (!target && e.key === "Tab" && !e.shiftKey) {
			target = document.querySelector<HTMLInputElement>(
				`input[data-row="${rowIdx + 1}"][data-col="0"]`,
			);
		}
		if (target) {
			target.focus();
			target.select();
		}
	};

	// ── Loading skeleton ───────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
					<div className="h-4 w-48 animate-pulse rounded bg-muted" />
					<div className="flex gap-2">
						<div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
						<div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
					</div>
				</div>
				<div className="overflow-hidden rounded-xl border border-border">
					{Array.from({ length: 8 }, (_, i) => (
						<div
							key={i}
							className={cn(
								"flex items-center gap-4 px-4 py-3",
								i % 2 === 1 && "bg-muted/10",
							)}
						>
							<div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
							<div className="h-3 w-36 animate-pulse rounded bg-muted" />
							<div className="h-3 w-20 animate-pulse rounded bg-muted" />
							<div className="ml-auto flex gap-3">
								<div className="h-8 w-16 animate-pulse rounded bg-muted" />
								<div className="h-8 w-16 animate-pulse rounded bg-muted" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// ── Render ─────────────────────────────────────────────────────────────────

	const contextLabel = [
		classData?.name,
		subject?.name,
		term ? t(`terms.term_${term.termNumber}`, `Term ${term.termNumber}`) : null,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<div className="flex flex-col gap-4">
			<UnsavedDialog
				open={pendingNavTo !== null}
				onLeave={() => {
					const dest = pendingNavTo!;
					setPendingNavTo(null);
					setIsDirty(false);
					if (dest === "__back__") navigate(-1);
					else navigate(dest);
				}}
				onStay={() => setPendingNavTo(null)}
			/>

			{/* ─── Toolbar ─────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
				{/* Back */}
				<button
					type="button"
					onClick={handleBack}
					className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("common.back", "Back")}
				</button>

				<div className="h-5 w-px bg-border" />

				{/* Context breadcrumb */}
				<span className="font-medium text-foreground text-sm">
					{contextLabel}
				</span>

				<div className="flex-1" />

				{/* Unsaved banner inline */}
				{isDirty && (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
						<AlertTriangle className="h-3.5 w-3.5" />
						{t("grades.unsaved_changes", "Unsaved changes")}
					</span>
				)}

				{/* Missing badge */}
				{totalMissing > 0 && (
					<span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
						{totalMissing} {t("grades.missing", "missing")}
					</span>
				)}

				{/* Comments */}
				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-1.5 rounded-full"
					onClick={() => setShowComments(true)}
				>
					<MessageSquare className="h-3.5 w-3.5" />
					{t("comments.link", "Comments")}
				</Button>

				{/* Save */}
				<Button
					size="sm"
					onClick={handleSave}
					disabled={batchUpsert.isPending || !isDirty}
					className={cn(
						"gap-1.5",
						savedAt && !isDirty && !batchUpsert.isPending
							? "bg-emerald-600 text-white hover:bg-emerald-700"
							: "",
					)}
				>
					{batchUpsert.isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : savedAt && !isDirty ? (
						<CheckCircle className="h-3.5 w-3.5" />
					) : (
						<Save className="h-3.5 w-3.5" />
					)}
					{savedAt && !isDirty
						? t("grades.saved", "Saved!")
						: changeCount > 0
							? `${t("grades.save", "Save")} (${changeCount})`
							: t("grades.save", "Save")}
				</Button>
			</div>

			{/* ─── Table ───────────────────────────────────────────────────────── */}
			{enrollments.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
					<GraduationCap className="h-12 w-12 opacity-20" />
					<p className="font-medium">
						{t("grades.no_students", "No students in this class")}
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
								<tr>
									<th className="w-10 px-3 py-2.5 text-center font-medium text-xs">
										#
									</th>
									<th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">
										{t("grades.col_student", "Student")}
									</th>
									<th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">
										{t("grades.col_reg", "Reg. #")}
									</th>
									{activeTypes.map((type) => (
										<th
											key={type}
											className="min-w-[110px] px-4 py-2.5 text-center font-medium text-xs uppercase tracking-wide"
										>
											{aLabel(type)}
										</th>
									))}
									{activeTypes.length > 1 && (
										<th className="px-4 py-2.5 text-center font-medium text-xs uppercase tracking-wide">
											{t("grades.col_avg", "AVG")}
										</th>
									)}
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{enrollments.map((e, rowIdx) => {
									const student = e.student;
									if (!student) return null;
									const termAvg = studentTermAvg[student.id] ?? null;
									const snap = JSON.parse(savedSnapshot.current) as Record<
										string,
										Record<string, string>
									>;

									return (
										<tr
											key={student.id}
											className={cn(
												"transition-colors hover:bg-muted/20",
												rowIdx % 2 === 1 &&
													"bg-black/[0.04] dark:bg-white/[0.05]",
											)}
										>
											{/* Row number */}
											<td className="px-3 py-2.5 text-center text-muted-foreground text-xs tabular-nums">
												{rowIdx + 1}
											</td>

											{/* Avatar + Name */}
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

											{/* Grade inputs */}
											{activeTypes.map((type, colIdx) => {
												const currentVal = grades[student.id]?.[type] ?? "";
												const savedVal = snap[student.id]?.[type] ?? "";
												const isCellDirty = currentVal !== savedVal;
												const numVal =
													currentVal !== ""
														? Number.parseFloat(currentVal)
														: null;
												const isMissing = currentVal === "";

												return (
													<td key={type} className="px-4 py-2.5">
														<div className="flex justify-center">
															<Input
																type="number"
																min="0"
																max="20"
																step="any"
																placeholder="—"
																data-row={rowIdx}
																data-col={colIdx}
																value={currentVal}
																onChange={(ev) =>
																	setGrade(student.id, type, ev.target.value)
																}
																onKeyDown={(ev) =>
																	handleKeyDown(ev, rowIdx, colIdx)
																}
																className={cn(
																	"w-24 text-center font-mono font-semibold text-base",
																	isMissing
																		? "border-destructive/40 border-dashed text-muted-foreground/40 placeholder:text-destructive/30"
																		: numVal !== null
																			? gradeInputCls(numVal)
																			: "",
																	isCellDirty && "ring-2 ring-amber-400/60",
																)}
															/>
														</div>
													</td>
												);
											})}

											{/* Term average */}
											{activeTypes.length > 1 && (
												<td className="px-4 py-2.5 text-center">
													{termAvg !== null ? (
														<span
															className={cn(
																"inline-flex items-center rounded-md px-2 py-0.5 font-semibold text-sm tabular-nums",
																gradeBadgeCls(termAvg),
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
										</tr>
									);
								})}

								{/* Class averages footer */}
								<tr className="border-border border-t-2 bg-muted/40 font-semibold">
									<td />
									<td
										colSpan={2}
										className="px-4 py-2.5 text-muted-foreground text-xs uppercase tracking-wide"
									>
										{t("grades.class_average", "Class average")}
									</td>
									{activeTypes.map((type) => {
										const s = colStats[type];
										return (
											<td key={type} className="px-4 py-2.5 text-center">
												{s?.avg !== null && s?.avg !== undefined ? (
													<span
														className={cn(
															"text-sm tabular-nums",
															gradeColor(s.avg),
														)}
													>
														{s.avg.toFixed(2)}
													</span>
												) : (
													<span className="text-muted-foreground/40">—</span>
												)}
											</td>
										);
									})}
									{activeTypes.length > 1 && <td />}
								</tr>
							</tbody>
						</table>
					</div>

					{/* ─── Bottom status bar ──────────────────────────────────────── */}
					<div className="flex flex-wrap items-center justify-between gap-3 border-border border-t bg-muted/20 px-4 py-2 text-muted-foreground text-xs">
						<span className="flex flex-wrap items-center gap-2">
							<span>
								<span className="font-semibold text-foreground tabular-nums">
									{enrollments.length}
								</span>{" "}
								{t("grades.students", "students")}
							</span>
							<span className="text-border">·</span>
							<span>
								<span className="font-semibold text-foreground tabular-nums">
									{totalGraded}
								</span>{" "}
								{t("grades.graded", "graded")}
							</span>
							<span className="text-border">·</span>
							<span
								className={
									totalMissing > 0
										? "font-semibold text-amber-600 dark:text-amber-400"
										: ""
								}
							>
								<span className="tabular-nums">{totalMissing}</span>{" "}
								{t("grades.missing", "missing")}
							</span>
							{globalAvg !== null && (
								<>
									<span className="text-border">·</span>
									<span>
										{t("grades.class_avg_label", "Avg:")}{" "}
										<span
											className={cn(
												"font-semibold tabular-nums",
												gradeColor(globalAvg),
											)}
										>
											{globalAvg.toFixed(2)}
										</span>
									</span>
									<span className="text-border">·</span>
									<span>
										{t("grades.class_min_label", "Min:")}{" "}
										<span
											className={cn(
												"font-semibold tabular-nums",
												gradeColor(globalMin!),
											)}
										>
											{globalMin?.toFixed(2)}
										</span>
									</span>
									<span className="text-border">·</span>
									<span>
										{t("grades.class_max_label", "Max:")}{" "}
										<span
											className={cn(
												"font-semibold tabular-nums",
												gradeColor(globalMax!),
											)}
										>
											{globalMax?.toFixed(2)}
										</span>
									</span>
								</>
							)}
						</span>
						<span>
							{savedAt
								? `${t("grades.last_saved", "Last saved")} · ${savedAgoText}`
								: isDirty
									? t("grades.unsaved_changes", "Unsaved changes")
									: ""}
						</span>
					</div>
				</div>
			)}

			{/* ─── Comments slide-over ─────────────────────────────────────────── */}
			<Sheet open={showComments} onOpenChange={setShowComments}>
				<SheetContent
					side="right"
					className="w-full max-w-3xl overflow-y-auto sm:max-w-3xl"
				>
					<SheetHeader>
						<SheetTitle>
							{t("comments.grid_title", "Teacher Comments")}
						</SheetTitle>
					</SheetHeader>
					<div className="pt-4">
						<CommentsGridContent
							classId={classId!}
							subjectId={subjectId!}
							termId={termId!}
							onClose={() => setShowComments(false)}
						/>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
