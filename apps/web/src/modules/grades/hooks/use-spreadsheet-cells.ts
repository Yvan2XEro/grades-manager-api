import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpcClient } from "@/utils/trpc";
import { cellKey, isValidScore } from "../services/score-cells";
import type { CellKey, CellState } from "../types";

type SavedGrade = { id: string; student: string; exam: string; score: string };

/**
 * Values typed in the grid and their save state. Each cell auto-saves 600 ms
 * after the last keystroke, or right away on blur; an emptied cell deletes
 * its grade.
 */
export function useSpreadsheetCells(grades: SavedGrade[] | undefined) {
	const { t } = useTranslation();

	// Per-cell value (raw string the user typed) — separate from the persisted score
	const [values, setValues] = useState<Record<CellKey, string>>({});
	// Per-cell state
	const [states, setStates] = useState<Record<CellKey, CellState>>({});
	// Per-cell error message (e.g. invalid range)
	const [errors, setErrors] = useState<Record<CellKey, string | undefined>>({});

	// Track grade ID per (student, exam) for deletes
	const [gradeIds, setGradeIds] = useState<Record<CellKey, string>>({});

	// Pending save timers per cell
	const saveTimersRef = useRef<Record<CellKey, ReturnType<typeof setTimeout>>>(
		{},
	);

	// Hydrate values + gradeIds when grades load
	useEffect(() => {
		if (!grades) return;
		const nextValues: Record<CellKey, string> = {};
		const nextIds: Record<CellKey, string> = {};
		for (const g of grades) {
			const k = cellKey(g.student, g.exam);
			nextValues[k] = String(Number(g.score));
			nextIds[k] = g.id;
		}
		setValues(nextValues);
		setGradeIds(nextIds);
		setStates({});
		setErrors({});
	}, [grades]);

	const upsertMutation = useMutation({
		mutationFn: async (input: {
			studentId: string;
			examId: string;
			score: number;
		}) => {
			return trpcClient.grades.upsertNote.mutate(input);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) =>
			trpcClient.grades.deleteNote.mutate({ id }),
	});

	const persistCell = useCallback(
		async (studentId: string, examId: string, raw: string) => {
			const k = cellKey(studentId, examId);
			const validation = isValidScore(raw);
			if (!validation.ok) {
				setErrors((e) => ({
					...e,
					[k]: t("teacher.spreadsheet.invalidScore", {
						defaultValue: "Score doit être entre 0 et 20",
					}),
				}));
				setStates((s) => ({ ...s, [k]: "error" }));
				return;
			}
			setErrors((e) => ({ ...e, [k]: undefined }));
			setStates((s) => ({ ...s, [k]: "saving" }));
			try {
				if (validation.n === undefined) {
					// empty → delete if existing
					const existingId = gradeIds[k];
					if (existingId) {
						await deleteMutation.mutateAsync(existingId);
						setGradeIds((g) => {
							const next = { ...g };
							delete next[k];
							return next;
						});
					}
				} else {
					const result = await upsertMutation.mutateAsync({
						studentId,
						examId,
						score: validation.n,
					});
					if (result?.id) {
						setGradeIds((g) => ({ ...g, [k]: result.id }));
					}
				}
				setStates((s) => ({ ...s, [k]: "saved" }));
				// Fade saved state to idle after 1.5s
				setTimeout(() => {
					setStates((s) => (s[k] === "saved" ? { ...s, [k]: "idle" } : s));
				}, 1500);
			} catch (err: any) {
				setStates((s) => ({ ...s, [k]: "error" }));
				setErrors((e) => ({ ...e, [k]: err?.message ?? "Erreur" }));
			}
		},
		[gradeIds, deleteMutation, upsertMutation, t],
	);

	const scheduleSave = useCallback(
		(studentId: string, examId: string, raw: string) => {
			const k = cellKey(studentId, examId);
			if (saveTimersRef.current[k]) clearTimeout(saveTimersRef.current[k]);
			saveTimersRef.current[k] = setTimeout(() => {
				void persistCell(studentId, examId, raw);
			}, 600);
		},
		[persistCell],
	);

	const handleChange = (studentId: string, examId: string, value: string) => {
		const k = cellKey(studentId, examId);
		setValues((v) => ({ ...v, [k]: value }));
		setStates((s) => ({ ...s, [k]: "dirty" }));
		setErrors((e) => ({ ...e, [k]: undefined }));
		scheduleSave(studentId, examId, value);
	};

	const handleBlur = (studentId: string, examId: string) => {
		const k = cellKey(studentId, examId);
		// Flush any pending debounced save
		if (saveTimersRef.current[k]) {
			clearTimeout(saveTimersRef.current[k]);
			delete saveTimersRef.current[k];
		}
		const raw = values[k] ?? "";
		void persistCell(studentId, examId, raw);
	};

	return { values, states, errors, handleChange, handleBlur };
}

export type SpreadsheetCells = ReturnType<typeof useSpreadsheetCells>;
