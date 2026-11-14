import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Confirm } from "@/components/callable/confirm";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { type GridSession, WeeklyGrid } from "@/components/ui/weekly-grid";
import { trpc } from "@/utils/trpc";
import { CopyTimetableDialog } from "../components/copy-timetable-dialog";
import { TimetableActions } from "../components/timetable-actions";
import { TimetableFilters } from "../components/timetable-filters";
import { TimetableImportDialog } from "../components/timetable-import-dialog";
import { TimetableSessionDialog } from "../components/timetable-session-dialog";
import { TimetableSessionList } from "../components/timetable-session-list";
import {
	useDeleteSession,
	useInvalidateTimetable,
	useTimetableClassCourses,
	useTimetableSessions,
	useTimetableTeachers,
} from "../hooks/use-timetable";
import { useTimetableFilters } from "../hooks/use-timetable-filters";
import { toGridSession } from "../services/grid-sessions";
import { exportTimetableExcel } from "../services/timetable-excel-export";
import { printTimetable } from "../services/timetable-print";
import type { Session } from "../types";

function EmptyTimetable({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<Empty>
			<EmptyHeader>
				<Calendar className="h-8 w-8 text-muted-foreground/40" />
			</EmptyHeader>
			<EmptyTitle>{title}</EmptyTitle>
			<EmptyDescription>{description}</EmptyDescription>
		</Empty>
	);
}

export default function TimetablePage() {
	const { t } = useTranslation();
	const filters = useTimetableFilters();
	const { academicYearId, classCourseId } = filters;

	const classCourses = useTimetableClassCourses(filters);
	const teachers = useTimetableTeachers();
	const sessionsQuery = useTimetableSessions(filters);
	const { sessions } = sessionsQuery;
	const institutionQuery = useQuery(trpc.institutions.get.queryOptions());
	const invalidate = useInvalidateTimetable();
	const deleteSession = useDeleteSession();

	const selectedCourse = classCourseId
		? (classCourses.find((cc) => cc.id === classCourseId) ?? null)
		: null;
	const missingTeacherWarning =
		selectedCourse !== null && !selectedCourse.teacher;
	const canAddSession = !!classCourseId && !!academicYearId;

	const confirmDeleteSession = (id: string) =>
		Confirm.call({
			title: t("teacher.timetable.confirmDelete"),
			description: t("teacher.timetable.confirmDeleteDesc"),
			confirmLabel: t("teacher.timetable.delete"),
			cancelLabel: t("teacher.timetable.cancel"),
			mutationFn: async (call) => {
				try {
					await deleteSession.mutateAsync(id);
					call.end(true);
				} catch {
					// toast shown by the mutation
				}
			},
		});

	const openSession = async (session?: Session) => {
		const result = await TimetableSessionDialog.call(
			session
				? { session }
				: {
						classCourseId: classCourseId ?? undefined,
						academicYearId: academicYearId ?? undefined,
					},
		);
		if (result === "delete" && session) confirmDeleteSession(session.id);
	};

	const openFromGrid = (gridSession: GridSession) => {
		const session = sessions.find((x) => x.id === gridSession.id);
		if (session) openSession(session);
	};

	return (
		<div className="space-y-5">
			<TimetableFilters
				filters={filters}
				teachers={teachers}
				classCourses={classCourses}
			/>

			<TimetableActions
				summary={
					sessionsQuery.isSuccess && sessions.length > 0
						? `${sessions.length} séance${sessions.length > 1 ? "s" : ""}`
						: null
				}
				canCopy={!!academicYearId}
				canExport={sessions.length > 0}
				canAddSession={canAddSession}
				onCopy={() =>
					CopyTimetableDialog.call({
						currentYearId: academicYearId,
						currentYearName: filters.currentYearName,
					})
				}
				onImport={() =>
					TimetableImportDialog.call({ onImported: invalidate, classCourses })
				}
				onExport={() => exportTimetableExcel(sessions, t)}
				onPrint={() =>
					printTimetable(
						sessions,
						institutionQuery.data,
						filters.currentYearName ?? "",
					)
				}
				onAddSession={() => openSession()}
			/>

			{missingTeacherWarning && (
				<div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
					<AlertTriangle className="h-4 w-4 shrink-0" />
					{t("teacher.timetable.warnings.missingTeacher")}
				</div>
			)}

			{!filters.hasFilters ? (
				<EmptyTimetable
					title={t("teacher.timetable.selectCourse")}
					description={t("teacher.timetable.selectCourseDesc")}
				/>
			) : sessions.length === 0 && !sessionsQuery.isPending ? (
				<EmptyTimetable
					title={t("teacher.timetable.noSessions")}
					description={t("teacher.timetable.noSessionsDesc")}
				/>
			) : (
				<>
					{/* Weekly grid — always shown when there are sessions */}
					<WeeklyGrid
						sessions={sessions.map((s) => toGridSession(s))}
						onSessionClick={openFromGrid}
						className="mb-4"
					/>

					{/* Session management list — only when a specific course is selected */}
					{classCourseId && sessions.length > 0 && (
						<TimetableSessionList
							title={
								selectedCourse?.courseRef?.name ??
								t("teacher.timetable.allCourses")
							}
							sessions={sessions}
							onEdit={openSession}
							onDelete={(s) => confirmDeleteSession(s.id)}
						/>
					)}
				</>
			)}
		</div>
	);
}
