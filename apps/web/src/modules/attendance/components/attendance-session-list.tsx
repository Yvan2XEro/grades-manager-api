import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { AttendanceSessionsState } from "../hooks/use-attendance-session";

/** "New session" button and the sessions of the selected class course. */
export function AttendanceSessionList({
	state,
}: {
	state: AttendanceSessionsState;
}) {
	const { t } = useTranslation();
	const { sessions, selectedSession } = state;
	return (
		<>
			<Button size="sm" className="w-full" onClick={state.createSession}>
				<Plus className="mr-1.5 h-3.5 w-3.5" />
				{t("teacher.attendanceManagement.newSession")}
			</Button>
			<div className="flex-1 space-y-1 overflow-y-auto">
				{sessions.length === 0 && !state.sessionsPending && (
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
							onClick={() => state.setSelectedSession(s)}
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
	);
}
