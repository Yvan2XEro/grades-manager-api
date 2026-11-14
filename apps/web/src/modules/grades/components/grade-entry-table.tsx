import { Check, Save } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { GradesByStudent, RosterStudent } from "../types";

/** One score input per student of the selected exam, with the save button. */
export function GradeEntryTable({
	selectedExam,
	students,
	gradesByStudent,
	inputsDisabled,
	register,
	errors,
	isSaving,
	isLocking,
	onSubmit,
}: {
	selectedExam: string;
	students: RosterStudent[];
	gradesByStudent: GradesByStudent;
	inputsDisabled: boolean;
	register: UseFormRegister<Record<string, unknown>>;
	errors: FieldErrors;
	isSaving: boolean;
	isLocking: boolean;
	onSubmit: () => void;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<form onSubmit={onSubmit} className="flex flex-col">
				<CardContent className="px-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("teacher.gradeEntry.table.registration")}
								</TableHead>
								<TableHead>{t("teacher.gradeEntry.table.student")}</TableHead>
								<TableHead>{t("teacher.gradeEntry.table.score")}</TableHead>
								<TableHead>{t("teacher.gradeEntry.table.status")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.map((student) => {
								const fieldName = `student_${student.id}` as const;
								const fieldError = errors[fieldName]?.message;
								return (
									<TableRow key={student.id}>
										<TableCell>{student.registrationNumber}</TableCell>
										<TableCell>
											{student.lastName}, {student.firstName}
										</TableCell>
										<TableCell>
											<div className="flex flex-col gap-1">
												<Input
													key={`${selectedExam}-${student.id}`}
													type="number"
													inputMode="decimal"
													min="0"
													max="20"
													step="0.25"
													className="w-28"
													disabled={inputsDisabled}
													{...register(`student_${student.id}`, {
														min: {
															value: 0,
															message: t("teacher.gradeEntry.validation.min"),
														},
														max: {
															value: 20,
															message: t("teacher.gradeEntry.validation.max"),
														},
													})}
												/>
												{fieldError ? (
													<p className="text-destructive text-xs">
														{fieldError}
													</p>
												) : null}
											</div>
										</TableCell>
										<TableCell>
											{gradesByStudent[student.id] !== undefined ? (
												<Badge variant="secondary" className="gap-1">
													<Check className="h-3 w-3" />
													{t("teacher.gradeEntry.status.graded")}
												</Badge>
											) : (
												<Badge variant="outline">
													{t("teacher.gradeEntry.status.notGraded")}
												</Badge>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
				{!inputsDisabled && (
					<CardFooter className="justify-end gap-2 border-t">
						<Button type="submit" disabled={isSaving || isLocking}>
							{isSaving ? (
								<>
									<Spinner className="mr-2 h-4 w-4 text-white" />
									{t("teacher.gradeEntry.actions.saving")}
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									{t("teacher.gradeEntry.actions.save")}
								</>
							)}
						</Button>
					</CardFooter>
				)}
			</form>
		</Card>
	);
}
