import {
	ArrowLeft,
	CheckCircle,
	GraduationCap,
	Loader2,
	MessageSquare,
	Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { errorToast } from "@/lib/error-toast";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

// ─── Design helpers ────────────────────────────────────────────────────────────

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

function timeAgo(date: Date): string {
	const secs = Math.floor((Date.now() - date.getTime()) / 1000);
	if (secs < 60) return "just now";
	if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
	return `${Math.floor(secs / 3600)} h ago`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CommentsGrid() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { classId, subjectId, termId } = useParams<{
		classId: string;
		subjectId: string;
		termId: string;
	}>();

	useBreadcrumbs([
		{ label: t("grades.title", "Grade entry"), href: "/grades" },
		{
			label: t("grades.grid_title", "Grade Sheet"),
			href: `/grades/${classId}/${subjectId}/${termId}`,
		},
		{ label: t("comments.grid_title", "Teacher Comments") },
	]);

	const [comments, setComments] = useState<Record<string, string>>({});
	const [savedAt, setSavedAt] = useState<Date | null>(null);
	const [savedAgoText, setSavedAgoText] = useState("");

	// ── Queries ────────────────────────────────────────────────────────────────

	const { data: classData } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);
	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const subject = subjectsData?.items?.find((s) => s.id === subjectId);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);
	const term = terms.find((trm) => trm.id === termId);

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{
			academicYearId: activeYear?.id ?? "",
			classId: classId ?? "",
			pageSize: 200,
		},
		{ enabled: !!classId && !!activeYear?.id },
	);
	const enrollments = enrollmentsData?.items ?? [];

	const { data: existingComments = [] } = trpc.comments.list.useQuery(
		{ classId: classId!, subjectId: subjectId!, termId: termId! },
		{ enabled: !!classId && !!subjectId && !!termId },
	);

	// Pre-fill
	useEffect(() => {
		if (existingComments.length === 0) return;
		setComments((prev) => {
			const merged = { ...prev };
			for (const c of existingComments) {
				if (merged[c.studentId] === undefined) merged[c.studentId] = c.comment;
			}
			return merged;
		});
	}, [existingComments]);

	// ── Mutation ───────────────────────────────────────────────────────────────

	const batchUpsert = trpc.comments.batchUpsert.useMutation({
		onSuccess: () => {
			const now = new Date();
			setSavedAt(now);
			setSavedAgoText(timeAgo(now));
		},
		onError: (err) => errorToast(err, t),
	});

	const handleSave = () => {
		if (!classId || !subjectId || !termId) return;
		const items = enrollments
			.map((e) => e.student)
			.filter(Boolean)
			.map((student) => ({
				studentId: student?.id,
				classId,
				subjectId,
				termId,
				comment: comments[student?.id ?? ""] ?? "",
			}))
			.filter(
				(item) =>
					item.comment.trim() !== "" ||
					existingComments.some((c) => c.studentId === item.studentId),
			);
		if (items.length === 0) return;
		batchUpsert.mutate({ items });
	};

	// ── Effects ────────────────────────────────────────────────────────────────

	useEffect(() => {
		if (!savedAt) return;
		const id = setInterval(() => setSavedAgoText(timeAgo(savedAt)), 30_000);
		return () => clearInterval(id);
	}, [savedAt]);

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

	// ── Keyboard navigation ────────────────────────────────────────────────────

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
		rowIdx: number,
	) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			document
				.querySelector<HTMLTextAreaElement>(
					`textarea[data-row="${rowIdx + 1}"]`,
				)
				?.focus();
		} else if (e.key === "ArrowDown" && e.ctrlKey) {
			e.preventDefault();
			document
				.querySelector<HTMLTextAreaElement>(
					`textarea[data-row="${rowIdx + 1}"]`,
				)
				?.focus();
		} else if (e.key === "ArrowUp" && e.ctrlKey) {
			e.preventDefault();
			document
				.querySelector<HTMLTextAreaElement>(
					`textarea[data-row="${rowIdx - 1}"]`,
				)
				?.focus();
		}
	};

	// ── Render ─────────────────────────────────────────────────────────────────

	const contextLabel = [
		classData?.name,
		subject?.name,
		term ? t(`terms.term_${term.termNumber}`, `Term ${term.termNumber}`) : null,
	]
		.filter(Boolean)
		.join(" · ");

	const filledCount = enrollments.filter(
		(e) => (comments[e.student?.id ?? ""] ?? "").trim() !== "",
	).length;

	return (
		<div className="flex flex-col gap-4">
			{/* ─── Toolbar ─────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
				{/* Back */}
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("common.back", "Back")}
				</button>

				<div className="h-5 w-px bg-border" />

				<span className="font-medium text-foreground text-sm">
					{contextLabel}
				</span>

				<div className="flex-1" />

				{/* Save */}
				<Button
					size="sm"
					onClick={handleSave}
					disabled={batchUpsert.isPending}
					className={cn(
						"gap-1.5",
						savedAt && !batchUpsert.isPending
							? "bg-emerald-600 text-white hover:bg-emerald-700"
							: "",
					)}
				>
					{batchUpsert.isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : savedAt ? (
						<CheckCircle className="h-3.5 w-3.5" />
					) : (
						<Save className="h-3.5 w-3.5" />
					)}
					{savedAt && !batchUpsert.isPending
						? t("grades.saved", "Saved!")
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
									<th className="w-52 px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">
										{t("grades.col_student", "Student")}
									</th>
									<th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">
										<span className="flex items-center gap-1.5">
											<MessageSquare className="h-3.5 w-3.5" />
											{t("comments.col_comment", "Comment")}
											<span className="font-normal text-muted-foreground/60 text-xs">
												(max 200)
											</span>
										</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{enrollments.map((e, rowIdx) => {
									const student = e.student;
									if (!student) return null;
									const value = comments[student.id] ?? "";
									const charCount = value.length;
									const hasSaved = existingComments.some(
										(c) =>
											c.studentId === student.id && c.comment.trim() !== "",
									);

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
											<td className="px-3 py-3 text-center align-top text-muted-foreground text-xs tabular-nums">
												{rowIdx + 1}
											</td>

											{/* Avatar + Name */}
											<td className="px-4 py-3 align-top">
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
													<div>
														<span className="font-medium text-foreground">
															{student.lastName} {student.firstName}
														</span>
														{hasSaved && (
															<span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 font-medium text-[10px] text-primary">
																✓
															</span>
														)}
													</div>
												</div>
											</td>

											{/* Comment textarea */}
											<td className="px-4 py-2">
												<div className="relative">
													<textarea
														rows={2}
														maxLength={200}
														placeholder={t(
															"comments.placeholder",
															"Write a comment… (optional)",
														)}
														data-row={rowIdx}
														value={value}
														onChange={(ev) =>
															setComments((prev) => ({
																...prev,
																[student.id]: ev.target.value,
															}))
														}
														onKeyDown={(ev) => handleKeyDown(ev, rowIdx)}
														className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
													/>
													{charCount > 160 && (
														<span
															className={cn(
																"absolute right-2 bottom-2 text-xs",
																charCount >= 200
																	? "text-destructive"
																	: "text-muted-foreground",
															)}
														>
															{charCount}/200
														</span>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* ─── Bottom status bar ──────────────────────────────────────── */}
					<div className="flex flex-wrap items-center justify-between gap-3 border-border border-t bg-muted/20 px-4 py-2 text-muted-foreground text-xs">
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
									{filledCount}
								</span>{" "}
								{t("comments.filled", "with comment")}
							</span>
						</span>
						<span>
							{savedAt
								? `${t("grades.last_saved", "Last saved")} · ${savedAgoText}`
								: ""}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
