import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { useStore } from "@/store";
import { trpc, trpcClient } from "@/utils/trpc";
import { CreateAttendanceSessionDialog } from "../components/create-attendance-session-dialog";
import { ExcuseAbsenceDialog } from "../components/excuse-absence-dialog";
import type { AttendanceSession, AttendanceStatus } from "../types";

type ExcusePolicy = {
	acceptedCategories?: string[];
	requiresDocument?: boolean;
	approvalDeadlineDays?: number | null;
};

/** Absence excuse rules of the institution (categories, mandatory document). */
function useExcusePolicy() {
	const institutionQuery = useQuery(trpc.institutions.get.queryOptions());
	const excusePolicy =
		(
			institutionQuery.data?.metadata as {
				attendance_excuse_policy?: ExcusePolicy;
			}
		)?.attendance_excuse_policy ?? {};
	return {
		acceptedCategories: Array.isArray(excusePolicy.acceptedCategories)
			? excusePolicy.acceptedCategories.filter(Boolean)
			: [],
		requiresDocument: excusePolicy.requiresDocument === true,
	};
}

/**
 * Attendance sessions of a class course and the marking sheet of the selected
 * one: records, summary, roster and the marking / excuse actions.
 */
export function useAttendanceSessions({
	academicYearId,
	classCourseId,
}: {
	academicYearId: string | null;
	classCourseId: string | null;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedSession, setSelectedSession] =
		useState<AttendanceSession | null>(null);
	const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);
	const excusePolicy = useExcusePolicy();

	// Only catalog managers may list every session; others must pick a course
	const canManageCatalog = useStore(
		(state) => state.user?.permissions.canManageCatalog ?? false,
	);
	const sessionsQuery = useQuery({
		...trpc.attendance.listSessions.queryOptions({
			...(classCourseId ? { classCourseId } : {}),
			...(academicYearId ? { academicYearId } : {}),
		}),
		enabled: canManageCatalog || Boolean(classCourseId),
	});
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

	const invalidateSessions = () => {
		queryClient.invalidateQueries(trpc.attendance.listSessions.queryFilter({}));
	};
	const invalidateDetail = () => {
		if (selectedSession)
			queryClient.invalidateQueries(
				trpc.attendance.getSession.queryFilter({ id: selectedSession.id }),
			);
	};

	const bulkMark = useMutation({
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

	const updateRecord = useMutation({
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

	const sessionDetail = sessionDetailQuery.data;
	const roster = rosterQuery.data ?? [];
	// studentId → record of the selected session
	const recordMap = new Map(
		(sessionDetail?.records ?? []).map((r) => [r.studentId, r]),
	);

	const markAll = (status: AttendanceStatus) =>
		bulkMark.mutate(roster.map((r) => ({ studentId: r.studentId, status })));

	const openExcuse = (recordId: string, studentName: string) =>
		ExcuseAbsenceDialog.call({
			recordId,
			studentName,
			...excusePolicy,
			onExcused: () => {
				invalidateDetail();
				invalidateSessions();
			},
		});

	const createSession = async () => {
		if (!classCourseId) return;
		const session = await CreateAttendanceSessionDialog.call({
			classCourseId,
			academicYearId,
		});
		if (session) setPendingSelectId(session.id);
	};

	const statusCounts = () => {
		const counts = { present: 0, absent: 0, late: 0, excused: 0 };
		for (const [, r] of recordMap) {
			counts[r.status as AttendanceStatus]++;
		}
		return counts;
	};

	return {
		sessions,
		sessionsPending: sessionsQuery.isPending,
		selectedSession,
		setSelectedSession,
		sessionDetail,
		summary: sessionSummaryQuery.data,
		roster,
		recordMap,
		statusCounts,
		markAll,
		bulkMarkPending: bulkMark.isPending,
		updateRecord,
		openExcuse,
		createSession,
	};
}

export type AttendanceSessionsState = ReturnType<typeof useAttendanceSessions>;
