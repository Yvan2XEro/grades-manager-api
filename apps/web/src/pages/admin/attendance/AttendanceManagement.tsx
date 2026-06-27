import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	ChevronRight,
	ClipboardList,
	Clock,
	Plus,
	X,
} from "lucide-react";
import { useState } from "react";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
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

const STATUS_CONFIG: Record<
	AttendanceStatus,
	{ label: string; color: string; icon: React.ReactNode }
> = {
	present: {
		label: "Présent",
		color: "bg-green-100 text-green-800 hover:bg-green-200",
		icon: <Check className="h-3.5 w-3.5" />,
	},
	absent: {
		label: "Absent",
		color: "bg-red-100 text-red-800 hover:bg-red-200",
		icon: <X className="h-3.5 w-3.5" />,
	},
	late: {
		label: "Retard",
		color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
		icon: <Clock className="h-3.5 w-3.5" />,
	},
	excused: {
		label: "Excusé",
		color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
		icon: <ChevronRight className="h-3.5 w-3.5" />,
	},
};

type ClassCourse = {
	id: string;
	code: string;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};

export default function AttendanceManagement() {
	const queryClient = useQueryClient();

	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);
	const [selectedSession, setSelectedSession] = useState<Session | null>(null);
	const [newSessionDate, setNewSessionDate] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
	const [excuseTarget, setExcuseTarget] = useState<{
		recordId: string;
		studentName: string;
	} | null>(null);
	const [excuseReason, setExcuseReason] = useState("");

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

	const sessionDetailQuery = useQuery({
		...trpc.attendance.getSession.queryOptions({
			id: selectedSession?.id ?? "",
		}),
		enabled: !!selectedSession?.id,
	});

	const rosterQuery = useQuery({
		...trpc.attendance.getRoster.queryOptions({
			classCourseId: classCourseId ?? "",
		}),
		enabled: !!classCourseId,
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
			}),
		onSuccess: (session) => {
			toast.success("Séance créée");
			setCreateDialogOpen(false);
			invalidateSessions();
			setSelectedSession(sessions.find((s) => s.id === session.id) ?? null);
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
			toast.success("Présences enregistrées");
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
				approve: true,
			}),
		onSuccess: () => {
			toast.success("Absence excusée");
			setExcuseDialogOpen(false);
			setExcuseReason("");
			invalidateDetail();
			invalidateSessions();
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
					<h2 className="mb-3 font-semibold text-base">Présences</h2>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-xs">Année académique</Label>
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
							<Label className="mb-1 block text-xs">Cours</Label>
							<Select
								value={classCourseId ?? ""}
								onValueChange={(v) => {
									setClassCourseId(v || null);
									setSelectedSession(null);
								}}
							>
								<SelectTrigger className="text-xs">
									<SelectValue placeholder="Sélectionner…" />
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
							Nouvelle séance
						</Button>
						<div className="flex-1 space-y-1 overflow-y-auto">
							{sessions.length === 0 && !sessionsQuery.isPending && (
								<p className="py-4 text-center text-muted-foreground text-xs">
									Aucune séance
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
											{new Date(s.sessionDate).toLocaleDateString("fr-FR", {
												day: "2-digit",
												month: "short",
												year: "numeric",
											})}
										</div>
										{total > 0 && (
											<div className="text-xs opacity-70">
												{present}/{total} présents
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
						<EmptyTitle>Sélectionnez une séance</EmptyTitle>
						<EmptyDescription>
							Choisissez un cours et une séance pour saisir les présences.
						</EmptyDescription>
					</Empty>
				) : (
					<div>
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h2 className="font-semibold text-lg">
									Séance du{" "}
									{new Date(selectedSession.sessionDate).toLocaleDateString(
										"fr-FR",
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

						{roster.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								Aucun étudiant inscrit à ce cours.
							</p>
						) : (
							<>
								{/* Bulk actions */}
								<div className="mb-4 flex flex-wrap gap-2">
									<span className="self-center text-muted-foreground text-sm">
										Marquer tous :
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
													Étudiant
												</th>
												<th className="px-4 py-2 text-left font-medium">
													N° Inscription
												</th>
												<th className="px-4 py-2 text-left font-medium">
													Statut
												</th>
												<th className="px-4 py-2 text-left font-medium">
													Actions
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
																		"excused",
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
																		Excuser
																	</Button>
																)}
															{record?.excuseReason && (
																<span
																	className="ml-1 text-muted-foreground text-xs"
																	title={record.excuseReason}
																>
																	✓ justifié
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

			{/* Create session dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Nouvelle séance de présence</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-3">
						<div>
							<Label>Date de la séance</Label>
							<Input
								type="date"
								className="mt-1"
								value={newSessionDate}
								onChange={(e) => setNewSessionDate(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCreateDialogOpen(false)}
						>
							Annuler
						</Button>
						<Button
							onClick={() => createSessionMutation.mutate()}
							disabled={
								!classCourseId ||
								!newSessionDate ||
								createSessionMutation.isPending
							}
						>
							Créer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Excuse dialog */}
			<Dialog open={excuseDialogOpen} onOpenChange={setExcuseDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Justifier l'absence</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 py-3">
						{excuseTarget && (
							<p className="text-muted-foreground text-sm">
								Étudiant :{" "}
								<span className="font-medium text-foreground">
									{excuseTarget.studentName}
								</span>
							</p>
						)}
						<div>
							<Label>Motif</Label>
							<Textarea
								className="mt-1"
								placeholder="Maladie, événement familial…"
								value={excuseReason}
								onChange={(e) => setExcuseReason(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setExcuseDialogOpen(false)}
						>
							Annuler
						</Button>
						<Button
							onClick={() => excuseMutation.mutate()}
							disabled={!excuseReason.trim() || excuseMutation.isPending}
						>
							Valider l'excuse
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
