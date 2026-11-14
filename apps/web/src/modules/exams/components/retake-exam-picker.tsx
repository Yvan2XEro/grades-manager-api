import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { RetakeExamSelection } from "../hooks/use-retake-eligibility";

/** Picks the approved exam whose retake eligibility is shown. */
export function RetakeExamPicker({
	selection,
}: {
	selection: RetakeExamSelection;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("admin.retake.selectExam")}</CardTitle>
				<CardDescription>
					{t("admin.retake.selectExamPlaceholder")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-4">
					<div className="flex flex-col gap-2">
						<Label>{t("admin.exams.filters.academicYear")}</Label>
						<AcademicYearSelect
							value={selection.academicYearId}
							onChange={selection.setAcademicYearId}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label>
							{t("admin.classes.filters.semester", {
								defaultValue: "Semester",
							})}
						</Label>
						<SemesterSelect
							value={selection.semesterId}
							onChange={selection.setSemesterId}
						/>
					</div>
					<div className="flex flex-1 flex-col gap-2">
						<Label>{t("admin.retake.selectExam")}</Label>
						<Select
							value={selection.examId ?? ""}
							onValueChange={selection.setExamId}
							disabled={!selection.academicYearId || selection.examsLoading}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t("admin.retake.selectExamPlaceholder")}
								/>
							</SelectTrigger>
							<SelectContent>
								{selection.exams.map((exam) => (
									<SelectItem key={exam.id} value={exam.id}>
										{exam.name} - {exam.className ?? ""} (
										{format(new Date(exam.date), "MMM d, yyyy")})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
