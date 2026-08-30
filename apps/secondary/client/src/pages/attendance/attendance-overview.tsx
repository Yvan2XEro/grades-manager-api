import { zodResolver } from "@hookform/resolvers/zod";
import {
	CalendarCheck,
	CalendarPlus,
	CheckCircle2,
	ChevronDown,
	Clock,
	Save,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

// ─── Types & constants ────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const STATUS_CONFIG: Record<
	AttendanceStatus,
	{ label: string; base: string; active: string }
> = {
	present: {
		label: "Present",
		base: "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
		active:
			"border border-green-500 bg-green-500 text-white hover:bg-green-600 dark:border-green-600 dark:bg-green-600 dark:hover:bg-green-700",
	},
	absent: {
		label: "Absent",
		base: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
		active:
			"border border-red-500 bg-red-500 text-white hover:bg-red-600 dark:border-red-600 dark:bg-red-600 dark:hover:bg-red-700",
	},
	late: {
		label: "Late",
		base: "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-900",
		active:
			"border border-orange-500 bg-orange-500 text-white hover:bg-orange-600 dark:border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700",
	},
	excused: {
		label: "Excused",
		base: "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
		active:
			"border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
	},
};

const STATUSES = ["present", "absent", "late", "excused"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSessionDate(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// ─── Create Session Dialog ────────────────────────────────────────────────────

const createSessionSchema = z.object({
	classId: z.string().uuid("Select a class"),
	termId: z.string().uuid("Select a term"),
	subjectId: z.string().uuid().optional(),
	sessionDate: z.string().min(1, "Date is required"),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
});

type CreateSessionForm = z.infer<typeof createSessionSchema>;

interface CreateSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultClassId?: string;
	activeYearId?: string;
}

function CreateSessionDialog({
	open,
	onOpenChange,
	defaultClassId,
	activeYearId,
}: CreateSessionDialogProps) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const { data: classesData } = trpc.classes.list.useQuery({ pageSize: 200 });
	const classes = classesData?.items ?? [];

	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const subjects = subjectsData?.items ?? [];

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<CreateSessionForm>({
		resolver: zodResolver(createSessionSchema),
		defaultValues: {
			classId: defaultClassId ?? "",
			termId: "",
			subjectId: undefined,
			sessionDate: new Date().toISOString().slice(0, 10),
			startTime: "",
			endTime: "",
		},
	});

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYearId ?? "" },
		{ enabled: !!activeYearId },
	);

	const createSession = trpc.attendance.createSession.useMutation({
		onSuccess: () => {
			utils.attendance.listSessions.invalidate();
			reset();
			onOpenChange(false);
		},
	});

	const onSubmit = handleSubmit(async (data) => {
		await createSession.mutateAsync({
			classId: data.classId,
			termId: data.termId,
			subjectId: data.subjectId || undefined,
			sessionDate: new Date(data.sessionDate),
			startTime: data.startTime || undefined,
			endTime: data.endTime || undefined,
		});
	});

	const handleOpenChange = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t("attendance.create_session", "New Attendance Session")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<FormField
						label={t("attendance.class", "Class")}
						error={errors.classId?.message}
						required
					>
						<Controller
							name="classId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={classes.map((c) => ({ value: c.id, label: c.name }))}
									value={field.value}
									onValueChange={field.onChange}
									placeholder={t("attendance.select_class", "Select class…")}
								/>
							)}
						/>
					</FormField>

					<FormField
						label={t("attendance.term", "Term")}
						error={errors.termId?.message}
						required
					>
						<Controller
							name="termId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={terms.map((trm) => ({
										value: trm.id,
										label: t(
											`terms.term_${trm.termNumber}`,
											`Term ${trm.termNumber}`,
										),
									}))}
									value={field.value}
									onValueChange={field.onChange}
									placeholder={t("attendance.select_term", "Select term…")}
								/>
							)}
						/>
					</FormField>

					<FormField
						label={t("attendance.subject", "Subject")}
						error={errors.subjectId?.message}
					>
						<Controller
							name="subjectId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={subjects.map((s) => ({
										value: s.id,
										label: s.name,
									}))}
									value={field.value ?? ""}
									onValueChange={(val) => field.onChange(val || undefined)}
									placeholder={t(
										"attendance.optional_subject",
										"General (no subject)",
									)}
									clearable
								/>
							)}
						/>
					</FormField>

					<FormField
						label={t("attendance.date", "Date")}
						error={errors.sessionDate?.message}
						required
					>
						<Controller
							name="sessionDate"
							control={control}
							render={({ field }) => (
								<DatePicker
									value={field.value ?? ""}
									onChange={field.onChange}
									startMonth={new Date(2020, 0)}
									endMonth={new Date(2035, 11)}
								/>
							)}
						/>
					</FormField>

					<div className="grid grid-cols-2 gap-3">
						<FormField
							label={t("attendance.start_time", "Start time")}
							error={errors.startTime?.message}
						>
							<Input type="time" {...register("startTime")} />
						</FormField>
						<FormField
							label={t("attendance.end_time", "End time")}
							error={errors.endTime?.message}
						>
							<Input type="time" {...register("endTime")} />
						</FormField>
					</div>

					{createSession.error && (
						<p className="text-destructive text-sm">
							{createSession.error.message ??
								t("common.error", "An error occurred")}
						</p>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{t("attendance.create", "Create session")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Attendance Sheet ─────────────────────────────────────────────────────────

interface AttendanceSheetProps {
	sessionId: string;
	classId: string;
	activeYearId: string;
}

function AttendanceSheet({
	sessionId,
	classId,
	activeYearId,
}: AttendanceSheetProps) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
		{},
	);
	const [initialized, setInitialized] = useState(false);
	const [saved, setSaved] = useState(false);

	const { data: records = [], isLoading: recordsLoading } =
		trpc.attendance.getSessionRecords.useQuery({ sessionId });

	const { data: enrollmentsData, isLoading: enrollmentsLoading } =
		trpc.enrollments.list.useQuery(
			{ classId, academicYearId: activeYearId, pageSize: 200 },
			{ enabled: !!classId && !!activeYearId },
		);
	const enrollments = enrollmentsData?.items ?? [];

	// Initialize statuses once both records and enrollments are loaded
	useEffect(() => {
		if (recordsLoading || enrollmentsLoading || initialized) return;
		const initial: Record<string, AttendanceStatus> = {};
		for (const e of enrollments) {
			if (e.student?.id) {
				initial[e.student.id] = "present";
			}
		}
		for (const r of records) {
			initial[r.studentId] = r.status as AttendanceStatus;
		}
		setStatuses(initial);
		setInitialized(true);
	}, [records, enrollments, recordsLoading, enrollmentsLoading, initialized]);

	const batchRecord = trpc.attendance.batchRecordAttendance.useMutation({
		onSuccess: () => {
			utils.attendance.getSessionRecords.invalidate({ sessionId });
			setSaved(true);
			setTimeout(() => setSaved(false), 2500);
		},
	});

	const handleSave = () => {
		const students = enrollments
			.map((e) => e.student)
			.filter((s): s is NonNullable<typeof s> => s != null);
		if (students.length === 0) return;
		const items = students.map((student) => ({
			studentId: student.id,
			status: statuses[student.id] ?? "present",
		}));
		batchRecord.mutate({ sessionId, items });
	};

	const counts = useMemo(() => {
		const c: Record<AttendanceStatus, number> = {
			present: 0,
			absent: 0,
			late: 0,
			excused: 0,
		};
		for (const status of Object.values(statuses)) {
			c[status] = (c[status] ?? 0) + 1;
		}
		return c;
	}, [statuses]);

	const isLoading = recordsLoading || enrollmentsLoading;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex gap-2">
					{Array.from({ length: 3 }, (_, i) => (
						<Skeleton key={i} className="h-7 w-24 rounded-full" />
					))}
				</div>
				<div className="overflow-hidden rounded-xl border border-border">
					<div className="flex items-center justify-between bg-muted/30 px-4 py-3">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-8 w-28" />
					</div>
					{Array.from({ length: 6 }, (_, i) => (
						<div
							key={i}
							className="flex items-center gap-4 border-border border-t px-4 py-3"
						>
							<Skeleton className="h-4 w-40" />
							<div className="ml-auto flex gap-2">
								<Skeleton className="h-7 w-7 rounded-full" />
								<Skeleton className="h-7 w-7 rounded-full" />
								<Skeleton className="h-7 w-7 rounded-full" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	const students = enrollments
		.map((e) => e.student)
		.filter((s): s is NonNullable<typeof s> => s != null);

	return (
		<div className="space-y-4">
			{/* Stats bar */}
			<div className="flex flex-wrap gap-2">
				<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-medium text-green-700 text-xs dark:bg-green-950 dark:text-green-400">
					<CheckCircle2 className="h-3.5 w-3.5" />
					{counts.present} {t("attendance.present", "present")}
				</span>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 font-medium text-red-700 text-xs dark:bg-red-950 dark:text-red-400">
					{counts.absent} {t("attendance.absent", "absent")}
				</span>
				{counts.late > 0 && (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-700 text-xs dark:bg-orange-950 dark:text-orange-400">
						{counts.late} {t("attendance.late", "late")}
					</span>
				)}
				{counts.excused > 0 && (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 text-xs dark:bg-blue-950 dark:text-blue-400">
						{counts.excused} {t("attendance.excused", "excused")}
					</span>
				)}
				<span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground text-xs">
					<Users className="h-3.5 w-3.5" />
					{students.length} {t("attendance.students", "students")}
				</span>
			</div>

			{/* Student list */}
			{students.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
					<Users className="h-8 w-8 opacity-30" />
					<p className="text-sm">
						{t("attendance.no_students", "No students enrolled in this class")}
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-lg border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.col_student", "Student")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("attendance.col_status", "Status")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{students.map((student) => {
								const current = statuses[student.id] ?? "present";
								return (
									<tr
										key={student.id}
										className="transition-colors hover:bg-muted/20"
									>
										<td className="px-4 py-2.5 font-medium text-foreground">
											{student.lastName} {student.firstName}
										</td>
										<td className="px-4 py-2.5">
											<div className="flex flex-wrap gap-1.5">
												{STATUSES.map((status) => {
													const cfg = STATUS_CONFIG[status];
													const isActive = current === status;
													return (
														<button
															key={status}
															type="button"
															onClick={() =>
																setStatuses((prev) => ({
																	...prev,
																	[student.id]: status,
																}))
															}
															className={cn(
																"rounded-md px-2.5 py-1 font-medium text-xs transition-colors",
																isActive ? cfg.active : cfg.base,
															)}
														>
															{t(`attendance.status_${status}`, cfg.label)}
														</button>
													);
												})}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Save + error */}
			{students.length > 0 && (
				<div className="flex items-center justify-between">
					{batchRecord.error ? (
						<p className="text-destructive text-sm">
							{batchRecord.error.message ??
								t("common.error", "An error occurred")}
						</p>
					) : (
						<span />
					)}
					<button
						type="button"
						onClick={handleSave}
						disabled={batchRecord.isPending}
						className={cn(
							"inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors",
							saved
								? "bg-green-500 text-white"
								: "bg-primary text-primary-foreground hover:bg-primary/90",
						)}
					>
						{saved ? (
							<>
								<CheckCircle2 className="h-4 w-4" />
								{t("attendance.saved", "Saved!")}
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								{t("attendance.save_attendance", "Save attendance")}
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AttendanceOverview() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const [createOpen, setCreateOpen] = useState(false);

	const classId = searchParams.get("classId") ?? "";
	const termId = searchParams.get("termId") ?? "";
	const startDate = searchParams.get("startDate") ?? "";
	const endDate = searchParams.get("endDate") ?? "";
	const selectedSessionId = searchParams.get("sessionId") ?? "";

	const setParam = (key: string, val: string) =>
		setSearchParams((prev) => {
			const n = new URLSearchParams(prev);
			if (val) n.set(key, val);
			else n.delete(key);
			return n;
		});

	const setClassId = (val: string) =>
		setSearchParams((prev) => {
			const n = new URLSearchParams(prev);
			if (val) n.set("classId", val);
			else n.delete("classId");
			n.delete("sessionId");
			return n;
		});

	const toggleSession = (id: string) =>
		setSearchParams((prev) => {
			const n = new URLSearchParams(prev);
			if (id && id !== selectedSessionId) n.set("sessionId", id);
			else n.delete("sessionId");
			return n;
		});

	// ── Data ──────────────────────────────────────────────────────────────────

	const { data: classesData } = trpc.classes.list.useQuery({ pageSize: 200 });
	const classes = classesData?.items ?? [];

	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const subjects = subjectsData?.items ?? [];
	const subjectMap = useMemo(
		() => new Map(subjects.map((s) => [s.id, s.name])),
		[subjects],
	);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear?.id },
	);
	const termMap = useMemo(
		() =>
			new Map(
				terms.map((trm) => [
					trm.id,
					t(`terms.term_${trm.termNumber}`, `Term ${trm.termNumber}`),
				]),
			),
		[terms, t],
	);

	const { data: sessions = [], isLoading: sessionsLoading } =
		trpc.attendance.listSessions.useQuery(
			{
				classId,
				termId: termId || undefined,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : undefined,
			},
			{ enabled: !!classId },
		);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("attendance.title", "Attendance")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("attendance.subtitle", "Track and manage session attendance")}
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)} className="gap-2">
					<CalendarPlus className="h-4 w-4" />
					{t("attendance.new_session", "New Session")}
				</Button>
			</div>

			{/* Filter bar */}
			<div className="flex flex-wrap items-end gap-3">
				<div className="w-56">
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("attendance.class", "Class")}{" "}
						<span className="text-destructive">*</span>
					</label>
					<Combobox
						options={classes.map((c) => ({ value: c.id, label: c.name }))}
						value={classId}
						onValueChange={setClassId}
						placeholder={t("attendance.select_class", "Select class…")}
					/>
				</div>
				<div className="w-44">
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("attendance.term", "Term")}
					</label>
					<Combobox
						options={terms.map((trm) => ({
							value: trm.id,
							label: t(
								`terms.term_${trm.termNumber}`,
								`Term ${trm.termNumber}`,
							),
						}))}
						value={termId}
						onValueChange={(val) => setParam("termId", val)}
						placeholder={t("attendance.all_terms", "All terms")}
					/>
				</div>
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("attendance.from", "From")}
					</label>
					<DatePicker
						value={startDate}
						onChange={(v) => setParam("startDate", v)}
						className="w-44"
						startMonth={new Date(2020, 0)}
						endMonth={new Date(2035, 11)}
					/>
				</div>
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("attendance.to", "To")}
					</label>
					<DatePicker
						value={endDate}
						onChange={(v) => setParam("endDate", v)}
						className="w-44"
						startMonth={new Date(2020, 0)}
						endMonth={new Date(2035, 11)}
					/>
				</div>
			</div>

			{/* Body */}
			{!classId ? (
				<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
					<CalendarCheck className="h-12 w-12 opacity-20" />
					<p className="font-medium">
						{t(
							"attendance.select_class_prompt",
							"Select a class to view sessions",
						)}
					</p>
				</div>
			) : sessionsLoading ? (
				<div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
					{t("common.loading", "Loading…")}
				</div>
			) : sessions.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
					<CalendarCheck className="h-12 w-12 opacity-20" />
					<p className="font-medium">
						{t("attendance.no_sessions", "No sessions found")}
					</p>
					<p className="text-xs">
						{t(
							"attendance.no_sessions_hint",
							"Create a session using the button above",
						)}
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{sessions.map((session) => {
						const isExpanded = selectedSessionId === session.id;
						const subjectName = session.subjectId
							? (subjectMap.get(session.subjectId) ??
								t("attendance.general", "General"))
							: t("attendance.general", "General");
						const termLabel = termMap.get(session.termId);
						const timeDisplay =
							session.startTime && session.endTime
								? `${session.startTime} – ${session.endTime}`
								: (session.startTime ?? null);

						return (
							<div
								key={session.id}
								className={cn(
									"overflow-hidden rounded-xl border transition-colors",
									isExpanded
										? "border-primary/40 bg-primary/5 dark:bg-primary/10"
										: "border-border bg-card hover:bg-muted/20",
								)}
							>
								{/* Session row */}
								<button
									type="button"
									onClick={() => toggleSession(session.id)}
									className="flex w-full items-center gap-4 px-4 py-3 text-left"
								>
									<div
										className={cn(
											"h-10 w-1 shrink-0 rounded-full",
											isExpanded ? "bg-primary" : "bg-muted-foreground/20",
										)}
									/>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-semibold text-foreground text-sm">
												{formatSessionDate(session.sessionDate)}
											</span>
											{termLabel && (
												<span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
													{termLabel}
												</span>
											)}
											<span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
												{subjectName}
											</span>
										</div>
										{timeDisplay && (
											<div className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
												<Clock className="h-3 w-3" />
												{timeDisplay}
											</div>
										)}
									</div>
									<ChevronDown
										className={cn(
											"h-4 w-4 shrink-0 text-muted-foreground transition-transform",
											isExpanded && "rotate-180",
										)}
									/>
								</button>

								{/* Inline attendance sheet */}
								{isExpanded && activeYear?.id && (
									<div className="border-border border-t px-6 py-4">
										<AttendanceSheet
											key={session.id}
											sessionId={session.id}
											classId={classId}
											activeYearId={activeYear.id}
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Create session dialog */}
			<CreateSessionDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				defaultClassId={classId}
				activeYearId={activeYear?.id}
			/>
		</div>
	);
}
