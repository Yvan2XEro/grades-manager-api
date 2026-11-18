/** `150 000 XAF`. */
export const formatMoney = (value: number, currency: string) =>
	`${value.toLocaleString()} ${currency}`;

/** Decimal amount as returned by the API, or `—` when missing. */
export const formatAmount = (
	amount: string | null | undefined,
	currency: string,
) => (amount ? formatMoney(Number(amount), currency) : "—");

/** `First Last` of an assignment's student, or `—`. */
export const getStudentName = (assignment: {
	student?: {
		profile?: { firstName: string; lastName: string } | null;
	} | null;
}) => {
	const p = assignment.student?.profile;
	return p ? `${p.firstName} ${p.lastName}` : "—";
};
