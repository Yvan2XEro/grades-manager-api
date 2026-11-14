import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClassInfo } from "../../types";

export function EnrollmentStatusCard({ classInfo }: { classInfo: ClassInfo }) {
	const { t } = useTranslation();
	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<div className="mb-3 flex items-center gap-2">
				<GraduationCap className="h-4 w-4 text-primary" />
				<span className="font-semibold text-foreground text-sm">
					{t("student.enrollment.title")}
				</span>
			</div>
			<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-xs">
				{classInfo.programInfo?.name && (
					<>
						<dt className="text-muted-foreground">
							{t("student.enrollment.program")}
						</dt>
						<dd className="truncate font-medium text-foreground">
							{classInfo.programInfo.name}
						</dd>
					</>
				)}
				<dt className="text-muted-foreground">
					{t("student.enrollment.class")}
				</dt>
				<dd className="font-medium text-foreground">{classInfo.name}</dd>
				{classInfo.academicYearInfo?.name && (
					<>
						<dt className="text-muted-foreground">
							{t("student.enrollment.year")}
						</dt>
						<dd className="font-medium text-foreground">
							{classInfo.academicYearInfo.name}
						</dd>
					</>
				)}
				{classInfo.cycleLevel?.code && (
					<>
						<dt className="text-muted-foreground">
							{t("student.enrollment.level")}
						</dt>
						<dd className="font-medium text-foreground">
							{classInfo.cycleLevel.code}
						</dd>
					</>
				)}
			</dl>
		</div>
	);
}
