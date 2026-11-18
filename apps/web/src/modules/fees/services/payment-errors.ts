import i18n from "@/i18n";

/** Translated message of a refused payment (the API answers in English). */
export function paymentErrorMessage(error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	if (message.includes("exceeds remaining balance"))
		return i18n.t("feeClearance.payments.errors.exceedsBalance");
	if (message.includes("already fully paid"))
		return i18n.t("feeClearance.payments.errors.fullyPaid");
	if (message.includes("exempted"))
		return i18n.t("feeClearance.payments.errors.exempt");
	if (message.includes("choose a fee structure"))
		return i18n.t("feeClearance.payments.errors.structureRequired");
	return i18n.t("feeClearance.payments.errors.failed");
}
