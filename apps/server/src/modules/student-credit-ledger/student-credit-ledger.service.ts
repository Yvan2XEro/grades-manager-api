import type * as schema from "@/db/schema/app-schema";
import * as repo from "./student-credit-ledger.repo";

const DEFAULT_REQUIRED_CREDITS = 60;

export async function ensureLedger(
	studentId: string,
	academicYearId: string,
	requiredCredits = DEFAULT_REQUIRED_CREDITS,
) {
	return repo.upsert(studentId, academicYearId, requiredCredits);
}

export async function applyDelta(
	studentId: string,
	academicYearId: string,
	deltaProgress: number,
	deltaEarned: number,
	requiredCredits = DEFAULT_REQUIRED_CREDITS,
) {
	if (deltaProgress === 0 && deltaEarned === 0) {
		return repo.upsert(studentId, academicYearId, requiredCredits);
	}
	const ledger = await repo.upsert(studentId, academicYearId, requiredCredits);
	return repo.applyDelta(ledger.id, deltaProgress, deltaEarned);
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

export function contributionForStatus(
	status: schema.StudentCourseEnrollmentStatus,
	credits: number,
) {
	const isInProgress = status === "planned" || status === "active";
	const isCompleted = status === "completed";
	return {
		inProgress: isInProgress ? credits : 0,
		earned: isCompleted ? credits : 0,
	};
}
