import { CalendarCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

export function AttendanceOverview() {
	const { t } = useTranslation();
	const [classId, setClassId] = useState("");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

	const { data: classesData } = trpc.classes.list.useQuery({ pageSize: 200 });
	const classes = classesData?.items ?? [];

	return (
		<div className="space-y-5">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("attendance.title", "Attendance")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("attendance.subtitle", "Track attendance and absences")}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("attendance.class", "Class")}
					</label>
					<Select value={classId} onChange={(e) => setClassId(e.target.value)}>
						<SelectOption value="">
							{t("attendance.select_class", "— All classes —")}
						</SelectOption>
						{classes.map((c) => (
							<SelectOption key={c.id} value={c.id}>
								{c.name}
							</SelectOption>
						))}
					</Select>
				</div>
				<div>
					<label className="mb-1 block font-medium text-muted-foreground text-xs">
						{t("attendance.date", "Date")}
					</label>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
			</div>

			<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
				<CalendarCheck className="h-12 w-12 opacity-20" />
				<p className="font-medium">
					{t("attendance.select_prompt", "Select a class to view attendance")}
				</p>
				<p className="text-xs">
					{t(
						"attendance.coming_soon",
						"Attendance entry is available in the teacher workspace.",
					)}
				</p>
			</div>
		</div>
	);
}
