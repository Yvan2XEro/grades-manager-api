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
import { isValidScore } from "../services/score-cells";
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
								<TableHead className="hidden sm:table-cell">
									{t("teacher.gradeEntry.table.registration")}
								</TableHead>
								<TableHead>{t("teacher.gradeEntry.table.student")}</TableHead>
								<TableHead>{t("teacher.gradeEntry.table.score")}</TableHead>
								<TableHead className="hidden sm:table-cell">
									{t("teacher.gradeEntry.table.status")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.map((student) => {
								const fieldName = `student_${student.id}` as const;
								const message = errors[fieldName]?.message;
								const fieldError =
									typeof message === "string" ? message : undefined;
								const graded = gradesByStudent[student.id] !== undefined;
								return (
									<TableRow key={student.id}>
										<TableCell className="hidden sm:table-cell">
											{student.registrationNumber}
										</TableCell>
										<TableCell className="whitespace-normal">
											{student.lastName}, {student.firstName}
											{/* Phones: registration and status columns are hidden */}
											<span className="block text-muted-foreground text-xs sm:hidden">
												{student.registrationNumber}
											</span>
										</TableCell>
										<TableCell>
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-1.5">
													<Input
														key={`${selectedExam}-${student.id}`}
														type="text"
														inputMode="decimal"
														autoComplete="off"
														placeholder="/20"
														className="w-20 sm:w-28"
														aria-invalid={Boolean(fieldError)}
														disabled={inputsDisabled}
														{...register(`student_${student.id}`, {
															validate: (value) =>
																isValidScore(String(value ?? "")).ok ||
																t("teacher.gradeEntry.validation.range"),
														})}
													/>
													{graded && (
														<Check
															className="h-4 w-4 shrink-0 text-emerald-600 sm:hidden"
															aria-label={t("teacher.gradeEntry.status.graded")}
														/>
													)}
												</div>
												{fieldError ? (
													<p className="text-destructive text-xs">
														{fieldError}
													</p>
												) : null}
											</div>
										</TableCell>
										<TableCell className="hidden sm:table-cell">
											{graded ? (
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
					<CardFooter className="sticky bottom-0 z-10 justify-end gap-2 border-t bg-card/95 backdrop-blur">
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
