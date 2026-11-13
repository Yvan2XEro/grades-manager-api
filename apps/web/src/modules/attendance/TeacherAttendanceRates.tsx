import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpcClient } from "@/utils/trpc";

export default function AttendanceRates() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["teacher-attendance-rates", academicYearId],
		queryFn: () =>
			trpcClient.attendance.myCoursesRates.query(
				academicYearId ? { academicYearId } : {},
			),
		enabled: academicYearId !== null,
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("teacher.attendanceRates.title")}
				description={t("teacher.attendanceRates.subtitle")}
			/>

			<div className="w-64">
				<AcademicYearSelect
					value={academicYearId ?? undefined}
					onChange={setAcademicYearId}
					placeholder={t("teacher.attendanceRates.selectYear")}
				/>
			</div>

			{!academicYearId ? (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<BarChart3 className="h-8 w-8 text-muted-foreground" />
						<EmptyDescription>
							{t("teacher.attendanceRates.selectYearPrompt")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent />
				</Empty>
			) : isLoading ? (
				<div className="space-y-2">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</div>
			) : !data || data.length === 0 ? (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyDescription>
							{t("teacher.attendanceRates.empty")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent />
				</Empty>
			) : (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("teacher.attendanceRates.columns.course")}
								</TableHead>
								<TableHead>
									{t("teacher.attendanceRates.columns.class")}
								</TableHead>
								<TableHead className="text-right">
									{t("teacher.attendanceRates.columns.sessions")}
								</TableHead>
								<TableHead className="text-right">
									{t("teacher.attendanceRates.columns.threshold")}
								</TableHead>
								<TableHead className="text-right">
									{t("teacher.attendanceRates.columns.belowThreshold")}
								</TableHead>
								<TableHead className="text-center">
									{t("teacher.attendanceRates.columns.excusedCountsAsAbsent")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((row) => (
								<TableRow key={row.classCourseId}>
									<TableCell>
										<div>
											<p className="font-medium text-sm">
												{row.courseName ?? row.courseCode}
											</p>
											{row.courseCode && row.courseName && (
												<p className="text-muted-foreground text-xs">
													{row.courseCode}
												</p>
											)}
										</div>
									</TableCell>
									<TableCell className="text-sm">
										{row.className ?? "—"}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{row.totalSessions}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{row.threshold != null ? `${row.threshold}%` : "—"}
									</TableCell>
									<TableCell className="text-right">
										{row.threshold != null ? (
											<span
												className={
													row.belowThreshold > 0
														? "font-medium text-destructive text-sm tabular-nums"
														: "text-sm tabular-nums"
												}
											>
												{row.belowThreshold}
											</span>
										) : (
											<span className="text-muted-foreground text-sm">—</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										{row.excusedCountsAsAbsent ? (
											<Badge variant="secondary" className="text-xs">
												{t("common.yes")}
											</Badge>
										) : (
											<Badge variant="outline" className="text-xs">
												{t("common.no")}
											</Badge>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
