import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { termAverages, terms } from "../../db/schema";
import { conflict, notFound } from "../../lib/errors";
import * as repo from "./official-exams.repo";

// ─── Official Exam Sessions ──────────────────────────────────────────

export async function listSessions(
	institutionId: string,
	academicYearId?: string,
	examType?: string,
	opts: { page?: number; pageSize?: number } = {},
) {
	const { items, total } = await repo.findAllSessions(
		institutionId,
		academicYearId,
		examType,
		opts,
	);
	return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 25 };
}

export async function getSession(id: string, institutionId: string) {
	const session = await repo.findSessionById(id, institutionId);
	if (!session) throw notFound("Official exam session not found");
	return session;
}

export async function createSession(
	data: {
		academicYearId: string;
		examType: string;
		series?: string;
		sessionYear: number;
		centerCode?: string;
		registrationDeadline?: string;
	},
	institutionId: string,
) {
	return repo.insertSession({
		institutionId,
		academicYearId: data.academicYearId,
		examType: data.examType,
		series: data.series,
		sessionYear: data.sessionYear,
		centerCode: data.centerCode,
		registrationDeadline: data.registrationDeadline
			? new Date(data.registrationDeadline)
			: null,
	});
}

export async function updateSession(
	id: string,
	institutionId: string,
	data: {
		series?: string | null;
		centerCode?: string | null;
		registrationDeadline?: string | null;
		sessionYear?: number;
	},
) {
	const existing = await repo.findSessionById(id, institutionId);
	if (!existing) throw notFound("Official exam session not found");

	const updateData: Record<string, unknown> = {};
	if (data.series !== undefined) updateData.series = data.series;
	if (data.centerCode !== undefined) updateData.centerCode = data.centerCode;
	if (data.sessionYear !== undefined) updateData.sessionYear = data.sessionYear;
	if (data.registrationDeadline !== undefined) {
		updateData.registrationDeadline = data.registrationDeadline
			? new Date(data.registrationDeadline)
			: null;
	}

	const updated = await repo.updateSession(
		id,
		institutionId,
		updateData as any,
	);
	return updated!;
}

// ─── Official Exam Registrations ─────────────────────────────────────

export async function listRegistrations(
	examSessionId: string,
	institutionId: string,
	isEligible?: boolean,
	isAdmitted?: boolean,
) {
	// Verify session exists
	const session = await repo.findSessionById(examSessionId, institutionId);
	if (!session) throw notFound("Official exam session not found");

	return repo.findAllRegistrations(
		examSessionId,
		institutionId,
		isEligible,
		isAdmitted,
	);
}

export async function getRegistration(id: string, institutionId: string) {
	const registration = await repo.findRegistrationById(id, institutionId);
	if (!registration) throw notFound("Candidate registration not found");
	return registration;
}

export async function registerCandidate(
	data: {
		examSessionId: string;
		enrollmentId: string;
		candidateNumber?: string;
		isEligible?: boolean;
		hasPaidFee?: boolean;
	},
	institutionId: string,
) {
	// Verify session exists
	const session = await repo.findSessionById(data.examSessionId, institutionId);
	if (!session) throw notFound("Official exam session not found");

	// MNU gate — block registration if student has no MNU
	const studentInfo = await repo.findStudentByEnrollment(
		data.enrollmentId,
		institutionId,
	);
	if (!studentInfo?.mnu) {
		throw conflict(
			`Student ${studentInfo ? `${studentInfo.lastName} ${studentInfo.firstName}` : ""} has no MNU (Matricule National Unique). Set their MNU before registering for official exams.`,
		);
	}

	// Check if candidate already registered
	const existing = await repo.findRegistrationBySessionAndEnrollment(
		data.examSessionId,
		data.enrollmentId,
		institutionId,
	);
	if (existing) {
		throw conflict(
			"This candidate is already registered for this exam session",
		);
	}

	return repo.insertRegistration({
		institutionId,
		examSessionId: data.examSessionId,
		enrollmentId: data.enrollmentId,
		candidateNumber: data.candidateNumber,
		isEligible: data.isEligible ?? true,
		hasPaidFee: data.hasPaidFee ?? false,
	});
}

export async function bulkRegisterCandidates(
	data: { examSessionId: string; classId: string },
	institutionId: string,
) {
	// Verify session exists and belongs to this institution
	const session = await repo.findSessionById(data.examSessionId, institutionId);
	if (!session) throw notFound("Official exam session not found");

	// Get all active enrollments for the class
	const enrollmentIds = await repo.findEnrollmentIdsByClass(
		data.classId,
		institutionId,
	);
	if (enrollmentIds.length === 0) {
		return { registered: 0, skipped: 0 };
	}

	// Find which ones are already registered
	const alreadyRegistered = await repo.findExistingRegistrationEnrollmentIds(
		data.examSessionId,
		enrollmentIds,
	);

	const notYetRegistered = enrollmentIds.filter(
		(id) => !alreadyRegistered.has(id),
	);

	if (notYetRegistered.length === 0) {
		return { registered: 0, skipped: enrollmentIds.length, skippedNoMnu: 0 };
	}

	// Filter out students without MNU
	const withMnuChecks = await Promise.all(
		notYetRegistered.map(async (enrollmentId) => {
			const student = await repo.findStudentByEnrollment(
				enrollmentId,
				institutionId,
			);
			return { enrollmentId, hasMnu: !!student?.mnu };
		}),
	);
	const toRegister = withMnuChecks
		.filter((r) => r.hasMnu)
		.map((r) => r.enrollmentId);
	const skippedNoMnu = withMnuChecks.filter((r) => !r.hasMnu).length;

	if (toRegister.length === 0) {
		return { registered: 0, skipped: alreadyRegistered.size, skippedNoMnu };
	}

	const insertData = toRegister.map((enrollmentId) => ({
		institutionId,
		examSessionId: data.examSessionId,
		enrollmentId,
		isEligible: true,
		hasPaidFee: false,
	}));

	const inserted = await repo.bulkInsertRegistrations(insertData);
	return {
		registered: inserted.length,
		skipped: alreadyRegistered.size,
		skippedNoMnu,
	};
}

export async function updateRegistration(
	id: string,
	institutionId: string,
	data: {
		candidateNumber?: string;
		isEligible?: boolean;
		hasPaidFee?: boolean;
		feeAmount?: number | null;
		feePaidAt?: string | null;
		feeTransactionRef?: string | null;
		isAdmitted?: boolean;
		mention?: string;
	},
) {
	const existing = await repo.findRegistrationById(id, institutionId);
	if (!existing) throw notFound("Candidate registration not found");

	const updateData: Record<string, unknown> = {};
	if (data.candidateNumber !== undefined) {
		updateData.candidateNumber = data.candidateNumber;
	}
	if (data.isEligible !== undefined) updateData.isEligible = data.isEligible;
	if (data.hasPaidFee !== undefined) updateData.hasPaidFee = data.hasPaidFee;
	if (data.feeAmount !== undefined)
		updateData.feeAmount = data.feeAmount?.toString() ?? null;
	if (data.feePaidAt !== undefined) {
		updateData.feePaidAt = data.feePaidAt ? new Date(data.feePaidAt) : null;
	}
	if (data.feeTransactionRef !== undefined)
		updateData.feeTransactionRef = data.feeTransactionRef;
	if (data.isAdmitted !== undefined) updateData.isAdmitted = data.isAdmitted;
	if (data.mention !== undefined) updateData.mention = data.mention;

	const updated = await repo.updateRegistration(
		id,
		institutionId,
		updateData as any,
	);
	return updated!;
}

/**
 * Check eligibility based on the student's academic records.
 * Looks at the student's term averages for the exam session's academic year.
 * Sets isEligible = true if annual average >= minAverage.
 */
export async function checkEligibility(
	registrationId: string,
	institutionId: string,
	minAverage = 8,
): Promise<{ isEligible: boolean; annualAverage: number | null }> {
	const registration = await repo.findRegistrationById(
		registrationId,
		institutionId,
	);
	if (!registration) throw notFound("Candidate registration not found");

	// Get the academic year via the exam session
	const session = await repo.findSessionById(
		registration.examSessionId,
		institutionId,
	);
	if (!session) throw notFound("Exam session not found");

	// Get all terms for that academic year
	const yearTerms = await db
		.select({ id: terms.id })
		.from(terms)
		.where(
			and(
				eq(terms.academicYearId, session.academicYearId),
				eq(terms.institutionId, institutionId),
			),
		);

	if (yearTerms.length === 0) {
		// No terms — cannot determine eligibility from records, default to eligible
		const _updated = await repo.updateRegistration(
			registrationId,
			institutionId,
			{
				isEligible: true,
			},
		);
		return { isEligible: true, annualAverage: null };
	}

	const termIds = yearTerms.map((t) => t.id);

	// Fetch term averages for this enrollment across all terms in the year
	const avgRows = await db
		.select({
			termId: termAverages.termId,
			weightedAverage: termAverages.weightedAverage,
		})
		.from(termAverages)
		.where(
			and(
				eq(termAverages.enrollmentId, registration.enrollmentId),
				inArray(termAverages.termId, termIds),
			),
		);

	// Compute annual average (simple mean of available term averages)
	const validAvgs = avgRows
		.map((r) => (r.weightedAverage !== null ? Number(r.weightedAverage) : null))
		.filter((v): v is number => v !== null && !Number.isNaN(v));

	const annualAverage =
		validAvgs.length > 0
			? Math.round(
					(validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length) * 100,
				) / 100
			: null;

	const isEligible =
		annualAverage !== null ? annualAverage >= minAverage : false;

	await repo.updateRegistration(registrationId, institutionId, { isEligible });

	return { isEligible, annualAverage };
}
