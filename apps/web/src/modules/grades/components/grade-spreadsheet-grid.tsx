import { AlertCircle, Check, Lock, RotateCcw } from "lucide-react";
import { type KeyboardEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import type { SpreadsheetCells } from "../hooks/use-spreadsheet-cells";
import { cellKey } from "../services/score-cells";
import type { CellKey, RosterStudent, SpreadsheetExam } from "../types";

/**
 * Editable grid of the fast grade entry: one row per student, one column per
 * exam. Enter / arrows move between cells, Tab is native.
 */
export function GradeSpreadsheetGrid({
	students: filteredStudents,
	exams,
	cells: { values, states, errors, handleChange, handleBlur },
}: {
	students: RosterStudent[];
	exams: SpreadsheetExam[];
	cells: SpreadsheetCells;
}) {
	const { t } = useTranslation();

	// Refs for keyboard navigation
	const inputsRef = useRef<Record<CellKey, HTMLInputElement | null>>({});

	// Keyboard navigation
	const handleKeyDown = (
		e: KeyboardEvent<HTMLInputElement>,
		studentIdx: number,
		examIdx: number,
	) => {
		const focusCell = (sIdx: number, eIdx: number) => {
			const student = filteredStudents[sIdx];
			const exam = exams[eIdx];
			if (!student || !exam) return;
			const k = cellKey(student.id, exam.id);
			const el = inputsRef.current[k];
			if (el) {
				e.preventDefault();
				el.focus();
				el.select();
			}
		};

		if (e.key === "Enter" || e.key === "ArrowDown") {
			focusCell(studentIdx + 1, examIdx);
		} else if (e.key === "ArrowUp") {
			focusCell(studentIdx - 1, examIdx);
		} else if (
			e.key === "ArrowRight" &&
			(e.target as HTMLInputElement).selectionStart ===
				((e.target as HTMLInputElement).value?.length ?? 0)
		) {
			focusCell(studentIdx, examIdx + 1);
		} else if (
			e.key === "ArrowLeft" &&
			(e.target as HTMLInputElement).selectionStart === 0
		) {
			focusCell(studentIdx, examIdx - 1);
		}
		// Tab is native browser behavior — works left-to-right across exam columns
	};

	return (
		<table className="w-full border-collapse text-sm">
			<thead className="sticky top-0 z-10 bg-muted/50">
				<tr>
					<th className="sticky left-0 z-20 min-w-[220px] border-b bg-muted/50 px-3 py-2 text-left font-medium">
						{t("teacher.spreadsheet.studentCol", {
							defaultValue: "Étudiant",
						})}
					</th>
					<th className="border-b px-2 py-2 text-left font-normal text-muted-foreground text-xs">
						{t("teacher.spreadsheet.matricule", {
							defaultValue: "Matricule",
						})}
					</th>
					{exams.map((exam) => (
						<th
							key={exam.id}
							className="min-w-[100px] border-b px-2 py-2 text-center font-medium"
						>
							<div className="flex flex-col items-center gap-0.5">
								<span className="flex items-center gap-1">
									{exam.name}
									{exam.isLocked && (
										<Lock className="h-3 w-3 text-muted-foreground" />
									)}
								</span>
								<span className="font-normal text-[10px] text-muted-foreground">
									{exam.type} • {exam.percentage}%
								</span>
							</div>
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{filteredStudents.map((student, sIdx) => (
					<tr key={student.id} className="even:bg-muted/10 hover:bg-muted/20">
						<td className="sticky left-0 border-b bg-background px-3 py-1.5 font-medium">
							{student.lastName} {student.firstName}
						</td>
						<td className="border-b px-2 py-1.5 text-muted-foreground text-xs">
							{student.registrationNumber}
						</td>
						{exams.map((exam, eIdx) => {
							const k = cellKey(student.id, exam.id);
							const value = values[k] ?? "";
							const state = states[k] ?? "idle";
							const error = errors[k];
							const disabled = exam.isLocked || !exam.canEdit;
							return (
								<td key={exam.id} className="border-b px-1 py-1 align-middle">
									<div className="relative">
										<Input
											ref={(el) => {
												inputsRef.current[k] = el;
											}}
											type="text"
											inputMode="decimal"
											value={value}
											disabled={disabled}
											onChange={(e) =>
												handleChange(student.id, exam.id, e.target.value)
											}
											onBlur={() => handleBlur(student.id, exam.id)}
											onKeyDown={(e) => handleKeyDown(e, sIdx, eIdx)}
											onFocus={(e) => e.target.select()}
											className={`h-8 w-full px-2 text-center text-sm ${
												state === "error"
													? "border-destructive ring-destructive"
													: state === "saved"
														? "border-green-500 ring-green-200"
														: state === "dirty" || state === "saving"
															? "border-amber-400"
															: ""
											}`}
											title={error ?? undefined}
											placeholder={disabled ? "—" : ""}
										/>
										{state === "saved" && (
											<Check className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 text-green-500" />
										)}
										{state === "saving" && (
											<RotateCcw className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 animate-spin text-amber-500" />
										)}
										{state === "error" && (
											<AlertCircle className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 text-destructive" />
										)}
									</div>
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}
