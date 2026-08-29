import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Download, Pencil, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

// ─── Types ─────────────────────────────────────────────────────────────────

type CouncilStatus = "draft" | "scheduled" | "held" | "signed";

const STATUS_VARIANTS: Record<
	CouncilStatus,
	"secondary" | "info" | "success" | "default"
> = {
	draft: "secondary",
	scheduled: "info",
	held: "success",
	signed: "default",
};

const STATUS_LABELS: Record<CouncilStatus, string> = {
	draft: "Draft",
	scheduled: "Scheduled",
	held: "Held",
	signed: "Signed",
};

// Status progression: what's the logical next status
const NEXT_STATUS: Partial<Record<CouncilStatus, CouncilStatus>> = {
	draft: "scheduled",
	scheduled: "held",
	held: "signed",
};

const NEXT_STATUS_LABEL: Partial<Record<CouncilStatus, string>> = {
	draft: "Mark as Scheduled",
	scheduled: "Mark as Held",
	held: "Mark as Signed",
};

const DECISION_OPTIONS: { value: string; key: string }[] = [
	{ value: "Admis", key: "option_admitted" },
	{ value: "Ajourné", key: "option_deferred" },
	{ value: "Renvoyé", key: "option_expelled" },
	{ value: "Passage conditionnel", key: "option_conditional" },
];

// ─── Decision row form (add or edit) ───────────────────────────────────────

const decisionSchema = z.object({
	decision: z.string().min(1, "Required"),
	note: z.string().optional(),
});

type DecisionFormValues = z.infer<typeof decisionSchema>;

interface DecisionRowFormProps {
	councilId: string;
	enrollmentId: string;
	/** If set, we're editing an existing decision */
	existingId?: string;
	defaultDecision?: string;
	defaultNote?: string;
	onDone: () => void;
}

function DecisionRowForm({
	councilId,
	enrollmentId,
	existingId,
	defaultDecision = "",
	defaultNote = "",
	onDone,
}: DecisionRowFormProps) {
	const { t } = useTranslation();

	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting, errors },
	} = useForm<DecisionFormValues>({
		resolver: zodResolver(decisionSchema),
		defaultValues: { decision: defaultDecision, note: defaultNote },
	});

	const addDecision = trpc.classCouncils.addDecision.useMutation();
	const updateDecision = trpc.classCouncils.updateDecision.useMutation();

	const onSubmit = async (values: DecisionFormValues) => {
		if (existingId) {
			await updateDecision.mutateAsync({
				id: existingId,
				decision: values.decision,
				note: values.note || undefined,
			});
		} else {
			await addDecision.mutateAsync({
				councilId,
				enrollmentId,
				decision: values.decision,
				note: values.note || undefined,
			});
		}
		reset();
		onDone();
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-wrap items-center gap-2"
		>
			<Controller
				name="decision"
				control={control}
				render={({ field }) => (
					<Select value={field.value} onValueChange={field.onChange}>
						<SelectTrigger className="w-48">
							<SelectValue
								placeholder={t("class_councils.decision", "Decision")}
							/>
						</SelectTrigger>
						<SelectContent>
							{DECISION_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{t(`councils.${opt.key}`, opt.value)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			/>
			{errors.decision && (
				<span className="text-destructive text-xs">
					{errors.decision.message}
				</span>
			)}
			<Input
				className="h-8 w-36"
				placeholder={t("class_councils.note", "Note (optional)")}
				{...register("note")}
			/>
			<Button type="submit" size="sm" disabled={isSubmitting}>
				{isSubmitting
					? t("common.saving", "Saving…")
					: t("common.save", "Save")}
			</Button>
			{existingId && (
				<Button type="button" variant="ghost" size="sm" onClick={onDone}>
					{t("common.cancel", "Cancel")}
				</Button>
			)}
		</form>
	);
}

// ─── Global note form ───────────────────────────────────────────────────────

const globalNoteSchema = z.object({
	globalNote: z.string().optional(),
});

type GlobalNoteFormValues = z.infer<typeof globalNoteSchema>;

// ─── Main component ─────────────────────────────────────────────────────────

export function CouncilDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const [noteSaved, setNoteSaved] = useState(false);
	const [editingDecisionId, setEditingDecisionId] = useState<string | null>(
		null,
	);

	const utils = trpc.useUtils();

	// ── Queries ──────────────────────────────────────────────────────────────

	const { data: council, isLoading: isLoadingCouncil } =
		trpc.classCouncils.get.useQuery({ id: id! }, { enabled: !!id });

	const councilLabel = council
		? `${(council as { className?: string }).className ?? t("class_councils.council", "Council")}`
		: "…";
	useBreadcrumbs([
		{
			label: t("nav.class_councils", "Class councils"),
			href: "/class-councils",
		},
		{ label: councilLabel },
	]);

	const { data: decisions = [], isLoading: isLoadingDecisions } =
		trpc.classCouncils.listDecisions.useQuery({ id: id! }, { enabled: !!id });

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId: yearId, page: 1, pageSize: 200 },
		{ enabled: !!yearId },
	);
	const classItems = classesData?.items ?? [];

	const { data: termsData } = trpc.terms.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);
	const termItems = termsData ?? [];

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{
			classId: council?.classId ?? "",
			academicYearId: yearId,
			pageSize: 200,
		},
		{ enabled: !!council?.classId && !!yearId },
	);
	const enrollments = enrollmentsData?.items ?? [];

	const { data: classAverages = [] } =
		trpc.assessments.getClassAverages.useQuery(
			{ classId: council?.classId ?? "", termId: council?.termId ?? "" },
			{ enabled: !!council?.classId && !!council?.termId },
		);
	const avgByStudent = new Map(classAverages.map((a) => [a.studentId, a.avg]));
	const gradedByStudent = new Map(
		classAverages.map((a) => [a.studentId, a.graded]),
	);

	// Rank: 1 = highest avg
	const sortedForRank = [...classAverages]
		.filter((a) => a.avg !== null)
		.sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
	const rankByStudent = new Map(
		sortedForRank.map((a, i) => [a.studentId, i + 1]),
	);

	// ── Mutations ─────────────────────────────────────────────────────────────

	const updateCouncil = trpc.classCouncils.update.useMutation({
		onSuccess: () => utils.classCouncils.get.invalidate({ id: id! }),
	});

	// ── Global note form ──────────────────────────────────────────────────────

	const {
		register: registerNote,
		handleSubmit: handleNoteSubmit,
		reset: resetNote,
	} = useForm<GlobalNoteFormValues>({
		resolver: zodResolver(globalNoteSchema),
		defaultValues: { globalNote: "" },
	});

	useEffect(() => {
		if (council) {
			resetNote({ globalNote: council.globalNote ?? "" });
		}
	}, [council, resetNote]);

	const onNoteSubmit = async (values: GlobalNoteFormValues) => {
		await updateCouncil.mutateAsync({
			id: id!,
			globalNote: values.globalNote || undefined,
		});
		setNoteSaved(true);
		setTimeout(() => setNoteSaved(false), 3000);
	};

	// ── Lookups ───────────────────────────────────────────────────────────────

	const classMap = new Map(classItems.map((c) => [c.id, c.name]));
	const termMap = new Map(
		termItems.map((trm) => [
			trm.id,
			t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`),
		]),
	);
	// decisions items: { decision: { id, enrollmentId, decision, note, ... }, student: {...} }
	const decisionByEnrollment = new Map(
		decisions.map((d) => [d.decision.enrollmentId, d]),
	);

	const className = council ? (classMap.get(council.classId) ?? "—") : "—";
	const termName = council ? (termMap.get(council.termId) ?? "—") : "—";
	const status = (council?.status ?? "draft") as CouncilStatus;
	const nextStatus = NEXT_STATUS[status];

	const advanceStatus = async () => {
		if (!nextStatus) return;
		await updateCouncil.mutateAsync({ id: id!, status: nextStatus });
	};

	const exportPV = () => {
		const sorted = [...enrollments].sort((a, b) => {
			const ra = rankByStudent.get(a.student.id) ?? 9999;
			const rb = rankByStudent.get(b.student.id) ?? 9999;
			return ra - rb;
		});
		const header = [
			t("class_councils.col_rank", "Rank"),
			t("enrollments.col_student", "Student"),
			t("class_councils.col_avg", "Avg /20"),
			t("class_councils.col_decision", "Decision"),
			t("class_councils.col_note", "Note"),
		];
		const rows = sorted.map((item) => {
			const sid = item.student.id;
			const avg = avgByStudent.get(sid);
			const rank = rankByStudent.get(sid);
			const dec = decisionByEnrollment.get(item.enrollment.id);
			return [
				rank != null ? String(rank) : "",
				`${item.student.lastName} ${item.student.firstName}`,
				avg != null ? avg.toFixed(2) : "",
				dec?.decision.decision ?? "",
				dec?.decision.note ?? "",
			];
		});
		const csv = [header, ...rows]
			.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
			.join("\n");
		const blob = new Blob([`﻿${csv}`], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `pv_${className}_${termName}.csv`.replace(/\s+/g, "_");
		a.click();
		URL.revokeObjectURL(url);
	};

	// ── Render ────────────────────────────────────────────────────────────────

	if (isLoadingCouncil) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!council) {
		return (
			<div className="py-16 text-center text-muted-foreground">
				{t("class_councils.not_found", "Council not found.")}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-start gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="font-bold text-2xl text-foreground">{className}</h1>
						<span className="text-lg text-muted-foreground">/</span>
						<span className="font-medium text-foreground text-lg">
							{termName}
						</span>
						<Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
							{t(`councils.${status}`, STATUS_LABELS[status] ?? status)}
						</Badge>
					</div>
					{council.scheduledAt && (
						<p className="text-muted-foreground text-sm">
							{t("class_councils.col_date", "Scheduled")}:{" "}
							{new Date(council.scheduledAt).toLocaleString()}
						</p>
					)}
				</div>

				<div className="flex shrink-0 items-center gap-2">
					{enrollments.length > 0 && (
						<Button variant="outline" size="sm" onClick={exportPV}>
							<Download className="mr-1.5 h-4 w-4" />
							{t("class_councils.export_pv", "Export PV")}
						</Button>
					)}
					{/* Advance status */}
					{nextStatus && (
						<Button onClick={advanceStatus} disabled={updateCouncil.isPending}>
							<ChevronRight />
							{t(
								`class_councils.advance_${nextStatus}`,
								NEXT_STATUS_LABEL[status] ?? "",
							)}
						</Button>
					)}
				</div>
			</div>

			{/* Students & decisions */}
			<div>
				<h2 className="mb-3 font-semibold text-foreground text-lg">
					{t("class_councils.decisions_title", "Student Decisions")}
				</h2>

				{isLoadingDecisions ? (
					<div className="space-y-2">
						{Array.from({ length: 5 }, (_, i) => (
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				) : enrollments.length === 0 ? (
					<div className="rounded-lg border border-border py-12 text-center text-muted-foreground">
						{t(
							"class_councils.no_students",
							"No students enrolled in this class.",
						)}
					</div>
				) : (
					<div className="overflow-hidden rounded-xl border border-border">
						<table className="w-full">
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
								<tr className="border-border border-b bg-muted/50">
									<th className="w-12 px-4 py-3 text-center font-medium text-muted-foreground text-sm">
										{t("class_councils.col_rank", "Rank")}
									</th>
									<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
										{t("class_councils.col_student", "Student")}
									</th>
									<th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">
										{t("class_councils.col_avg", "Avg /20")}
									</th>
									<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
										{t("class_councils.col_decision", "Decision")}
									</th>
									<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
										{t("class_councils.col_note", "Note")}
									</th>
								</tr>
							</thead>
							<tbody>
								{[...enrollments]
									.sort((a, b) => {
										const ra = rankByStudent.get(a.student.id) ?? 9999;
										const rb = rankByStudent.get(b.student.id) ?? 9999;
										return ra - rb;
									})
									.map((item, i) => {
										// item shape: { enrollment: { id, ... }, student: { ... } }
										const enrollmentId = item.enrollment.id;
										const existing = decisionByEnrollment.get(enrollmentId);
										// existing shape: { decision: { decision, note, ... }, student }
										const decisionText = existing?.decision.decision ?? null;
										const student = item.student;
										const fullName = `${student.firstName} ${student.lastName}`;

										const rank = rankByStudent.get(student.id);
										const graded = gradedByStudent.get(student.id);
										const isEditing = editingDecisionId === enrollmentId;

										return (
											<tr
												key={enrollmentId}
												className={`border-border border-b last:border-0 ${i % 2 === 1 ? "bg-muted/20" : ""}`}
											>
												<td className="px-4 py-3 text-center text-muted-foreground text-sm tabular-nums">
													{rank ? (
														<span className="font-medium text-foreground">
															{rank}
														</span>
													) : (
														"—"
													)}
												</td>
												<td className="px-4 py-3 font-medium text-foreground text-sm">
													{fullName}
												</td>
												<td className="px-4 py-3 text-right text-sm tabular-nums">
													{(() => {
														const avg = avgByStudent.get(student.id);
														if (avg === undefined || avg === null)
															return (
																<span className="text-muted-foreground">—</span>
															);
														const color =
															avg >= 10 ? "text-green-600" : "text-red-500";
														return (
															<span className={`font-semibold ${color}`}>
																{avg.toFixed(2)}
																{graded !== undefined && (
																	<span className="ml-1 font-normal text-muted-foreground text-xs">
																		({graded})
																	</span>
																)}
															</span>
														);
													})()}
												</td>
												<td className="px-4 py-3">
													{isEditing ? (
														<DecisionRowForm
															councilId={id!}
															enrollmentId={enrollmentId}
															existingId={existing?.decision.id}
															defaultDecision={existing?.decision.decision}
															defaultNote={existing?.decision.note ?? ""}
															onDone={() => {
																setEditingDecisionId(null);
																utils.classCouncils.listDecisions.invalidate({
																	id: id!,
																});
															}}
														/>
													) : decisionText ? (
														<div className="flex items-center gap-2">
															<Badge
																variant={
																	decisionText === "Admis"
																		? "success"
																		: decisionText === "Passage conditionnel"
																			? "info"
																			: decisionText === "Ajourné"
																				? "secondary"
																				: "default"
																}
															>
																{t(
																	`councils.${DECISION_OPTIONS.find((o) => o.value === decisionText)?.key ?? ""}`,
																	decisionText,
																)}
															</Badge>
															<button
																type="button"
																onClick={() =>
																	setEditingDecisionId(enrollmentId)
																}
																className="rounded p-0.5 text-muted-foreground hover:text-foreground"
																title={t("common.edit", "Edit")}
															>
																<Pencil className="size-3.5" />
															</button>
														</div>
													) : (
														<DecisionRowForm
															councilId={id!}
															enrollmentId={enrollmentId}
															onDone={() =>
																utils.classCouncils.listDecisions.invalidate({
																	id: id!,
																})
															}
														/>
													)}
												</td>
												<td className="px-4 py-3 text-muted-foreground text-sm">
													{!isEditing && (existing?.decision.note ?? "—")}
												</td>
											</tr>
										);
									})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Global note */}
			<div className="max-w-xl">
				<h2 className="mb-3 font-semibold text-foreground text-lg">
					{t("class_councils.global_note_title", "Global Note")}
				</h2>
				<form onSubmit={handleNoteSubmit(onNoteSubmit)} className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="global-note">
							{t("class_councils.global_note_label", "Council remarks")}
						</Label>
						<textarea
							id="global-note"
							rows={4}
							className="w-full rounded-md border border-input bg-input px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/55 focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/15"
							placeholder={t(
								"class_councils.global_note_placeholder",
								"Add global remarks for this council…",
							)}
							{...registerNote("globalNote")}
						/>
					</div>
					<div className="flex items-center gap-3">
						<Button type="submit" disabled={updateCouncil.isPending}>
							<Save />
							{updateCouncil.isPending
								? t("common.saving", "Saving…")
								: t("common.save", "Save")}
						</Button>
						{noteSaved && (
							<span className="font-medium text-green-600 text-sm">
								{t("common.saved", "Saved.")}
							</span>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
