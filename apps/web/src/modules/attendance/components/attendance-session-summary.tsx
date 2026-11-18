import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { AttendanceSessionsState } from "../hooks/use-attendance-session";
import type { AttendanceStatusConfig } from "../hooks/use-attendance-status";
import type { AttendanceStatus } from "../types";

/** Session title with its status badges, then the counts and absent / late list. */
export function AttendanceSessionSummary({
	state,
	statusConfig,
}: {
	state: AttendanceSessionsState;
	statusConfig: AttendanceStatusConfig;
}) {
	const { t } = useTranslation();
	const { selectedSession, sessionDetail, roster, summary } = state;
	if (!selectedSession) return null;
	return (
		<>
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
				{sessionDetail && roster.length > 0 && (
					<div className="flex gap-2">
						{(
							Object.entries(state.statusCounts()) as [
								AttendanceStatus,
								number,
							][]
						).map(([status, count]) =>
							count > 0 ? (
								<Badge
									key={status}
									variant="outline"
									className={`text-xs ${statusConfig[status].color}`}
								>
									{count} {statusConfig[status].label}
								</Badge>
							) : null,
						)}
					</div>
				)}
			</div>

			{summary && (
				<div className="mb-4 space-y-2">
					<div className="grid grid-cols-4 gap-2">
						{(
							["present", "late", "absent", "excused"] as AttendanceStatus[]
						).map((status) => (
							<div
								key={status}
								className={`rounded-md border px-3 py-2 text-center text-xs ${statusConfig[status].color}`}
							>
								<div className="font-bold text-lg">
									{summary.counts[status]}
								</div>
								<div>{statusConfig[status].label}</div>
							</div>
						))}
					</div>
					{summary.absentOrLate.length > 0 && (
						<div className="rounded-md border bg-muted/30 px-3 py-2">
							<p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{t("teacher.attendanceManagement.absentOrLate")}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{summary.absentOrLate.map((s) => (
									<Badge
										key={s.studentId}
										variant="outline"
										className={`text-xs ${statusConfig[s.status as AttendanceStatus].color}`}
									>
										{s.firstName} {s.lastName}
										{s.registrationNumber ? ` (${s.registrationNumber})` : ""}
									</Badge>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</>
	);
}
