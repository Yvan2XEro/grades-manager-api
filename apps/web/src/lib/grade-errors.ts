import type { TFunction } from "i18next";

/**
 * Marks of an exam deliberated by a closed or signed jury are frozen: the
 * server refuses with `JURY_CLOSED:<status>:<deliberationId>`. Returns the
 * translated explanation, or null for any other error.
 */
export function gradeErrorMessage(t: TFunction, error: unknown): string | null {
	const message =
		(error as { message?: string } | null | undefined)?.message ?? "";
	if (!message.startsWith("JURY_CLOSED")) return null;
	const status = message.split(":")[1];
	return status === "signed"
		? t("common.errors.juryClosed.signed")
		: t("common.errors.juryClosed.closed");
}
