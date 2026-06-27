import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Download, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { type GridSession, WeeklyGrid } from "@/components/ui/weekly-grid";
import { toast } from "@/lib/toast";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { type RouterOutputs, trpc, trpcClient } from "../../utils/trpc";
import { TimetableImportDialog } from "./timetable/TimetableImportDialog";

type Session = RouterOutputs["timetable"]["list"][number];
type ClassCourse = {
	id: string;
	code: string;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};

const NO_ROOM_SENTINEL = "__none__";

const DEFAULT_FORM = {
	dayOfWeek: "mon",
	startTime: "08:00",
	endTime: "10:00",
	roomId: NO_ROOM_SENTINEL,
};

export default function TimetableManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [editingSession, setEditingSession] = useState<Session | null>(null);
	const [form, setForm] = useState(DEFAULT_FORM);

	const DAYS = [
		{ value: "mon", label: t("teacher.timetable.days.mon") },
		{ value: "tue", label: t("teacher.timetable.days.tue") },
		{ value: "wed", label: t("teacher.timetable.days.wed") },
		{ value: "thu", label: t("teacher.timetable.days.thu") },
		{ value: "fri", label: t("teacher.timetable.days.fri") },
		{ value: "sat", label: t("teacher.timetable.days.sat") },
	];

	const { data: classCoursesData } = useQuery({
		queryKey: ["classCourses-for-timetable", academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 500,
			});
			return items as ClassCourse[];
		},
		enabled: true,
	});

	const sessionsQuery = useQuery(
		trpc.timetable.list.queryOptions({
			...(classCourseId ? { classCourseId } : {}),
			...(academicYearId ? { academicYearId } : {}),
			...(semesterId ? { semesterId } : {}),
		}),
	);

	const roomsQuery = useQuery(trpc.rooms.list.queryOptions({}));
	const activeRooms = (roomsQuery.data ?? []).filter((r) => r.isActive);

	const sessions: Session[] = sessionsQuery.data ?? [];

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
			data: typeof DEFAULT_FORM & {
				classCourseId: string;
				academicYearId: string;
			},
		) =>
			trpcClient.timetable.create.mutate({
				...data,
				roomId: data.roomId === NO_ROOM_SENTINEL ? undefined : data.roomId,
				semesterId: semesterId ?? undefined,
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
		mutationFn: (data: { id: string } & Partial<typeof DEFAULT_FORM>) =>
			trpcClient.timetable.update.mutate({
				...data,
				roomId:
					data.roomId === NO_ROOM_SENTINEL
						? null
						: data.roomId !== undefined
							? data.roomId
							: undefined,
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
			invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	function handleExport() {
		const rows = sessions.map((s) => ({
			classCourseId: s.classCourseId,
			[t("teacher.timetable.course")]: s.classCourse?.courseRef?.name ?? "",
			[t("teacher.timetable.class")]: s.classCourse?.classRef?.name ?? "",
			dayOfWeek: s.dayOfWeek,
			startTime: s.startTime,
			endTime: s.endTime,
			[t("teacher.timetable.room")]: s.room ?? "",
			roomId: s.roomId ?? "",
		}));
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, t("teacher.timetable.title"));
		XLSX.writeFile(wb, "timetable.xlsx");
	}

	function openCreate() {
		setEditingSession(null);
		setForm(DEFAULT_FORM);
		setIsDialogOpen(true);
	}

	function openEdit(session: GridSession) {
		const s = sessions.find((x) => x.id === session.id);
		if (!s) return;
		setEditingSession(s);
		setForm({
			dayOfWeek: s.dayOfWeek,
			startTime: s.startTime,
			endTime: s.endTime,
			roomId: s.roomId ?? NO_ROOM_SENTINEL,
		});
		setIsDialogOpen(true);
	}

	function handleSubmit() {
		if (editingSession) {
			updateMutation.mutate({ id: editingSession.id, ...form });
		} else {
			if (!classCourseId || !academicYearId) return;
			createMutation.mutate({ ...form, classCourseId, academicYearId });
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

	const classCourses = classCoursesData ?? [];

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-xl">
						{t("teacher.timetable.title")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("teacher.timetable.subtitle")}
					</p>
				</div>
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
					{classCourseId && academicYearId && (
						<Button onClick={openCreate} size="sm">
							<Plus className="mr-2 h-4 w-4" />
							{t("teacher.timetable.newSession")}
						</Button>
					)}
				</div>
			</div>

			<div className="mb-6 flex flex-wrap gap-4">
				<div className="w-64">
					<Label className="mb-1.5 block text-xs">
						{t("teacher.timetable.filterByYear")}
					</Label>
					<AcademicYearSelect
						value={academicYearId}
						onChange={(v) => {
							setAcademicYearId(v);
							setSemesterId(null);
							setClassCourseId(null);
						}}
					/>
				</div>
				{academicYearId && (
					<div className="w-52">
						<Label className="mb-1.5 block text-xs">
							{t("teacher.timetable.filterBySemester")}
						</Label>
						<SemesterSelect
							academicYearId={academicYearId}
							value={semesterId}
							onChange={setSemesterId}
						/>
					</div>
				)}
				<div className="w-72">
					<Label className="mb-1.5 block text-xs">
						{t("teacher.timetable.filterByCourse")}
					</Label>
					<Select
						value={classCourseId ?? ""}
						onValueChange={(v) => setClassCourseId(v || null)}
					>
						<SelectTrigger>
							<SelectValue placeholder={t("teacher.timetable.selectCourse")} />
						</SelectTrigger>
						<SelectContent>
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
				</div>
			</div>

			{!classCourseId ? (
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
					<WeeklyGrid
						sessions={gridSessions}
						onSessionClick={openEdit}
						className="mb-4"
					/>
					<div className="mt-4 space-y-1">
						{sessions.map((s) => (
							<div
								key={s.id}
								className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
							>
								<span>
									<Badge variant="outline" className="mr-2 text-xs">
										{DAYS.find((d) => d.value === s.dayOfWeek)?.label ??
											s.dayOfWeek}
									</Badge>
									{s.startTime} – {s.endTime}
									{(s.roomRef?.name ?? s.room) && (
										<span className="ml-2 text-muted-foreground">
											({s.roomRef?.name ?? s.room})
										</span>
									)}
								</span>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-destructive hover:text-destructive"
									onClick={() => deleteMutation.mutate(s.id)}
									disabled={deleteMutation.isPending}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						))}
					</div>
				</>
			)}

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingSession
								? t("teacher.timetable.editSession")
								: t("teacher.timetable.newSession")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div>
							<Label>{t("teacher.timetable.day")}</Label>
							<Select
								value={form.dayOfWeek}
								onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: v }))}
							>
								<SelectTrigger className="mt-1">
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
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label>{t("teacher.timetable.startTime")}</Label>
								<Input
									type="time"
									className="mt-1"
									value={form.startTime}
									onChange={(e) =>
										setForm((f) => ({ ...f, startTime: e.target.value }))
									}
								/>
							</div>
							<div>
								<Label>{t("teacher.timetable.endTime")}</Label>
								<Input
									type="time"
									className="mt-1"
									value={form.endTime}
									onChange={(e) =>
										setForm((f) => ({ ...f, endTime: e.target.value }))
									}
								/>
							</div>
						</div>
						<div>
							<Label>{t("teacher.timetable.room")}</Label>
							<Select
								value={form.roomId}
								onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
							>
								<SelectTrigger className="mt-1">
									<SelectValue placeholder={t("teacher.timetable.noRoom")} />
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
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							{t("teacher.timetable.cancel")}
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={createMutation.isPending || updateMutation.isPending}
						>
							{editingSession
								? t("teacher.timetable.save")
								: t("teacher.timetable.create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<TimetableImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				onImported={invalidate}
			/>
		</div>
	);
}
