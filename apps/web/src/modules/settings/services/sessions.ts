import i18n from "@/i18n";
import type { SessionInfo } from "../types";

export function getBrowserLabel(userAgent?: string | null) {
	if (!userAgent) return i18n.t("settings.sessions.unknownBrowser");
	const normalized = userAgent.toLowerCase();
	if (normalized.includes("edg")) return "Edge";
	if (normalized.includes("chrome")) return "Chrome";
	if (normalized.includes("firefox")) return "Firefox";
	if (normalized.includes("safari")) return "Safari";
	if (normalized.includes("opera") || normalized.includes("opr"))
		return "Opera";
	return i18n.t("settings.sessions.otherBrowser");
}

export const resolveToken = (
	session: Record<string, unknown> | null | undefined,
) =>
	(session?.token as string | undefined) ??
	(session?.sessionToken as string | undefined) ??
	(session?.id as string | undefined);

export const resolveSessionToken = (session: SessionInfo) =>
	resolveToken(session as Record<string, unknown>);
