import {
	AlertTriangle,
	Clock,
	Download,
	Info,
	Lock,
	Send,
	Upload,
} from "lucide-react";
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
	onSubmitForReview,
	isSubmitting,
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
	onSubmitForReview: () => void;
	isSubmitting: boolean;
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
							) : selectedExamInfo?.status === "approved" ? (
								<Button
									type="button"
									variant="outline"
									onClick={onLock}
									disabled={isLocking}
								>
									<Lock className="mr-2 h-4 w-4" />
									{t("teacher.gradeEntry.actions.lock")}
								</Button>
							) : selectedExamInfo?.status === "submitted" ? (
								<Badge variant="secondary" className="flex items-center gap-2">
									<Clock className="h-4 w-4" />
									{t("teacher.gradeEntry.awaitingApproval")}
								</Badge>
							) : canEditExam ? (
								<Button
									type="button"
									onClick={onSubmitForReview}
									disabled={isSubmitting || !hasStudents}
								>
									<Send className="mr-2 h-4 w-4" />
									{selectedExamInfo?.status === "rejected"
										? t("teacher.gradeEntry.actions.resubmit")
										: t("teacher.gradeEntry.actions.submit")}
								</Button>
							) : null}
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
							{t("teacher.gradeEntry.actions.exportTemplate")}
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
								{t("teacher.gradeEntry.actions.importGrades")}
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
						<AlertTitle>{t("teacher.gradeEntry.readOnly.title")}</AlertTitle>
						<AlertDescription>
							{t("teacher.gradeEntry.readOnly.description")}
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
