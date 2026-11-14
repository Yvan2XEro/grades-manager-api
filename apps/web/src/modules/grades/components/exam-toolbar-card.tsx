import { AlertTriangle, Download, Info, Lock, Upload } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { EntryExam } from "../types";

/**
 * Exam picker of the grade entry page with lock, template export / import and
 * the info / read-only notices.
 */
export function ExamToolbarCard({
	courseId,
	exams,
	selectedExam,
	selectedExamInfo,
	isExamLocked,
	canEditExam,
	inputsDisabled,
	hasStudents,
	onExamChange,
	onExportTemplate,
	onImportGrades,
	onLock,
	isLocking,
}: {
	courseId: string;
	exams: EntryExam[];
	selectedExam: string;
	selectedExamInfo?: EntryExam;
	isExamLocked: boolean;
	canEditExam: boolean;
	inputsDisabled: boolean;
	hasStudents: boolean;
	onExamChange: (examId: string) => void;
	onExportTemplate: () => void;
	onImportGrades: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onLock: () => void;
	isLocking: boolean;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div className="w-full space-y-2 md:max-w-sm">
						<Label htmlFor="exam">
							{t("teacher.gradeEntry.selectExam.label")}
						</Label>
						<Select
							value={selectedExam || undefined}
							onValueChange={onExamChange}
							disabled={exams.length === 0}
						>
							<SelectTrigger id="exam" data-testid="exam-select">
								<SelectValue
									placeholder={t("teacher.gradeEntry.selectExam.empty")}
								/>
							</SelectTrigger>
							<SelectContent>
								{exams.map((exam) => (
									<SelectItem key={exam.id} value={exam.id}>
										{exam.name} ({exam.percentage}%)
										{exam.sessionType === "retake"
											? ` [${t("teacher.exams.sessionType.retake")}]`
											: ""}{" "}
										{exam.isLocked
											? `(${t("teacher.gradeEntry.selectExam.lockedTag")})`
											: ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{selectedExam && (
						<div className="flex items-center gap-3">
							{isExamLocked ? (
								<Badge variant="secondary" className="flex items-center gap-2">
									<Lock className="h-4 w-4" />
									{t("teacher.gradeEntry.lockedChip")}
								</Badge>
							) : (
								<Button
									type="button"
									variant="outline"
									onClick={onLock}
									disabled={
										!selectedExam ||
										isLocking ||
										selectedExamInfo?.status !== "approved"
									}
									title={
										selectedExamInfo?.status !== "approved"
											? t("teacher.gradeEntry.actions.lockRequiresApproval", {
													defaultValue:
														"L'examen doit être approuvé avant verrouillage",
												})
											: undefined
									}
								>
									<Lock className="mr-2 h-4 w-4" />
									{t("teacher.gradeEntry.actions.lock")}
								</Button>
							)}
						</div>
					)}
				</div>

				{selectedExam && hasStudents && (
					<div className="flex flex-wrap items-center gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={onExportTemplate}
							disabled={!selectedExam || !hasStudents || inputsDisabled}
						>
							<Download className="mr-2 h-4 w-4" />
							{t("teacher.gradeEntry.actions.exportTemplate", {
								defaultValue: "Export Template",
							})}
						</Button>
						<div>
							<input
								type="file"
								id="import-grades"
								accept=".xlsx,.xls"
								className="hidden"
								onChange={onImportGrades}
								disabled={inputsDisabled}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									document.getElementById("import-grades")?.click()
								}
								disabled={!selectedExam || inputsDisabled}
							>
								<Upload className="mr-2 h-4 w-4" />
								{t("teacher.gradeEntry.actions.importGrades", {
									defaultValue: "Import Grades",
								})}
							</Button>
						</div>
					</div>
				)}

				{selectedExam && exams.length > 0 && (
					<Alert>
						<Info className="h-4 w-4" />
						<AlertTitle>{t("teacher.gradeEntry.info.title")}</AlertTitle>
						<AlertDescription>
							{t("teacher.gradeEntry.info.description")}
						</AlertDescription>
					</Alert>
				)}

				{selectedExam && !canEditExam && (
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>
							{t("teacher.gradeEntry.readOnly.title", {
								defaultValue: "Read-only mode",
							})}
						</AlertTitle>
						<AlertDescription>
							{t("teacher.gradeEntry.readOnly.description", {
								defaultValue:
									"You can view this exam but cannot modify grades.",
							})}
						</AlertDescription>
					</Alert>
				)}

				{courseId && !selectedExam && (
					<p className="text-muted-foreground text-xs">
						{t("teacher.gradeEntry.selectExam.prompt")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
