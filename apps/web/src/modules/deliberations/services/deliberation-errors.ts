import type { TFunction } from "i18next";

/**
 * User-facing message for a refused deliberation action. The server answers
 * with English messages; the UI maps them by tRPC code so the user always
 * reads a translated sentence.
 */
export function deliberationErrorMessage(t: TFunction, err: unknown): string {
	const code = (err as { data?: { code?: string } } | null)?.data?.code;
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
