import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { AttendanceSessionsState } from "../hooks/use-attendance-session";
import type { AttendanceStatusConfig } from "../hooks/use-attendance-status";
import type { AttendanceStatus } from "../types";

const MARKABLE: AttendanceStatus[] = ["present", "absent", "late"];

/** "Mark all" buttons and the per-student marking sheet of a session. */
export function AttendanceMarkingTable({
	state,
	statusConfig,
}: {
	state: AttendanceSessionsState;
	statusConfig: AttendanceStatusConfig;
}) {
	const { t } = useTranslation();
	const { roster, recordMap, updateRecord } = state;

	if (roster.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				{t("teacher.attendanceManagement.noSession")}
			</p>
		);
	}

	return (
		<>
			<div className="mb-4 flex flex-wrap gap-2">
				<span className="self-center text-muted-foreground text-sm">
					{t("teacher.attendanceManagement.marked")}:
				</span>
				{MARKABLE.map((s) => (
					<Button
						key={s}
						variant="outline"
						size="sm"
						className={`text-xs ${statusConfig[s].color}`}
						onClick={() => state.markAll(s)}
						disabled={state.bulkMarkPending}
					>
						{statusConfig[s].icon}
						<span className="ml-1">{statusConfig[s].label}</span>
					</Button>
				))}
			</div>

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
									className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
								>
									<td className="px-4 py-2 font-medium">{studentName}</td>
									<td className="px-4 py-2 text-muted-foreground text-xs">
										{r.student?.registrationNumber ?? "—"}
									</td>
									<td className="px-4 py-2">
										<div className="flex gap-1">
											{MARKABLE.map((s) => (
												<button
													key={s}
													type="button"
													disabled={updateRecord.isPending}
													onClick={() =>
														updateRecord.mutate({
															studentId: r.studentId,
															status: s,
														})
													}
													className={`flex items-center gap-1 rounded px-2 py-0.5 font-medium text-xs transition-all ${
														currentStatus === s
															? statusConfig[s].color
															: "bg-muted text-muted-foreground hover:bg-accent"
													}`}
													title={statusConfig[s].label}
												>
													{statusConfig[s].icon}
													<span className="hidden sm:inline">
														{statusConfig[s].label}
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
														state.openExcuse(record.id, studentName)
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
												{t("teacher.attendanceManagement.toast.excused")} ✓
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
	);
}
