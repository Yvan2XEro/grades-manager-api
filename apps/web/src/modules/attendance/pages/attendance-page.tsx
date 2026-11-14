import { ClipboardList } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { AttendanceClassCourseSelect } from "../components/attendance-class-course-select";
import { AttendanceMarkingTable } from "../components/attendance-marking-table";
import { AttendanceSessionList } from "../components/attendance-session-list";
import { AttendanceSessionSummary } from "../components/attendance-session-summary";
import { useAttendanceClassCourses } from "../hooks/use-attendance-class-courses";
import { useAttendanceSessions } from "../hooks/use-attendance-session";
import { useAttendanceStatusConfig } from "../hooks/use-attendance-status";

export default function AttendancePage() {
	const { t } = useTranslation();
	const statusConfig = useAttendanceStatusConfig();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);
	const classCourses = useAttendanceClassCourses(
		"classCourses-for-attendance",
		academicYearId,
	);
	const state = useAttendanceSessions({ academicYearId, classCourseId });

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
									state.setSelectedSession(null);
								}}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-xs">
								{t("teacher.attendanceManagement.course")}
							</Label>
							<AttendanceClassCourseSelect
								classCourses={classCourses}
								value={classCourseId}
								onChange={(id) => {
									setClassCourseId(id);
									state.setSelectedSession(null);
								}}
								placeholder={t("teacher.attendanceManagement.filterByCourse")}
								triggerClassName="text-xs"
							/>
						</div>
					</div>
				</div>

				{classCourseId && <AttendanceSessionList state={state} />}
			</div>

			{/* Right panel: marking sheet */}
			<div className="flex-1 overflow-auto p-6">
				{!state.selectedSession ? (
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
						<AttendanceSessionSummary
							state={state}
							statusConfig={statusConfig}
						/>
						<AttendanceMarkingTable state={state} statusConfig={statusConfig} />
					</div>
				)}
			</div>
		</div>
	);
}
