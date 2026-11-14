import { useEffect } from "react";
import { toast } from "@/lib/toast";

/**
 * Shows a toast when a query fails (react-query v5 dropped `onError` on
 * `useQuery`). `fallback` is used when the error carries no message.
 */
export function useQueryErrorToast(error: unknown, fallback: string) {
	useEffect(() => {
		if (!error) return;
		toast.error(
			error instanceof Error && error.message ? error.message : fallback,
		);
	}, [error, fallback]);
}
