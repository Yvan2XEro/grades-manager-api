import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	Calendar,
	Download,
	Pencil,
	Plus,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { z } from "zod";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { type GridSession, WeeklyGrid } from "@/components/ui/weekly-grid";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "../../utils/trpc";
import { TimetableImportDialog } from "./timetable/TimetableImportDialog";

type Session = RouterOutputs["timetable"]["list"][number];
type ClassCourse = {
	id: string;
	code: string;
	teacher: string | null;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};

const NO_ROOM_SENTINEL = "__none__";
const ALL_TEACHERS = "__all_teachers__";
const ALL_COURSES = "__all_courses__";

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const sessionSchema = z
	.object({
		dayOfWeek: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
		startTime: z.string().regex(timeRe, "HH:MM required"),
		endTime: z.string().regex(timeRe, "HH:MM required"),
		roomId: z.string(),
		validFrom: z.string(),
		validUntil: z.string(),
	})
	.refine((d) => d.startTime < d.endTime, {
		message: "End time must be after start time",
		path: ["endTime"],
	})
	.refine((d) => !d.validFrom || !d.validUntil || d.validFrom <= d.validUntil, {
		message: "Valid until must be after valid from",
		path: ["validUntil"],
	});
type SessionForm = z.infer<typeof sessionSchema>;

const DEFAULT_SESSION: SessionForm = {
	dayOfWeek: "mon",
	startTime: "08:00",
	endTime: "10:00",
	roomId: NO_ROOM_SENTINEL,
	validFrom: "",
	validUntil: "",
};

export default function TimetableManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	// ── Filters ─────────────────────────────────────────────────────────────
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [classId, setClassId] = useState<string | null>(null);
	const [teacherId, setTeacherId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);

	// Initialize year filter to the active academic year
	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	const [yearInitialized, setYearInitialized] = useState(false);
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
		if (!yearInitialized && active) {
			setAcademicYearId(active);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

	const hasFilters = !!(
		academicYearId ||
		classId ||
		teacherId ||
		classCourseId
	);

	function clearFilters() {
		setAcademicYearId(null);
		setSemesterId(null);
		setClassId(null);
		setTeacherId(null);
		setClassCourseId(null);
		setYearInitialized(false); // allow re-init to active year on next mount
	}

	// ── Dialog state ─────────────────────────────────────────────────────────
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [editingSession, setEditingSession] = useState<Session | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const DAYS = [
		{ value: "mon", label: t("teacher.timetable.days.mon") },
		{ value: "tue", label: t("teacher.timetable.days.tue") },
		{ value: "wed", label: t("teacher.timetable.days.wed") },
		{ value: "thu", label: t("teacher.timetable.days.thu") },
		{ value: "fri", label: t("teacher.timetable.days.fri") },
		{ value: "sat", label: t("teacher.timetable.days.sat") },
	];

	const sessionForm = useForm<SessionForm>({
		resolver: zodResolver(sessionSchema),
		defaultValues: DEFAULT_SESSION,
	});

	// ── Queries ───────────────────────────────────────────────────────────────
	const { data: classCoursesData } = useQuery({
		queryKey: [
			"classCourses-for-timetable",
			academicYearId,
			classId,
			teacherId,
		],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				...(academicYearId ? { academicYearId } : {}),
				...(classId ? { classId } : {}),
				...(teacherId ? { teacherId } : {}),
				limit: 500,
			});
			return items as ClassCourse[];
		},
	});

	const { data: teachersData } = useQuery({
		queryKey: ["teachers-for-timetable-filter"],
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				role: "teacher",
				limit: 500,
			});
			return items;
		},
	});

	const sessionsQuery = useQuery(
		trpc.timetable.list.queryOptions({
			...(classCourseId ? { classCourseId } : {}),
			...(classId && !classCourseId ? { classId } : {}),
			...(teacherId && !classCourseId ? { teacherId } : {}),
			...(academicYearId ? { academicYearId } : {}),
			...(semesterId ? { semesterId } : {}),
		}),
	);

	const roomsQuery = useQuery(trpc.rooms.list.queryOptions({}));
	const activeRooms = (roomsQuery.data ?? []).filter((r) => r.isActive);
	const sessions: Session[] = sessionsQuery.data ?? [];
	const classCourses = classCoursesData ?? [];

	const selectedCourse = classCourseId
		? (classCourses.find((cc) => cc.id === classCourseId) ?? null)
		: null;
	const missingTeacherWarning =
		selectedCourse !== null &&
		selectedCourse !== undefined &&
		!selectedCourse.teacher;

	// ── Mutations ─────────────────────────────────────────────────────────────
	const invalidate = () => {
		queryClient.invalidateQueries(trpc.timetable.list.queryFilter({}));
	};

	function toastCapacityWarning(
		w: { roomCapacity: number; classSize: number } | null | undefined,
	) {
		if (!w) return;
		toast.warning(
			t("teacher.timetable.capacityWarning", {
				classSize: w.classSize,
				roomCapacity: w.roomCapacity,
			}),
		);
	}

	const createMutation = useMutation({
		mutationFn: (
			data: SessionForm & { classCourseId: string; academicYearId: string },
		) =>
			trpcClient.timetable.create.mutate({
				...data,
				roomId: data.roomId === NO_ROOM_SENTINEL ? undefined : data.roomId,
				validFrom: data.validFrom || undefined,
				validUntil: data.validUntil || undefined,
			}),
		onSuccess: (res) => {
			toast.success(t("teacher.timetable.toast.created"));
			toastCapacityWarning(res.capacityWarning);
			invalidate();
			setIsDialogOpen(false);
		},
		onError: (err) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: (data: { id: string } & SessionForm) =>
			trpcClient.timetable.update.mutate({
				...data,
				roomId: data.roomId === NO_ROOM_SENTINEL ? null : data.roomId,
				validFrom: data.validFrom || null,
				validUntil: data.validUntil || null,
			}),
		onSuccess: (res) => {
			toast.success(t("teacher.timetable.toast.updated"));
			toastCapacityWarning(res.capacityWarning);
			invalidate();
			setIsDialogOpen(false);
		},
		onError: (err) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.timetable.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("teacher.timetable.toast.deleted"));
			setDeleteConfirmId(null);
			invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	// ── Export ────────────────────────────────────────────────────────────────
	function handleExport() {
		const rows = sessions.map((s) => ({
			classCourseId: s.classCourseId,
			[t("teacher.timetable.course")]: s.classCourse?.courseRef?.name ?? "",
			[t("teacher.timetable.class")]: s.classCourse?.classRef?.name ?? "",
			dayOfWeek: s.dayOfWeek,
			startTime: s.startTime,
			endTime: s.endTime,
			validFrom: s.validFrom ?? "",
			validUntil: s.validUntil ?? "",
			[t("teacher.timetable.room")]: s.room ?? "",
			roomId: s.roomId ?? "",
		}));
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, t("teacher.timetable.title"));
		XLSX.writeFile(wb, "timetable.xlsx");
	}

	// ── Dialog helpers ────────────────────────────────────────────────────────
	function openCreate() {
		setEditingSession(null);
		sessionForm.reset(DEFAULT_SESSION);
		setIsDialogOpen(true);
	}

	function openEdit(session: GridSession) {
		const s = sessions.find((x) => x.id === session.id);
		if (!s) return;
		setEditingSession(s);
		sessionForm.reset({
			dayOfWeek: s.dayOfWeek as SessionForm["dayOfWeek"],
			startTime: s.startTime,
			endTime: s.endTime,
			roomId: s.roomId ?? NO_ROOM_SENTINEL,
			validFrom: s.validFrom ?? "",
			validUntil: s.validUntil ?? "",
		});
		setIsDialogOpen(true);
	}

	function openEditFromList(s: Session) {
		setEditingSession(s);
		sessionForm.reset({
			dayOfWeek: s.dayOfWeek as SessionForm["dayOfWeek"],
			startTime: s.startTime,
			endTime: s.endTime,
			roomId: s.roomId ?? NO_ROOM_SENTINEL,
			validFrom: s.validFrom ?? "",
			validUntil: s.validUntil ?? "",
		});
		setIsDialogOpen(true);
	}

	function onSessionSubmit(values: SessionForm) {
		if (editingSession) {
			updateMutation.mutate({ id: editingSession.id, ...values });
		} else {
			if (!classCourseId || !academicYearId) return;
			createMutation.mutate({ ...values, classCourseId, academicYearId });
		}
	}

	const gridSessions: GridSession[] = sessions.map((s) => ({
		id: s.id,
		dayOfWeek: s.dayOfWeek,
		startTime: s.startTime,
		endTime: s.endTime,
		room: s.room,
		label: s.classCourse?.courseRef?.name ?? s.classCourseId,
		subLabel: s.classCourse?.classRef?.name,
	}));

	const canAddSession = !!classCourseId && !!academicYearId;

	return (
		<div className="space-y-5">
			{/* ── Filter bar ─────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-end gap-3">
				<AcademicYearSelect
					value={academicYearId}
					onChange={(v) => {
						setAcademicYearId(v);
						setSemesterId(null);
						setClassId(null);
						setTeacherId(null);
						setClassCourseId(null);
					}}
					autoSelectActive={false}
					allowAll
					allLabel={t("teacher.timetable.allYears") ?? "Toutes les années"}
					className="w-48"
				/>
				{academicYearId && (
					<div className="w-44">
						<SemesterSelect
							academicYearId={academicYearId}
							value={semesterId}
							onChange={setSemesterId}
						/>
					</div>
				)}
				<div className="w-48">
					<ClassSelect
						academicYearId={academicYearId}
						value={classId}
						onChange={(v) => {
							setClassId(v);
							setClassCourseId(null);
						}}
					/>
				</div>
				<Select
					value={teacherId ?? ALL_TEACHERS}
					onValueChange={(v) => {
						setTeacherId(v === ALL_TEACHERS ? null : v);
						setClassCourseId(null);
					}}
				>
					<SelectTrigger className="w-48">
						<SelectValue placeholder={t("teacher.timetable.allTeachers")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_TEACHERS}>
							{t("teacher.timetable.allTeachers")}
						</SelectItem>
						{(teachersData ?? []).map((u) => (
							<SelectItem key={u.id} value={u.id}>
								{u.firstName} {u.lastName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={classCourseId ?? ALL_COURSES}
					onValueChange={(v) => setClassCourseId(v === ALL_COURSES ? null : v)}
				>
					<SelectTrigger className="w-60">
						<SelectValue placeholder={t("teacher.timetable.allCourses")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_COURSES}>
							{t("teacher.timetable.allCourses")}
						</SelectItem>
						{classCourses.map((cc) => (
							<SelectItem key={cc.id} value={cc.id}>
								{cc.courseRef?.name ?? cc.code}
								{cc.classRef && (
									<span className="ml-1 text-muted-foreground text-xs">
										— {cc.classRef.name}
									</span>
								)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{hasFilters && (
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-muted-foreground"
						onClick={clearFilters}
					>
						<XCircle className="size-4" />
						{t("common.clearFilters")}
					</Button>
				)}
			</div>

			{/* ── Action bar ──────────────────────────────────────────────────────── */}
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					{sessionsQuery.isSuccess && sessions.length > 0
						? `${sessions.length} séance${sessions.length > 1 ? "s" : ""}`
						: null}
				</p>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setImportOpen(true)}
					>
						<Upload className="mr-1.5 h-4 w-4" />
						{t("teacher.timetable.importCsv")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						disabled={sessions.length === 0}
					>
						<Download className="mr-1.5 h-4 w-4" />
						{t("teacher.timetable.export")}
					</Button>
					<Tooltip>
						<TooltipTrigger asChild>
							<span>
								<Button
									onClick={openCreate}
									size="sm"
									disabled={!canAddSession}
								>
									<Plus className="mr-2 h-4 w-4" />
									{t("teacher.timetable.newSession")}
								</Button>
							</span>
						</TooltipTrigger>
						{!canAddSession && (
							<TooltipContent>
								{t("teacher.timetable.selectCourse")}
							</TooltipContent>
						)}
					</Tooltip>
				</div>
			</div>

			{/* ── Missing teacher warning ──────────────────────────────────────── */}
			{missingTeacherWarning && (
				<div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
					<AlertTriangle className="h-4 w-4 shrink-0" />
					{t("teacher.timetable.warnings.missingTeacher")}
				</div>
			)}

			{/* ── Content ──────────────────────────────────────────────────────── */}
			{!hasFilters ? (
				<Empty>
					<EmptyHeader>
						<Calendar className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>{t("teacher.timetable.selectCourse")}</EmptyTitle>
					<EmptyDescription>
						{t("teacher.timetable.selectCourseDesc")}
					</EmptyDescription>
				</Empty>
			) : sessions.length === 0 && !sessionsQuery.isPending ? (
				<Empty>
					<EmptyHeader>
						<Calendar className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>{t("teacher.timetable.noSessions")}</EmptyTitle>
					<EmptyDescription>
						{t("teacher.timetable.noSessionsDesc")}
					</EmptyDescription>
				</Empty>
			) : (
				<>
					{/* Weekly grid — always shown when there are sessions */}
					<WeeklyGrid
						sessions={gridSessions}
						onSessionClick={openEdit}
						className="mb-4"
					/>

					{/* Session management list — only when a specific course is selected */}
					{classCourseId && sessions.length > 0 && (
						<div className="space-y-1.5">
							<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{selectedCourse?.courseRef?.name ??
									t("teacher.timetable.allCourses")}
							</p>
							{sessions.map((s) => (
								<div
									key={s.id}
									className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
								>
									<Badge variant="outline" className="shrink-0 text-xs">
										{DAYS.find((d) => d.value === s.dayOfWeek)?.label ??
											s.dayOfWeek}
									</Badge>
									<span className="font-medium tabular-nums">
										{s.startTime} – {s.endTime}
									</span>
									{(s.roomRef?.name ?? s.room) && (
										<span className="text-muted-foreground">
											{s.roomRef?.name ?? s.room}
										</span>
									)}
									{(s.validFrom || s.validUntil) && (
										<span className="ml-auto shrink-0 text-muted-foreground text-xs">
											{t("teacher.timetable.validity")}: {s.validFrom ?? "…"} →{" "}
											{s.validUntil ?? "…"}
										</span>
									)}
									<div className="ml-auto flex shrink-0 gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-muted-foreground hover:text-foreground"
											onClick={() => openEditFromList(s)}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive/70 hover:text-destructive"
											onClick={() => setDeleteConfirmId(s.id)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{/* ── Session dialog ────────────────────────────────────────────────── */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingSession
								? t("teacher.timetable.editSession")
								: t("teacher.timetable.newSession")}
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={sessionForm.handleSubmit(onSessionSubmit)}>
						<DialogBody className="space-y-4">
							<div>
								<label className="mb-1 block font-medium text-sm">
									{t("teacher.timetable.day")}
								</label>
								<Controller
									control={sessionForm.control}
									name="dayOfWeek"
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{DAYS.map((d) => (
													<SelectItem key={d.value} value={d.value}>
														{d.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block font-medium text-sm">
										{t("teacher.timetable.startTime")}
									</label>
									<Input type="time" {...sessionForm.register("startTime")} />
								</div>
								<div>
									<label className="mb-1 block font-medium text-sm">
										{t("teacher.timetable.endTime")}
									</label>
									<Input type="time" {...sessionForm.register("endTime")} />
									{sessionForm.formState.errors.endTime && (
										<p className="mt-1 text-destructive text-xs">
											{sessionForm.formState.errors.endTime.message}
										</p>
									)}
								</div>
							</div>
							<div>
								<label className="mb-1 block font-medium text-sm">
									{t("teacher.timetable.room")}
								</label>
								<Controller
									control={sessionForm.control}
									name="roomId"
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue
													placeholder={t("teacher.timetable.noRoom")}
												/>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NO_ROOM_SENTINEL}>
													{t("teacher.timetable.noRoom")}
												</SelectItem>
												{activeRooms.map((r) => (
													<SelectItem key={r.id} value={r.id}>
														{r.name}
														{r.capacity && (
															<span className="ml-1 text-muted-foreground text-xs">
																({r.capacity} {t("teacher.rooms.seats")})
															</span>
														)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{sessionForm.watch("roomId") === NO_ROOM_SENTINEL && (
									<p className="mt-1.5 flex items-center gap-1.5 text-amber-600 text-xs dark:text-amber-400">
										<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
										{t("teacher.timetable.warnings.noRoomSelected")}
									</p>
								)}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block font-medium text-sm">
										{t("teacher.timetable.validFrom")}
									</label>
									<Input type="date" {...sessionForm.register("validFrom")} />
								</div>
								<div>
									<label className="mb-1 block font-medium text-sm">
										{t("teacher.timetable.validUntil")}
									</label>
									<Input type="date" {...sessionForm.register("validUntil")} />
									{sessionForm.formState.errors.validUntil && (
										<p className="mt-1 text-destructive text-xs">
											{sessionForm.formState.errors.validUntil.message}
										</p>
									)}
								</div>
							</div>
						</DialogBody>
						<DialogFooter>
							{editingSession && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="mr-auto text-destructive/80 hover:text-destructive"
									onClick={() => {
										setIsDialogOpen(false);
										setDeleteConfirmId(editingSession.id);
									}}
								>
									<Trash2 className="mr-1.5 h-3.5 w-3.5" />
									{t("teacher.timetable.delete")}
								</Button>
							)}
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsDialogOpen(false)}
							>
								{t("teacher.timetable.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={createMutation.isPending || updateMutation.isPending}
							>
								{editingSession
									? t("teacher.timetable.save")
									: t("teacher.timetable.create")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* ── Delete confirmation ───────────────────────────────────────────── */}
			<AlertDialog
				open={!!deleteConfirmId}
				onOpenChange={(o) => {
					if (!o) setDeleteConfirmId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("teacher.timetable.confirmDelete")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("teacher.timetable.confirmDeleteDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("teacher.timetable.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() =>
								deleteConfirmId && deleteMutation.mutate(deleteConfirmId)
							}
							disabled={deleteMutation.isPending}
						>
							{t("teacher.timetable.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ── Import dialog ─────────────────────────────────────────────────── */}
			<TimetableImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				onImported={invalidate}
				classCourses={classCourses}
			/>
		</div>
	);
}
