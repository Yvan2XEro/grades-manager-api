import { Check, ChevronRight, Clock, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceStatus } from "../types";

export type AttendanceStatusConfig = Record<
	AttendanceStatus,
	{ label: string; color: string; icon: ReactNode }
>;

/** Label, colour classes and icon of each attendance status. */
export function useAttendanceStatusConfig(): AttendanceStatusConfig {
	const { t } = useTranslation();
	return {
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
}
