import { TRPCClientError } from "@trpc/client";
import type { TFunction } from "i18next";
import { toast } from "sonner";

/**
 * Maps a semantic error code (e.g. "USER_ALREADY_EXISTS") to a translated
 * message using the "error.<code>" i18n key, falling back to the generic
 * message for that TRPC error code when no specific key exists.
 */
function translateCode(code: string, t: TFunction, fallback: string): string {
	const specific = t(`error.${code}`, { defaultValue: "" });
	return specific || fallback;
}

export function errorToast(err: unknown, t: TFunction): void {
	if (err instanceof TRPCClientError) {
		// Silently handled elsewhere
		if (err.message === "ACCOUNT_SUSPENDED") return;
		if (err.data?.code === "UNAUTHORIZED") return;

		switch (err.data?.code) {
			case "PRECONDITION_FAILED":
				toast.error(translateCode(err.message, t, err.message));
				return;
			case "CONFLICT":
				// err.message is a semantic code like "USER_ALREADY_EXISTS"
				toast.error(translateCode(err.message, t, t("error.conflict")));
				return;
			case "NOT_FOUND":
				toast.error(translateCode(err.message, t, t("error.not_found")));
				return;
			case "FORBIDDEN":
				toast.error(translateCode(err.message, t, t("error.forbidden")));
				return;
		}
	}

	const message = err instanceof Error ? err.message : t("error.unknown");
	toast.error(message);
}
