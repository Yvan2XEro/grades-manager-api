import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	ChevronRight,
	ClipboardList,
	Clock,
	Plus,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../../components/ui/empty";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { type RouterOutputs, trpc, trpcClient } from "../../../utils/trpc";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type Session = RouterOutputs["attendance"]["listSessions"][number];
type SessionDetail = RouterOutputs["attendance"]["getSession"];
type RosterItem = RouterOutputs["attendance"]["getRoster"][number];

type ClassCourse = {
	id: string;
	code: string;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};

export default function AttendanceManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const STATUS_CONFIG: Record<
		AttendanceStatus,
		{ label: string; color: string; icon: React.ReactNode }
	> = {
		present: {
			label: t("teacher.attendanceManagement.status.present"),
			color: "bg-green-100 text-green-800 hover:bg-green-200",
			icon: <Check className="h-3.5 w-3.5" />,
		},
		absent: {
			label: t("teacher.attendanceManagement.status.absent"),
			color: "bg-red-100 text-red-800 hover:bg-red-200",
			icon: <X className="h-3.5 w-3.5" />,
		},
		late: {
			label: t("teacher.attendanceManagement.status.late"),
			color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
			icon: <Clock className="h-3.5 w-3.5" />,
		},
		excused: {
			label: t("teacher.attendanceManagement.status.excused"),
			color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
			icon: <ChevronRight className="h-3.5 w-3.5" />,
		},
	};

	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);
	const [selectedSession, setSelectedSession] = useState<Session | null>(null);
	const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);
	const [newSessionDate, setNewSessionDate] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [newCourseSessionId, setNewCourseSessionId] = useState<string | null>(
		null,
	);
	const [isExceptional, setIsExceptional] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
	const [excuseTarget, setExcuseTarget] = useState<{
		recordId: string;
		studentName: string;
	} | null>(null);
	const [excuseReason, setExcuseReason] = useState("");
	const [excuseCategory, setExcuseCategory] = useState("");
	const [justificationDocumentUrl, setJustificationDocumentUrl] = useState("");

	const institutionQuery = useQuery(trpc.institutions.get.queryOptions());
	const excusePolicy =
		(
			institutionQuery.data?.metadata as {
				attendance_excuse_policy?: {
					acceptedCategories?: string[];
					requiresDocument?: boolean;
					approvalDeadlineDays?: number | null;
				};
			}
		)?.attendance_excuse_policy ?? {};
	const acceptedCategories = Array.isArray(excusePolicy.acceptedCategories)
		? excusePolicy.acceptedCategories.filter(Boolean)
		: [];
	const requiresDocument = excusePolicy.requiresDocument === true;

	// Fetch class courses for selection
	const { data: classCoursesData } = useQuery({
		queryKey: ["classCourses-for-attendance", academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 500,
			});
			return items as ClassCourse[];
		},
	});

	const sessionsQuery = useQuery(
		trpc.attendance.listSessions.queryOptions({
			...(classCourseId ? { classCourseId } : {}),
			...(academicYearId ? { academicYearId } : {}),
		}),
	);

	const sessions = sessionsQuery.data ?? [];

	// Auto-select newly created session once sessions list refreshes
	useEffect(() => {
		if (!pendingSelectId) return;
		const s = sessions.find((s) => s.id === pendingSelectId);
		if (s) {
			setSelectedSession(s);
			setPendingSelectId(null);
		}
	}, [sessions, pendingSelectId]);

	const sessionDetailQuery = useQuery({
		...trpc.attendance.getSession.queryOptions({
			id: selectedSession?.id ?? "",
		}),
		enabled: !!selectedSession?.id,
	});

	const sessionSummaryQuery = useQuery({
		...trpc.attendance.getSessionSummary.queryOptions({
			sessionId: selectedSession?.id ?? "",
		}),
		enabled: !!selectedSession?.id,
	});

	const rosterQuery = useQuery({
		...trpc.attendance.getRoster.queryOptions({
			classCourseId: classCourseId ?? "",
		}),
		enabled: !!classCourseId,
	});

	const timetableSlotsQuery = useQuery({
		...trpc.timetable.list.queryOptions({
			classCourseId: classCourseId ?? "",
		}),
		enabled: !!classCourseId && createDialogOpen,
	});

	const invalidateSessions = () => {
		queryClient.invalidateQueries(trpc.attendance.listSessions.queryFilter({}));
	};
	const invalidateDetail = () => {
		if (selectedSession)
			queryClient.invalidateQueries(
				trpc.attendance.getSession.queryFilter({ id: selectedSession.id }),
			);
	};

	const createSessionMutation = useMutation({
		mutationFn: () =>
			trpcClient.attendance.createSession.mutate({
				classCourseId: classCourseId!,
				sessionDate: newSessionDate,
				courseSessionId: isExceptional
					? undefined
					: (newCourseSessionId ?? undefined),
				isExceptional: isExceptional || undefined,
			}),
		onSuccess: (session) => {
			toast.success(t("teacher.attendanceManagement.toast.sessionCreated"));
			setCreateDialogOpen(false);
			setNewCourseSessionId(null);
			setIsExceptional(false);
			setPendingSelectId(session.id);
			invalidateSessions();
		},
		onError: (err) => toast.error(err.message),
	});

	const bulkMarkMutation = useMutation({
		mutationFn: (records: { studentId: string; status: AttendanceStatus }[]) =>
			trpcClient.attendance.bulkMark.mutate({
				attendanceSessionId: selectedSession!.id,
				records,
			}),
		onSuccess: () => {
			toast.success(t("teacher.attendanceManagement.toast.marked"));
			invalidateDetail();
			invalidateSessions();
		},
		onError: (err) => toast.error(err.message),
	});

	const updateRecordMutation = useMutation({
		mutationFn: ({
			studentId,
			status,
		}: {
			studentId: string;
			status: AttendanceStatus;
		}) =>
			trpcClient.attendance.updateRecord.mutate({
				attendanceSessionId: selectedSession!.id,
				studentId,
				status,
			}),
		onSuccess: () => {
			invalidateDetail();
			invalidateSessions();
		},
		onError: (err) => toast.error(err.message),
	});

	const excuseMutation = useMutation({
		mutationFn: () =>
			trpcClient.attendance.excuseAbsence.mutate({
				attendanceRecordId: excuseTarget!.recordId,
				excuseReason,
				excuseCategory: excuseCategory || undefined,
				justificationDocumentUrl: justificationDocumentUrl || undefined,
				approve: true,
			}),
		onSuccess: () => {
			toast.success(t("teacher.attendanceManagement.toast.excused"));
			setExcuseDialogOpen(false);
			setExcuseReason("");
			setExcuseCategory("");
			setJustificationDocumentUrl("");
			invalidateDetail();
			invalidateSessions();
		},
		onError: (err) => toast.error(err.message),
	});

	const uploadJustificationMutation = useMutation({
		mutationFn: async (file: File) => {
			const base64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const result = String(reader.result ?? "");
					resolve(result.includes(",") ? result.split(",")[1] : result);
				};
				reader.onerror = () => reject(reader.error);
				reader.readAsDataURL(file);
			});
			return trpcClient.files.uploadAttendanceJustification.mutate({
				filename: file.name,
				mimeType: file.type || "application/octet-stream",
				base64,
			});
		},
		onSuccess: (stored) => {
			setJustificationDocumentUrl(stored.url);
			toast.success(t("teacher.attendanceManagement.toast.documentUploaded"));
		},
		onError: (err) => toast.error(err.message),
	});

	const sessionDetail = sessionDetailQuery.data;
	const roster = rosterQuery.data ?? [];

	// Build a map of studentId → record from session detail
	const recordMap = new Map(
		(sessionDetail?.records ?? []).map((r) => [r.studentId, r]),
	);

	function handleMarkAll(status: AttendanceStatus) {
		const records = roster.map((r) => ({
			studentId: r.studentId,
			status,
		}));
		bulkMarkMutation.mutate(records);
	}

	function handleOpenExcuse(recordId: string, studentName: string) {
		setExcuseTarget({ recordId, studentName });
		setExcuseReason("");
		setExcuseCategory("");
		setJustificationDocumentUrl("");
		setExcuseDialogOpen(true);
	}

	function summaryStats() {
		const counts = { present: 0, absent: 0, late: 0, excused: 0 };
		for (const [, r] of recordMap) {
			counts[r.status as AttendanceStatus]++;
		}
		return counts;
	}

	const classCourses = classCoursesData ?? [];

	return (
		<div className="flex h-full">
			{/* Left panel: session list */}
			<div className="flex w-72 shrink-0 flex-col gap-4 border-r p-4">
				<div>
					<h2 className="mb-3 font-semibold text-base">
						{t("teacher.attendanceManagement.title")}
					</h2>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-xs">
								{t("teacher.attendanceManagement.filterByYear")}
							</Label>
							<AcademicYearSelect
								value={academicYearId}
								onChange={(v) => {
									setAcademicYearId(v);
									setClassCourseId(null);
									setSelectedSession(null);
								}}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-xs">
								{t("teacher.attendanceManagement.course")}
							</Label>
							<Select
								value={classCourseId ?? ""}
								onValueChange={(v) => {
									setClassCourseId(v || null);
									setSelectedSession(null);
								}}
							>
								<SelectTrigger className="text-xs">
									<SelectValue
										placeholder={t(
											"teacher.attendanceManagement.filterByCourse",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{classCourses.map((cc) => (
										<SelectItem key={cc.id} value={cc.id}>
											{cc.courseRef?.name ?? cc.code}
											{cc.classRef && (
												<span className="ml-1 text-muted-foreground">
													— {cc.classRef.name}
												</span>
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{classCourseId && (
					<>
						<Button
							size="sm"
							className="w-full"
							onClick={() => setCreateDialogOpen(true)}
						>
							<Plus className="mr-1.5 h-3.5 w-3.5" />
							{t("teacher.attendanceManagement.newSession")}
						</Button>
						<div className="flex-1 space-y-1 overflow-y-auto">
							{sessions.length === 0 && !sessionsQuery.isPending && (
								<p className="py-4 text-center text-muted-foreground text-xs">
									{t("teacher.attendanceManagement.noSession")}
								</p>
							)}
							{sessions.map((s) => {
								const total = s.records.length;
								const present = s.records.filter(
									(r) => r.status === "present" || r.status === "late",
								).length;
								return (
									<button
										key={s.id}
										type="button"
										onClick={() => setSelectedSession(s)}
										className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
											selectedSession?.id === s.id
												? "bg-primary text-primary-foreground"
												: "hover:bg-accent"
										}`}
									>
										<div className="font-medium">
											{new Date(s.sessionDate).toLocaleDateString(undefined, {
												day: "2-digit",
												month: "short",
												year: "numeric",
											})}
										</div>
										{total > 0 && (
											<div className="text-xs opacity-70">
												{t("teacher.attendanceManagement.presentCount", {
													present,
													total,
												})}
											</div>
										)}
									</button>
								);
							})}
						</div>
					</>
				)}
			</div>

			{/* Right panel: marking sheet */}
			<div className="flex-1 overflow-auto p-6">
				{!selectedSession ? (
					<Empty>
						<EmptyHeader>
							<ClipboardList className="h-8 w-8 text-muted-foreground/40" />
						</EmptyHeader>
						<EmptyTitle>
							{t("teacher.attendanceManagement.noSession")}
						</EmptyTitle>
						<EmptyDescription>
							{t("teacher.attendanceManagement.subtitle")}
						</EmptyDescription>
					</Empty>
				) : (
					<div>
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h2 className="font-semibold text-lg">
									{new Date(selectedSession.sessionDate).toLocaleDateString(
										undefined,
										{
											weekday: "long",
											day: "2-digit",
											month: "long",
											year: "numeric",
										},
									)}
								</h2>
								<p className="text-muted-foreground text-sm">
									{sessionDetail?.classCourse?.courseRef?.name} —{" "}
									{sessionDetail?.classCourse?.classRef?.name}
								</p>
							</div>
							{/* Summary badges */}
							{sessionDetail && roster.length > 0 && (
								<div className="flex gap-2">
									{(
										Object.entries(summaryStats()) as [
											AttendanceStatus,
											number,
										][]
									).map(([status, count]) =>
										count > 0 ? (
											<Badge
												key={status}
												variant="outline"
												className={`text-xs ${STATUS_CONFIG[status].color}`}
											>
												{count} {STATUS_CONFIG[status].label}
											</Badge>
										) : null,
									)}
								</div>
							)}
						</div>

						{/* Session summary stats + absent/late panel */}
						{sessionSummaryQuery.data && (
							<div className="mb-4 space-y-2">
								<div className="grid grid-cols-4 gap-2">
									{(
										[
											"present",
											"late",
											"absent",
											"excused",
										] as AttendanceStatus[]
									).map((status) => (
										<div
											key={status}
											className={`rounded-md border px-3 py-2 text-center text-xs ${STATUS_CONFIG[status].color}`}
										>
											<div className="font-bold text-lg">
												{sessionSummaryQuery.data.counts[status]}
											</div>
											<div>{STATUS_CONFIG[status].label}</div>
										</div>
									))}
								</div>
								{sessionSummaryQuery.data.absentOrLate.length > 0 && (
									<div className="rounded-md border bg-muted/30 px-3 py-2">
										<p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
											{t("teacher.attendanceManagement.absentOrLate")}
										</p>
										<div className="flex flex-wrap gap-1.5">
											{sessionSummaryQuery.data.absentOrLate.map((s) => (
												<Badge
													key={s.studentId}
													variant="outline"
													className={`text-xs ${STATUS_CONFIG[s.status].color}`}
												>
													{s.firstName} {s.lastName}
													{s.registrationNumber
														? ` (${s.registrationNumber})`
														: ""}
												</Badge>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{roster.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								{t("teacher.attendanceManagement.noSession")}
							</p>
						) : (
							<>
								{/* Bulk actions */}
								<div className="mb-4 flex flex-wrap gap-2">
									<span className="self-center text-muted-foreground text-sm">
										{t("teacher.attendanceManagement.marked")}:
									</span>
									{(["present", "absent", "late"] as AttendanceStatus[]).map(
										(s) => (
											<Button
												key={s}
												variant="outline"
												size="sm"
												className={`text-xs ${STATUS_CONFIG[s].color}`}
												onClick={() => handleMarkAll(s)}
												disabled={bulkMarkMutation.isPending}
											>
												{STATUS_CONFIG[s].icon}
												<span className="ml-1">{STATUS_CONFIG[s].label}</span>
											</Button>
										),
									)}
								</div>

								{/* Roster table */}
								<div className="overflow-hidden rounded-md border">
									<table className="w-full text-sm">
										<thead className="bg-muted/50">
											<tr>
												<th className="px-4 py-2 text-left font-medium">
													{t("teacher.attendanceManagement.student")}
												</th>
												<th className="px-4 py-2 text-left font-medium">N°</th>
												<th className="px-4 py-2 text-left font-medium">
													{t("teacher.attendanceManagement.status.present")} /…
												</th>
												<th className="px-4 py-2 text-left font-medium">
													{t("teacher.attendanceManagement.excuse")}
												</th>
											</tr>
										</thead>
										<tbody>
											{roster.map((r, i) => {
												const record = recordMap.get(r.studentId);
												const currentStatus =
													(record?.status as AttendanceStatus) ?? null;
												const studentName = r.student?.profile
													? `${r.student.profile.firstName} ${r.student.profile.lastName}`
													: r.studentId;

												return (
													<tr
														key={r.studentId}
														className={
															i % 2 === 0 ? "bg-background" : "bg-muted/20"
														}
													>
														<td className="px-4 py-2 font-medium">
															{studentName}
														</td>
														<td className="px-4 py-2 text-muted-foreground text-xs">
															{r.student?.registrationNumber ?? "—"}
														</td>
														<td className="px-4 py-2">
															<div className="flex gap-1">
																{(
																	[
																		"present",
																		"absent",
																		"late",
																	] as AttendanceStatus[]
																).map((s) => (
																	<button
																		key={s}
																		type="button"
																		disabled={updateRecordMutation.isPending}
																		onClick={() =>
																			updateRecordMutation.mutate({
																				studentId: r.studentId,
																				status: s,
																			})
																		}
																		className={`flex items-center gap-1 rounded px-2 py-0.5 font-medium text-xs transition-all ${
																			currentStatus === s
																				? STATUS_CONFIG[s].color
																				: "bg-muted text-muted-foreground hover:bg-accent"
																		}`}
																		title={STATUS_CONFIG[s].label}
																	>
																		{STATUS_CONFIG[s].icon}
																		<span className="hidden sm:inline">
																			{STATUS_CONFIG[s].label}
																		</span>
																	</button>
																))}
															</div>
														</td>
														<td className="px-4 py-2">
															{record &&
																(record.status === "absent" ||
																	record.status === "late") && (
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-6 text-xs"
																		onClick={() =>
																			handleOpenExcuse(record.id, studentName)
																		}
																	>
																		{t("teacher.attendanceManagement.excuse")}
																	</Button>
																)}
															{record?.excuseReason && (
																<span
																	className="ml-1 text-muted-foreground text-xs"
																	title={record.excuseReason}
																>
																	{t(
																		"teacher.attendanceManagement.toast.excused",
																	)}{" "}
																	✓
																</span>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</>
						)}
					</div>
				)}
			</div>
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t("teacher.attendanceManagement.newSession")}
						</DialogTitle>
					</DialogHeader>
					<DialogBody className="space-y-4">
						<div>
							<Label>{t("teacher.attendanceManagement.createSession")}</Label>
							<Input
								type="date"
								className="mt-1"
								value={newSessionDate}
								onChange={(e) => setNewSessionDate(e.target.value)}
							/>
						</div>
						{!isExceptional && (
							<div>
								<Label className="mb-1 block">
									{t("teacher.attendanceManagement.timetableSlot")}
								</Label>
								<Select
									value={newCourseSessionId ?? ""}
									onValueChange={(v) => setNewCourseSessionId(v || null)}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"teacher.attendanceManagement.timetableSlotPlaceholder",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{(timetableSlotsQuery.data ?? []).length === 0 ? (
											<div className="px-3 py-2 text-muted-foreground text-sm">
												{t("teacher.attendanceManagement.noSlots")}
											</div>
										) : (
											(timetableSlotsQuery.data ?? []).map((slot) => (
												<SelectItem key={slot.id} value={slot.id}>
													{t(`teacher.timetable.days.${slot.dayOfWeek}`)}{" "}
													{slot.startTime}–{slot.endTime}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="flex items-center gap-2">
							<Checkbox
								id="isExceptional"
								checked={isExceptional}
								onCheckedChange={(checked) => {
									setIsExceptional(!!checked);
									if (checked) setNewCourseSessionId(null);
								}}
							/>
							<label htmlFor="isExceptional" className="cursor-pointer text-sm">
								{t("teacher.attendanceManagement.isExceptional")}
							</label>
						</div>
					</DialogBody>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setCreateDialogOpen(false);
								setNewCourseSessionId(null);
								setIsExceptional(false);
							}}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={() => createSessionMutation.mutate()}
							disabled={
								!classCourseId ||
								!newSessionDate ||
								(!isExceptional && !newCourseSessionId) ||
								createSessionMutation.isPending
							}
						>
							{t("common.create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog open={excuseDialogOpen} onOpenChange={setExcuseDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t("teacher.attendanceManagement.excuse")}
						</DialogTitle>
					</DialogHeader>
					<DialogBody className="space-y-3">
						{excuseTarget && (
							<p className="text-muted-foreground text-sm">
								{t("teacher.attendanceManagement.student")}:{" "}
								<span className="font-medium text-foreground">
									{excuseTarget.studentName}
								</span>
							</p>
						)}
						{acceptedCategories.length > 0 && (
							<div>
								<Label>
									{t("teacher.attendanceManagement.excuseCategory")}
								</Label>
								<Select
									value={excuseCategory}
									onValueChange={setExcuseCategory}
								>
									<SelectTrigger className="mt-1">
										<SelectValue
											placeholder={t(
												"teacher.attendanceManagement.excuseCategoryPlaceholder",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{acceptedCategories.map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div>
							<Label>{t("teacher.attendanceManagement.excuseReason")}</Label>
							<Textarea
								className="mt-1"
								placeholder={t(
									"teacher.attendanceManagement.excusePlaceholder",
								)}
								value={excuseReason}
								onChange={(e) => setExcuseReason(e.target.value)}
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label>
								{t("teacher.attendanceManagement.justificationDocument")}
								{requiresDocument ? " *" : ""}
							</Label>
							<Input
								type="file"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) uploadJustificationMutation.mutate(file);
								}}
							/>
							<Input
								value={justificationDocumentUrl}
								onChange={(event) =>
									setJustificationDocumentUrl(event.target.value)
								}
								placeholder={t(
									"teacher.attendanceManagement.justificationDocumentPlaceholder",
								)}
							/>
							{uploadJustificationMutation.isPending && (
								<p className="text-muted-foreground text-xs">
									{t("teacher.attendanceManagement.uploadingDocument")}
								</p>
							)}
						</div>
					</DialogBody>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setExcuseDialogOpen(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={() => excuseMutation.mutate()}
							disabled={
								!excuseReason.trim() ||
								(acceptedCategories.length > 0 && !excuseCategory) ||
								(requiresDocument && !justificationDocumentUrl.trim()) ||
								excuseMutation.isPending ||
								uploadJustificationMutation.isPending
							}
						>
							{t("teacher.attendanceManagement.submitExcuse")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
