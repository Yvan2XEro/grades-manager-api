import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle,
	GraduationCap,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const ASSESSMENT_TYPE_KEYS: Record<string, string> = {
	sequence_1: "grades.assessment_sequence_1",
	sequence_2: "grades.assessment_sequence_2",
	sequence_3: "grades.assessment_sequence_3",
	sequence_4: "grades.assessment_sequence_4",
	sequence_5: "grades.assessment_sequence_5",
	sequence_6: "grades.assessment_sequence_6",
	end_of_term_exam: "grades.assessment_end_of_term_exam",
	class_test: "grades.assessment_class_test",
	quiz: "grades.assessment_quiz",
};

const ASSESSMENT_TYPE_FALLBACKS: Record<string, string> = {
	sequence_1: "Seq. 1",
	sequence_2: "Seq. 2",
	sequence_3: "Seq. 3",
	sequence_4: "Seq. 4",
	sequence_5: "Seq. 5",
	sequence_6: "Seq. 6",
	end_of_term_exam: "Exam",
	class_test: "Class test",
	quiz: "Quiz",
};

// ─── Column stats ─────────────────────────────────────────────────────────────

function computeColStats(
	grades: Record<string, Record<string, string>>,
	type: string,
): { avg: number | null; max: number | null; min: number | null } {
	const vals: number[] = [];
	for (const studentGrades of Object.values(grades)) {
		const raw = studentGrades[type];
		if (raw === undefined || raw === "") continue;
		const v = Number.parseFloat(raw);
		if (!Number.isNaN(v)) vals.push(v);
	}
	if (vals.length === 0) return { avg: null, max: null, min: null };
	const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
	return {
		avg: Math.round(avg * 100) / 100,
		max: Math.max(...vals),
		min: Math.min(...vals),
	};
}

// ─── Unsaved warning dialog ────────────────────────────────────────────────────

function UnsavedWarningDialog({
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
		{ label: t("grades.title", "Grade entry"), href: "/grades" },
		{ label: t("grades.grid_title", "Grade Sheet") },
	]);

	const [saved, setSaved] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const [pendingNavTo, setPendingNavTo] = useState<string | null>(null);
	// grades[studentId][assessmentType] = value string
	const [grades, setGrades] = useState<Record<string, Record<string, string>>>(
		{},
	);
	// Track the last-saved snapshot to compute dirty state
	const savedSnapshot = useRef<string>("{}");

	// Warn browser tab close/refresh when dirty
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

	// Ctrl+S shortcut
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	// ── Queries ──────────────────────────────────────────────────────────────

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
			{
				classId: classId!,
				subjectId: subjectId!,
				termId: termId!,
			},
			{ enabled: !!classId && !!subjectId && !!termId },
		);

	const isLoading =
		classLoading ||
		subjectsLoading ||
		yearsLoading ||
		termsLoading ||
		enrollmentsLoading ||
		assessmentsLoading;

	// Determine which assessment types are present (default: sequence_1, sequence_2)
	const presentTypes = Array.from(
		new Set(existingAssessments.map((a) => a.assessmentType)),
	);
	const activeTypes =
		presentTypes.length > 0 ? presentTypes : ["sequence_1", "sequence_2"];

	// Pre-fill grades from existing assessments
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
					if (merged[sid][type] === undefined) {
						merged[sid][type] = val;
					}
				}
			}
			return merged;
		});
		savedSnapshot.current = JSON.stringify(prefill);
		setIsDirty(false);
	}, [existingAssessments]);

	// ── Mutation ─────────────────────────────────────────────────────────────

	const batchUpsert = trpc.assessments.batchUpsert.useMutation({
		onSuccess: () => {
			setSaved(true);
			savedSnapshot.current = JSON.stringify(grades);
			setIsDirty(false);
			setTimeout(() => setSaved(false), 2000);
		},
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

	// ── Navigation guard (for in-app links when dirty) ────────────────────────
	const handleGuardedNavigation = (to: string) => {
		if (isDirty) {
			setPendingNavTo(to);
		} else {
			navigate(to);
		}
	};

	const handleBack = () => {
		if (isDirty) {
			setPendingNavTo("__back__");
		} else {
			navigate(-1);
		}
	};

	// ── Class stats ───────────────────────────────────────────────────────────
	const colStats = useMemo(
		() =>
			Object.fromEntries(
				activeTypes.map((type) => [type, computeColStats(grades, type)]),
			),
		[grades, activeTypes],
	);
	const hasAnyStats = activeTypes.some((tp) => colStats[tp]?.avg !== null);

	// ── Keyboard navigation ───────────────────────────────────────────────────
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
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			nextCol = colIdx + 1;
		} else if (e.key === "ArrowLeft") {
			e.preventDefault();
			nextCol = colIdx - 1;
		} else {
			return;
		}

		const target = document.querySelector<HTMLInputElement>(
			`input[data-row="${nextRow}"][data-col="${nextCol}"]`,
		);
		if (target) {
			target.focus();
			target.select();
		}
	};

	// ── Render ────────────────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className="space-y-5">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
				<div className="overflow-hidden rounded-xl border border-border">
					<div className="flex items-center justify-between bg-muted/30 px-4 py-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-20" />
					</div>
					<div className="divide-y divide-border">
						{Array.from({ length: 8 }, (_, i) => (
							<div key={i} className="flex items-center gap-4 px-4 py-3">
								<Skeleton className="h-4 w-36" />
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-8 w-16" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Unsaved navigation warning */}
			<UnsavedWarningDialog
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

			<div>
				<button
					type="button"
					onClick={handleBack}
					className="mb-2 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("common.back", "Back")}
				</button>
				<h1 className="font-bold text-2xl text-foreground">
					{t("grades.grid_title", "Grade Sheet")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{[
						classData?.name,
						subject?.name,
						term
							? t(`terms.term_${term.termNumber}`, `Term ${term.termNumber}`)
							: null,
					]
						.filter(Boolean)
						.join(" · ")}
				</p>
			</div>

			{/* Unsaved banner */}
			{isDirty && (
				<div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-800 text-sm dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
					<AlertTriangle className="h-4 w-4 shrink-0" />
					{t(
						"grades.unsaved_banner",
						"You have unsaved changes — press Ctrl+S or click Save.",
					)}
				</div>
			)}

			<div className="overflow-hidden rounded-xl border border-border">
				<div className="flex items-center justify-between bg-muted/30 px-4 py-3">
					<span className="font-medium text-foreground text-sm">
						{enrollments.length} {t("grades.students", "students")}
					</span>
					<div className="flex items-center gap-2">
						{/* Guard Comments navigation when dirty */}
						<button
							type="button"
							onClick={() =>
								handleGuardedNavigation(
									`/grades/${classId}/${subjectId}/${termId}/comments`,
								)
							}
							className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-1.5 font-medium text-foreground text-sm transition-colors hover:bg-muted/50"
						>
							<MessageSquare className="h-4 w-4" />
							{t("comments.link", "Comments")}
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={batchUpsert.isPending}
							className={cn(
								"inline-flex items-center gap-2 rounded-lg px-4 py-1.5 font-medium text-sm transition-colors",
								saved
									? "bg-green-500 text-white"
									: isDirty
										? "bg-amber-500 text-white hover:bg-amber-600"
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
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
								<tr>
									<th className="px-4 py-2 text-left font-medium">
										{t("grades.col_student", "Student")}
									</th>
									{activeTypes.map((type) => (
										<th
											key={type}
											className="px-3 py-2 text-center font-medium"
										>
											{t(
												ASSESSMENT_TYPE_KEYS[type] ?? type,
												ASSESSMENT_TYPE_FALLBACKS[type] ?? type,
											)}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{enrollments.map((e, rowIdx) => {
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
											{activeTypes.map((type, colIdx) => (
												<td key={type} className="px-3 py-2 text-center">
													<input
														type="number"
														min="0"
														max="20"
														step="0.25"
														placeholder="—"
														data-row={rowIdx}
														data-col={colIdx}
														value={grades[student.id]?.[type] ?? ""}
														onChange={(ev) =>
															setGrade(student.id, type, ev.target.value)
														}
														onKeyDown={(ev) =>
															handleKeyDown(ev, rowIdx, colIdx)
														}
														className="w-16 rounded border border-input bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
													/>
												</td>
											))}
										</tr>
									);
								})}
							</tbody>

							{/* Class stats footer */}
							{hasAnyStats && (
								<tfoot className="border-border border-t bg-muted/30 text-muted-foreground text-xs">
									<tr>
										<td className="px-4 py-1.5 font-semibold text-foreground">
											{t("grades.stats_avg", "Avg")}
										</td>
										{activeTypes.map((type) => {
											const s = colStats[type];
											return (
												<td
													key={type}
													className="px-3 py-1.5 text-center font-mono"
												>
													{s?.avg !== null ? (
														<span
															className={cn(
																"font-semibold",
																(s?.avg ?? 0) >= 10
																	? "text-green-600 dark:text-green-400"
																	: "text-red-500",
															)}
														>
															{s?.avg?.toFixed(2)}
														</span>
													) : (
														"—"
													)}
												</td>
											);
										})}
									</tr>
									<tr>
										<td className="px-4 pb-1 font-medium">
											{t("grades.stats_max", "Max")}
										</td>
										{activeTypes.map((type) => {
											const s = colStats[type];
											return (
												<td
													key={type}
													className="px-3 pb-1 text-center font-mono"
												>
													{s?.max !== null ? s?.max?.toFixed(2) : "—"}
												</td>
											);
										})}
									</tr>
									<tr>
										<td className="px-4 pb-2 font-medium">
											{t("grades.stats_min", "Min")}
										</td>
										{activeTypes.map((type) => {
											const s = colStats[type];
											return (
												<td
													key={type}
													className="px-3 pb-2 text-center font-mono"
												>
													{s?.min !== null ? s?.min?.toFixed(2) : "—"}
												</td>
											);
										})}
									</tr>
								</tfoot>
							)}
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
