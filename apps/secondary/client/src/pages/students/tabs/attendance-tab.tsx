import { CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

export function StudentAttendanceTab() {
	const { t } = useTranslation();
	return (
		<Card>
			<CardContent className="flex flex-col items-center gap-4 py-16">
				<CalendarCheck className="h-12 w-12 text-muted-foreground opacity-30" />
				<p className="font-medium text-muted-foreground">
					{t("attendance.coming_soon", "Attendance records coming soon.")}
				</p>
			</CardContent>
		</Card>
	);
}
