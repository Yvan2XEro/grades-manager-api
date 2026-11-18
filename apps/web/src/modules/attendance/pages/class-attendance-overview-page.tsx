import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/data-table";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ListLayout } from "@/components/layouts/ListLayout";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useClassAttendanceOverview } from "../hooks/use-attendance-rates";
import { getClassAttendanceOverviewColumns } from "../table/class-attendance-overview-columns";

export default function ClassAttendanceOverviewPage() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classId, setClassId] = useState<string | null>(null);
	const { classes, rows, isLoading } = useClassAttendanceOverview(
		classId,
		academicYearId,
	);
	const columns = useMemo(() => getClassAttendanceOverviewColumns(t), [t]);

	return (
		<ListLayout
			toolbar={
				<div className="flex flex-wrap gap-4">
					<div className="w-52 space-y-1">
						<Label className="text-xs">
							{t("teacher.attendanceManagement.filterByYear")}
						</Label>
						<AcademicYearSelect
							value={academicYearId}
							onChange={(v) => {
								setAcademicYearId(v);
								setClassId(null);
							}}
						/>
					</div>
					<div className="w-52 space-y-1">
						<Label className="text-xs">
							{t("admin.attendance.overview.classLabel")}
						</Label>
						<Select
							value={classId ?? ""}
							onValueChange={(v) => setClassId(v || null)}
							disabled={!academicYearId}
						>
							<SelectTrigger className="text-xs">
								<SelectValue
									placeholder={t("admin.attendance.overview.classPlaceholder")}
								/>
							</SelectTrigger>
							<SelectContent>
								{classes.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			}
		>
			{!classId || !academicYearId ? (
				<Empty>
					<EmptyHeader>
						<span className="text-3xl text-muted-foreground/40">📊</span>
					</EmptyHeader>
					<EmptyTitle>{t("admin.attendance.overview.emptyTitle")}</EmptyTitle>
					<EmptyDescription>
						{t("admin.attendance.overview.emptyDescription")}
					</EmptyDescription>
				</Empty>
			) : isLoading ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : (
				<DataTable
					columns={columns}
					data={rows}
					empty={
						<Empty>
							<EmptyHeader>
								<span className="text-3xl text-muted-foreground/40">📭</span>
							</EmptyHeader>
							<EmptyTitle>{t("admin.attendance.overview.noData")}</EmptyTitle>
						</Empty>
					}
				/>
			)}
		</ListLayout>
	);
}
