import type { TFunction } from "i18next";

/** Codes the server puts in the message of a refused exam. */
const NO_STUDENTS = "EXAM_NO_STUDENTS";
const PERCENTAGE_EXCEEDED = "EXAM_PERCENTAGE_EXCEEDED";

/**
 * User-facing message of an exam creation / update error: a known refusal
 * says why in words, any other error keeps its message (or the fallback).
 */
export function examErrorMessage(
	t: TFunction,
	error: unknown,
	fallback: string,
): string {
	const message = error instanceof Error ? error.message : "";
	if (message === NO_STUDENTS) return t("admin.exams.errors.noStudents");
	if (message === PERCENTAGE_EXCEEDED) {
		return t("admin.exams.errors.percentageExceeded");
	}
	return message || fallback;
}
