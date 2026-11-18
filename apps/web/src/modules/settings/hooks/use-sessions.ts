import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { resolveSessionToken, resolveToken } from "../services/sessions";
import type { SessionInfo, SessionResponse } from "../types";

/** Active login sessions of the user (current one flagged) + revoke actions. */
export function useSessions() {
	const { t } = useTranslation();
	const { data: session } = authClient.useSession();
	const [sessions, setSessions] = useState<SessionInfo[]>([]);

	const loadSessions = useCallback(async () => {
		try {
			// Better-Auth client calls resolve to { data, error }
			const { data, error } = await authClient.listSessions();
			if (error) throw error;
			const response = data as SessionResponse | null;
			const rawSessions: SessionInfo[] = Array.isArray(response)
				? response
				: (response?.sessions ?? []);
			const currentToken = resolveToken(
				session?.session as Record<string, unknown>,
			);
			const normalized = rawSessions.map((entry) => {
				const token = resolveSessionToken(entry);
				return {
					...entry,
					token: token ?? entry.token ?? null,
					current: currentToken !== undefined && currentToken === token,
				};
			});
			setSessions(normalized);
		} catch (error) {
			console.error("Failed to load sessions", error);
			toast.error(t("settings.sessions.toast.error"));
		}
	}, [session?.session, t]);

	useEffect(() => {
		void loadSessions();
	}, [loadSessions]);

	const revokeSession = useMutation({
		mutationFn: async (token: string) => authClient.revokeSession({ token }),
		onSuccess: () => {
			toast.success(t("settings.sessions.toast.revoked"));
			void loadSessions();
		},
		onError: () => toast.error(t("settings.sessions.toast.error")),
	});

	const revokeOthers = useMutation({
		mutationFn: async () => authClient.revokeSessions(),
		onSuccess: () => {
			toast.success(t("settings.sessions.toast.revokedAll"));
			void loadSessions();
		},
		onError: () => toast.error(t("settings.sessions.toast.error")),
	});

	return { sessions, revokeSession, revokeOthers };
}
