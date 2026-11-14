import type { CellKey } from "../types";

export const cellKey = (studentId: string, examId: string): CellKey =>
	`${studentId}::${examId}`;

/** Empty is valid (deletes the grade); otherwise a number between 0 and 20 ("," accepted). */
export function isValidScore(value: string): { ok: boolean; n?: number } {
	if (value.trim() === "") return { ok: true, n: undefined };
	const n = Number(value.replace(",", "."));
	if (Number.isNaN(n)) return { ok: false };
	if (n < 0 || n > 20) return { ok: false };
	return { ok: true, n };
}
