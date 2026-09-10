import { TRPCClientError } from "@trpc/client";
import type { TFunction } from "i18next";
import { toast } from "sonner";

export function errorToast(err: unknown, t: TFunction): void {
	if (err instanceof TRPCClientError) {
		if (err.message === "ACCOUNT_SUSPENDED") return; // handled globally by onSuspended

		switch (err.data?.code) {
			case "CONFLICT":
				toast.error(t("error.conflict", "Already exists."));
				return;
			case "FORBIDDEN":
				toast.error(t("error.forbidden", "You don't have permission."));
				return;
			case "NOT_FOUND":
				toast.error(t("error.not_found", "Not found."));
				return;
			case "PRECONDITION_FAILED":
				// Server sends a human-readable message — display it directly
				toast.error(err.message);
				return;
			case "UNAUTHORIZED":
				// handled globally by auth redirect
				return;
		}
	}

	const message =
		err instanceof Error
			? err.message
			: t("error.unknown", "An unexpected error occurred.");
	toast.error(message);
}
