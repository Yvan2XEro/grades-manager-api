import { evaluatePromotionFacts } from "../rules-engine";
import { summarizeStudent } from "../student-credit-ledger";

export async function evaluateStudentPromotion(studentId: string) {
	const summary = await summarizeStudent(studentId);
	const eligible = await evaluatePromotionFacts({
		creditsEarned: summary.creditsEarned,
		requiredCredits: summary.requiredCredits,
	});
	return {
		totalCreditsEarned: summary.creditsEarned,
		creditsInProgress: summary.creditsInProgress,
		requiredCredits: summary.requiredCredits,
		eligible,
		ledgers: summary.ledgers,
	};
}
