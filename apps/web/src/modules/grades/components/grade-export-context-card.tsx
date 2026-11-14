import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ExportClass } from "../types";
import { StepBadge } from "./export-ui";

/** Step 1 — academic year and class. */
export function GradeExportContextCard({
	selectedYear,
	selectedClass,
	classes,
	onYearChange,
	onClassChange,
}: {
	selectedYear: string;
	selectedClass: string;
	classes: ExportClass[] | undefined;
	onYearChange: (value: string | null) => void;
	onClassChange: (value: string) => void;
}) {
	const { t } = useTranslation();
	const classId = useId();

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-3 text-base">
					<StepBadge step={1} />
					Contexte
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>{t("admin.gradeExport.filters.academicYear")}</Label>
					<AcademicYearSelect
						value={selectedYear || null}
						onChange={onYearChange}
						placeholder={t("admin.gradeExport.filters.academicYearPlaceholder")}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={classId}>
						{t("admin.gradeExport.filters.class")}
					</Label>
					<Select
						disabled={!selectedYear}
						value={selectedClass || undefined}
						onValueChange={onClassChange}
					>
						<SelectTrigger id={classId}>
							<SelectValue
								placeholder={t("admin.gradeExport.filters.classPlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							{classes?.map((cls) => (
								<SelectItem key={cls.id} value={cls.id}>
									{cls.name} - {cls.program.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}
