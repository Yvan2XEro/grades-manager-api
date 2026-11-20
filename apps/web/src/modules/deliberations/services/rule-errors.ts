import type { TFunction } from "i18next";

/** Server ruleset problems ("Unknown fact: x"), mapped to translated sentences. */
const PATTERNS = [
	[
		/^Unknown fact: (.*)$/,
		"admin.deliberations.rules.serverErrors.unknownFact",
	],
	[
		/^Unknown operator: (.*)$/,
		"admin.deliberations.rules.serverErrors.unknownOperator",
	],
	[/^No value for (.*)$/, "admin.deliberations.rules.serverErrors.noValue"],
	[
		/^The rule has no conditions$/,
		"admin.deliberations.rules.serverErrors.noConditions",
	],
	[
		/^A condition is not an object$/,
		"admin.deliberations.rules.serverErrors.notAnObject",
	],
] as const;

/**
 * Messages to show inline when saving a rule fails. The server refuses an
 * invalid ruleset with BAD_REQUEST and its problems joined by "; ".
 */
export function ruleSaveErrors(t: TFunction, err: unknown): string[] {
	const e = err as { message?: string; data?: { code?: string } } | null;
	const code = e?.data?.code;
	const message = e?.message ?? "";
	if (code === "BAD_REQUEST" && message && !message.startsWith("[")) {
		return message.split("; ").map((problem) => {
			for (const [pattern, key] of PATTERNS) {
				const match = pattern.exec(problem);
				if (match) return t(key, { name: match[1] ?? "" });
			}
			return problem;
		});
	}
	if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
		return [t("admin.deliberations.errors.forbidden")];
	}
	if (code === "NOT_FOUND") {
		return [t("admin.deliberations.rules.serverErrors.notFound")];
	}
	return [t("admin.deliberations.rules.toast.error")];
}
