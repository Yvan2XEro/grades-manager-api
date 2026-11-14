import { CalendarDays, LockOpen, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { useToggleEnrollmentWindow } from "../hooks/use-enrollments";
import { BulkEnrollClassesDialog } from "./bulk-enroll-classes-dialog";
import { EnrollEntireClassDialog } from "./enroll-entire-class-dialog";

interface EnrollmentWindowCardProps {
	academicYearId: string;
	classId: string;
	semesterId: string;
	/** Semester of the class, used when no semester filter is set. */
	classSemesterId?: string;
	classes: Array<{ id: string; name: string }>;
	windowStatus?: { status: string } | null;
	studentsCount: number;
	coursesCount: number;
}

/** Enrollment window state of the class, with the bulk enroll and window actions. */
export function EnrollmentWindowCard({
	academicYearId: selectedAcademicYear,
	classId: selectedClass,
	semesterId: selectedSemester,
	classSemesterId,
	classes,
	windowStatus,
	studentsCount,
	coursesCount: classCoursesCount,
}: EnrollmentWindowCardProps) {
	const { t } = useTranslation();
	const toggleWindow = useToggleEnrollmentWindow(
		selectedClass,
		selectedAcademicYear,
	);
	const canAutoEnroll = Boolean(
		selectedAcademicYear &&
			selectedClass &&
			studentsCount > 0 &&
			classCoursesCount > 0,
	);

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<CalendarDays className="h-6 w-6 text-primary-700" />
					<div>
						<p className="font-semibold text-foreground">
							{windowStatus
								? t("admin.enrollments.windowStatus", {
										defaultValue: "Window: {{status}}",
										status: windowStatus.status,
									})
								: t("admin.enrollments.windowMissing", {
										defaultValue: "Window not configured",
									})}
						</p>
						<p className="text-muted-foreground text-xs">
							{windowStatus?.status === "open"
								? t("admin.enrollments.windowOpen", {
										defaultValue: "Students can enroll.",
									})
								: t("admin.enrollments.windowClosed", {
										defaultValue: "Window currently closed.",
									})}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="default"
						disabled={!selectedAcademicYear}
						onClick={() =>
							BulkEnrollClassesDialog.call({
								academicYearId: selectedAcademicYear,
								classes,
							})
						}
						title={
							!selectedAcademicYear
								? t("admin.enrollments.bulkEnroll.requireYear", {
										defaultValue: "Choisissez d'abord une année",
									})
								: undefined
						}
					>
						{t("admin.enrollments.bulkEnroll.openButton", {
							defaultValue: "Inscription de masse",
						})}
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={!canAutoEnroll}
						onClick={() =>
							EnrollEntireClassDialog.call({
								classId: selectedClass,
								academicYearId: selectedAcademicYear,
								semesterId: selectedSemester || classSemesterId,
								studentsCount,
								coursesCount: classCoursesCount,
							})
						}
					>
						{t("admin.enrollments.autoEnroll.button", {
							defaultValue: "Enroll entire class",
						})}
					</Button>
					<Button
						type="button"
						onClick={() => toggleWindow.mutate("open")}
						disabled={!selectedAcademicYear || !selectedClass}
					>
						<Unlock className="mr-1 h-4 w-4" />
						{t("admin.enrollments.actions.open", {
							defaultValue: "Open window",
						})}
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => toggleWindow.mutate("close")}
						disabled={!selectedAcademicYear || !selectedClass}
					>
						<LockOpen className="mr-1 h-4 w-4" />
						{t("admin.enrollments.actions.close", {
							defaultValue: "Close window",
						})}
					</Button>
				</div>
			</CardHeader>
		</Card>
	);
}
