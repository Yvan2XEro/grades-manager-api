import { computeUeCredits } from "./compute-ue-credits";
import * as repo from "./student-credit-ledger.repo";

const DEFAULT_REQUIRED_CREDITS = 60;

export async function ensureLedger(
	studentId: string,
	academicYearId: string,
	requiredCredits = DEFAULT_REQUIRED_CREDITS,
) {
	return repo.upsert(studentId, academicYearId, requiredCredits);
}

/**
 * Recompute the credit ledger for a student/year based on UE validation (LMD rules).
 * This replaces the old delta-based approach.
 */
export async function recomputeForStudent(
	studentId: string,
	academicYearId: string,
	passingGrade = 10,
	requiredCredits = DEFAULT_REQUIRED_CREDITS,
) {
	const result = await computeUeCredits(
		studentId,
		academicYearId,
		passingGrade,
	);
	return repo.setCredits(
		studentId,
		academicYearId,
		requiredCredits,
		result.creditsInProgress,
		result.creditsEarned,
	);
}

/**
 * Add transfer credits directly to a student's ledger.
 * Transfer credits are always "earned" (already validated at another institution).
 */
export async function addTransferCredits(
	studentId: string,
	academicYearId: string,
	transferCredits: number,
	requiredCredits = DEFAULT_REQUIRED_CREDITS,
) {
	const ledger = await repo.upsert(studentId, academicYearId, requiredCredits);
	return repo.applyDelta(ledger.id, 0, transferCredits);
}

export async function listByStudent(studentId: string) {
	return repo.listByStudent(studentId);
}

export async function summarizeStudent(studentId: string) {
	const ledgers = await listByStudent(studentId);
	const totals = ledgers.reduce(
		(acc, ledger) => {
			acc.creditsEarned += ledger.creditsEarned;
			acc.creditsInProgress += ledger.creditsInProgress;
			acc.requiredCredits = Math.max(
				acc.requiredCredits,
				ledger.requiredCredits,
			);
			return acc;
		},
		{
			creditsEarned: 0,
			creditsInProgress: 0,
			requiredCredits: DEFAULT_REQUIRED_CREDITS,
		},
	);
	return { ledgers, ...totals };
}
