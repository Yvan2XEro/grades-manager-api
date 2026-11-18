import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/data-table";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ListLayout } from "@/components/layouts/ListLayout";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { useTeacherCoursesRates } from "../hooks/use-attendance-rates";
import { getTeacherAttendanceRatesColumns } from "../table/teacher-attendance-rates-columns";

export default function TeacherAttendanceRatesPage() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const { rows, isLoading } = useTeacherCoursesRates(academicYearId);
	const columns = useMemo(() => getTeacherAttendanceRatesColumns(t), [t]);

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("teacher.attendanceRates.title")}
					description={t("teacher.attendanceRates.subtitle")}
				/>
			}
			toolbar={
				<div className="w-64">
					<AcademicYearSelect
						value={academicYearId}
						onChange={setAcademicYearId}
						placeholder={t("teacher.attendanceRates.selectYear")}
					/>
				</div>
			}
		>
			{!academicYearId ? (
				<Empty className="m-4 border border-dashed">
					<EmptyHeader>
						<BarChart3 className="h-8 w-8 text-muted-foreground" />
						<EmptyDescription>
							{t("teacher.attendanceRates.selectYearPrompt")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent />
				</Empty>
			) : (
				<DataTable
					columns={columns}
					data={rows}
					isLoading={isLoading}
					empty={
						<Empty className="m-4 border border-dashed">
							<EmptyHeader>
								<EmptyDescription>
									{t("teacher.attendanceRates.empty")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent />
						</Empty>
					}
				/>
			)}
		</ListLayout>
	);
}
