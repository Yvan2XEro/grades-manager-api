import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	Calendar,
	Copy,
	Download,
	Pencil,
	Plus,
	Printer,
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
import { CopyTimetableDialog } from "./timetable/CopyTimetableDialog";
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
	const [copyOpen, setCopyOpen] = useState(false);
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
	const institutionQuery = useQuery(trpc.institutions.get.queryOptions());
	const activeRooms = (roomsQuery.data ?? []).filter((r) => r.isActive);
	const sessions: Session[] = sessionsQuery.data ?? [];
	const currentYearName =
		yearListQuery.data?.items.find((y) => y.id === academicYearId)?.name ??
		null;
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

	// ── Print ─────────────────────────────────────────────────────────────────
	function handlePrint() {
		if (sessions.length === 0) return;

		const inst = institutionQuery.data;

		const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
		const DAY_LABELS: Record<string, string> = {
			mon: "Lundi",
			tue: "Mardi",
			wed: "Mercredi",
			thu: "Jeudi",
			fri: "Vendredi",
			sat: "Samedi",
			sun: "Dimanche",
		};

		// Unique sorted time slots (start times)
		const timeSlots = [...new Set(sessions.map((s) => s.startTime))].sort();

		// Days present in filtered sessions, sorted by natural week order
		const days = [...new Set(sessions.map((s) => s.dayOfWeek))].sort(
			(a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
		);

		// Context metadata
		const uniqueClasses = [
			...new Set(
				sessions.map((s) => s.classCourse?.classRef?.name).filter(Boolean),
			),
		];
		const yearName =
			yearListQuery.data?.items.find((y) => y.id === academicYearId)?.name ??
			"";
		const contextLabel = [
			uniqueClasses.length <= 3
				? uniqueClasses.join(", ")
				: `${uniqueClasses.length} classes`,
			yearName,
		]
			.filter(Boolean)
			.join(" — ");

		// Institution branding
		const logoHtml = inst?.logoSvg
			? `<div class="logo">${inst.logoSvg}</div>`
			: inst?.logoUrl
				? `<img class="logo" src="${inst.logoUrl}" alt="Logo" />`
				: inst?.nameFr
					? `<div class="logo-initials">${inst.nameFr.slice(0, 2).toUpperCase()}</div>`
					: "";

		const instName = inst?.nameFr ?? inst?.nameEn ?? "";
		const instSub = [inst?.addressFr, inst?.contactPhone, inst?.contactEmail]
			.filter(Boolean)
			.join(" · ");

		// Build grid
		const headerCells = days
			.map((d) => `<th>${DAY_LABELS[d] ?? d}</th>`)
			.join("");

		const bodyRows = timeSlots
			.map((slot) => {
				const slotSessions = sessions.filter((s) => s.startTime === slot);
				const latestEnd =
					slotSessions
						.map((s) => s.endTime)
						.sort()
						.at(-1) ?? "";

				const cells = days
					.map((day) => {
						const daySessions = slotSessions.filter((s) => s.dayOfWeek === day);
						if (daySessions.length === 0) return "<td></td>";

						const cards = daySessions
							.map((s) => {
								const course = s.classCourse?.courseRef?.name ?? "";
								const cls =
									uniqueClasses.length > 1
										? (s.classCourse?.classRef?.name ?? "")
										: "";
								const tr = s.classCourse?.teacherRef as
									| { firstName?: string; lastName?: string }
									| null
									| undefined;
								const teacher = tr
									? `${tr.firstName ?? ""} ${tr.lastName ?? ""}`.trim()
									: "";
								const room = s.roomRef?.name ?? s.room ?? "";
								return `<div class="card">
  <div class="course">${course}</div>
  ${cls ? `<div class="meta">${cls}</div>` : ""}
  ${teacher ? `<div class="meta">${teacher}</div>` : ""}
  ${room ? `<div class="room">📍 ${room}</div>` : ""}
</div>`;
							})
							.join("");

						return `<td>${cards}</td>`;
					})
					.join("");

				return `<tr>
  <td class="time-col">
    <span class="ts">${slot}</span>
    ${latestEnd ? `<span class="te">${latestEnd}</span>` : ""}
  </td>
  ${cells}
</tr>`;
			})
			.join("");

		const printDate = new Date().toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});

		const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Emploi du temps${contextLabel ? ` — ${contextLabel}` : ""}</title>
<style>
@page { size: A4 landscape; margin: 1.2cm; }
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#111;}

/* Header */
.header{display:flex;align-items:center;gap:14px;border-bottom:2.5px solid #1e293b;padding-bottom:10px;margin-bottom:12px;}
.logo{width:60px;height:60px;object-fit:contain;flex-shrink:0;}
.logo svg{width:60px;height:60px;}
.logo-initials{width:60px;height:60px;border-radius:8px;background:#1e293b;color:#fff;font-size:20pt;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.inst{flex:1;}
.inst-name{font-size:13pt;font-weight:bold;color:#1e293b;line-height:1.2;}
.inst-sub{font-size:7.5pt;color:#64748b;margin-top:3px;}
.print-date{font-size:7.5pt;color:#94a3b8;text-align:right;align-self:flex-end;}

/* Title */
.title{text-align:center;font-size:12pt;font-weight:bold;color:#1e293b;margin-bottom:10px;}

/* Table */
table{width:100%;border-collapse:collapse;table-layout:fixed;}
col.tc{width:58px;}
th{background:#1e293b;color:#fff;padding:6px 5px;font-size:9pt;text-align:center;border:1px solid #334155;}
th.th-time{background:#334155;}
td{border:1px solid #e2e8f0;vertical-align:top;padding:3px;}
td.time-col{background:#f8fafc;text-align:center;vertical-align:middle;padding:4px;border-color:#cbd5e1;}
.ts{display:block;font-weight:bold;font-size:9pt;color:#334155;}
.te{display:block;font-size:7pt;color:#94a3b8;}

/* Cards */
.card{background:#eff6ff;border-left:3px solid #3b82f6;border-radius:2px;padding:4px 5px;margin-bottom:3px;}
.card:last-child{margin-bottom:0;}
.course{font-weight:bold;font-size:8.5pt;color:#1e3a5f;line-height:1.3;}
.meta{font-size:7.5pt;color:#475569;margin-top:1px;}
.room{font-size:7pt;color:#6366f1;margin-top:1px;}

/* Footer */
.footer{margin-top:12px;border-top:1px solid #e2e8f0;padding-top:7px;display:flex;justify-content:space-between;font-size:7.5pt;color:#94a3b8;}
</style>
</head>
<body>
<div class="header">
  ${logoHtml}
  <div class="inst">
    ${instName ? `<div class="inst-name">${instName}</div>` : ""}
    ${instSub ? `<div class="inst-sub">${instSub}</div>` : ""}
  </div>
  <div class="print-date">Généré le ${printDate}</div>
</div>

<div class="title">Emploi du Temps${contextLabel ? ` — ${contextLabel}` : ""}</div>

<table>
  <colgroup>
    <col class="tc"/>
    ${days.map(() => "<col/>").join("")}
  </colgroup>
  <thead>
    <tr><th class="th-time">Heure</th>${headerCells}</tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table>

<div class="footer">
  <span>${[uniqueClasses.slice(0, 5).join(", "), yearName].filter(Boolean).join(" · ")}</span>
  <span>${sessions.length} séance${sessions.length > 1 ? "s" : ""}</span>
</div>

<script>window.addEventListener("load",function(){window.print();});</script>
</body>
</html>`;

		const w = window.open("", "_blank", "width=1200,height=800");
		if (!w) return;
		w.document.write(html);
		w.document.close();
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
						onClick={() => setCopyOpen(true)}
						disabled={!academicYearId}
					>
						<Copy className="mr-1.5 h-4 w-4" />
						{t("teacher.timetable.copyFromYear")}
					</Button>
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
					<Button
						variant="outline"
						size="sm"
						onClick={handlePrint}
						disabled={sessions.length === 0}
					>
						<Printer className="mr-1.5 h-4 w-4" />
						{t("teacher.timetable.print")}
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

			{/* ── Copy timetable dialog ───────────────────────────────────────────── */}
			<CopyTimetableDialog
				open={copyOpen}
				onOpenChange={setCopyOpen}
				currentYearId={academicYearId}
				currentYearName={currentYearName}
			/>
		</div>
	);
}
