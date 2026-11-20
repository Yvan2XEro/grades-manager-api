import type { TFunction } from "i18next";

/**
 * User-facing message for a refused deliberation action. The server answers
 * with English messages; the UI maps them by tRPC code so the user always
 * reads a translated sentence.
 */
/** Business refusals the server names with a stable code prefix. */
const KNOWN_REFUSALS = [
	"SEMESTER_REQUIRED",
	"SEMESTER_NOT_ALLOWED",
	"ANNUAL_JURY_REQUIRED",
	"JURY_OUTDATED",
	"REASON_REQUIRED",
	"SEMESTER_JURY_NO_PROMOTION",
] as const;

export function deliberationErrorMessage(t: TFunction, err: unknown): string {
	const code = (err as { data?: { code?: string } } | null)?.data?.code;
	const message = (err as { message?: string } | null)?.message ?? "";
	const refusal = KNOWN_REFUSALS.find((r) => message.startsWith(r));
	if (refusal) return t(`admin.deliberations.errors.refusal.${refusal}`);
	switch (code) {
		case "CONFLICT":
			return t("admin.deliberations.errors.duplicate");
		case "NOT_FOUND":
			return t("admin.deliberations.errors.notFound");
		case "FORBIDDEN":
		case "UNAUTHORIZED":
			return t("admin.deliberations.errors.forbidden");
		case "BAD_REQUEST":
		case "PRECONDITION_FAILED":
			return t("admin.deliberations.errors.wrongStatus");
		default:
			return t("admin.deliberations.toast.error");
	}
}
