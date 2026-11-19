import type { TFunction } from "i18next";

/** Codes the server puts in the message of a refused or failed document. */
const RENDER_FAILED = "DOCUMENT_RENDER_FAILED";
const NOT_ELIGIBLE = "DOCUMENT_NOT_ELIGIBLE:";

export type IneligibilityReason =
	| "not_enrolled"
	| "enrollment_pending"
	| "enrollment_withdrawn"
	| "no_deliberation"
	| "deliberation_not_closed"
	| "decision_pending"
	| "decision_unfavourable";

/** Why a student cannot get a document, in words ("Jury decision: deferred"). */
export function ineligibilityLabel(
	t: TFunction,
	reason: string | null | undefined,
	decision?: string | null,
) {
	switch (reason as IneligibilityReason) {
		case "not_enrolled":
			return t("documents.ineligible.not_enrolled");
		case "enrollment_pending":
			return t("documents.ineligible.enrollment_pending");
		case "enrollment_withdrawn":
			return t("documents.ineligible.enrollment_withdrawn");
		case "no_deliberation":
			return t("documents.ineligible.no_deliberation");
		case "deliberation_not_closed":
			return t("documents.ineligible.deliberation_not_closed");
		case "decision_pending":
			return t("documents.ineligible.decision_pending");
		case "decision_unfavourable":
			return decision
				? t("documents.ineligible.decision_unfavourable", {
						decision: decisionLabel(t, decision),
					})
				: t("documents.ineligible.decision_unfavourable_generic");
		default:
			return "";
	}
}

function decisionLabel(t: TFunction, decision: string | null | undefined) {
	switch (decision) {
		case "admitted":
			return t("documents.decisions.admitted");
		case "compensated":
			return t("documents.decisions.compensated");
		case "deferred":
			return t("documents.decisions.deferred");
		case "repeat":
			return t("documents.decisions.repeat");
		case "excluded":
			return t("documents.decisions.excluded");
		default:
			return t("documents.decisions.pending");
	}
}

/**
 * User-facing message for an error of a document generation / download:
 * a refusal says why, a technical failure says to retry (the detail is in
 * the server log), a business error keeps its message.
 */
export function documentErrorMessage(t: TFunction, err: unknown): string {
	const message = err instanceof Error ? err.message : String(err ?? "");
	if (message.startsWith(NOT_ELIGIBLE)) {
		const reason = message.slice(NOT_ELIGIBLE.length);
		return t("documents.notEligibleError", {
			reason: ineligibilityLabel(t, reason) || reason,
		});
	}
	const code = (err as { data?: { code?: string } } | null)?.data?.code;
	if (
		message === RENDER_FAILED ||
		code === "INTERNAL_SERVER_ERROR" ||
		!message ||
		/failed to fetch|networkerror/i.test(message)
	) {
		return t("documents.errors.renderFailed");
	}
	return message || t("documents.errors.generic");
}
