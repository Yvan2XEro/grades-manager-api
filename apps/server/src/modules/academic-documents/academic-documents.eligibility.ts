import type {
	DeliberationDecision,
	DeliberationStatus,
	EnrollmentStatus,
} from "../../db/schema/app-schema";
import * as repo from "./academic-documents.repo";
import type { DocumentKind } from "./academic-documents.zod";

/**
 * Why a document cannot be issued for a student. Stable codes: the web
 * translates them and the server error message carries them
 * (`DOCUMENT_NOT_ELIGIBLE:<reason>`).
 */
export type IneligibilityReason =
	| "not_enrolled"
	| "enrollment_pending"
	| "enrollment_withdrawn"
	| "no_deliberation"
	| "deliberation_not_closed"
	| "decision_pending"
	| "decision_unfavourable"
	| "not_final_level";

export type DocumentEligibility = {
	eligible: boolean;
	reason?: IneligibilityReason;
	/** Jury decision behind the verdict (pass certificate / diploma). */
	decision?: DeliberationDecision | null;
	/** Class the document is about. */
	classId?: string | null;
	academicYearId?: string | null;
	deliberationId?: string | null;
	enrollmentStatus?: EnrollmentStatus | null;
};

/** Kinds that certify a success and therefore need a favourable jury decision. */
export const RESULT_KINDS: ReadonlySet<DocumentKind> = new Set([
	"attestation",
	"diploma",
]);

const FAVOURABLE: ReadonlySet<DeliberationDecision> = new Set([
	"admitted",
	"compensated",
]);
const CLOSED: ReadonlySet<DeliberationStatus> = new Set(["closed", "signed"]);

type EnrollmentRow = {
	classId: string;
	academicYearId: string;
	status: EnrollmentStatus;
};

/**
 * Enrollment certificate: the student must have a validated enrollment
 * (active, completed or graduated) in the class. Without a class, the most
 * recent enrollment is used, an active one first.
 */
export function enrollmentEligibility(
	enrollments: EnrollmentRow[],
	classId?: string | null,
): DocumentEligibility {
	const enrollment = classId
		? enrollments.find((e) => e.classId === classId)
		: (enrollments.find((e) => e.status === "active") ?? enrollments[0]);
	if (!enrollment) {
		return { eligible: false, reason: "not_enrolled", classId };
	}
	const base = {
		classId: enrollment.classId,
		academicYearId: enrollment.academicYearId,
		enrollmentStatus: enrollment.status,
	};
	if (enrollment.status === "pending") {
		return { ...base, eligible: false, reason: "enrollment_pending" };
	}
	if (enrollment.status === "withdrawn") {
		return { ...base, eligible: false, reason: "enrollment_withdrawn" };
	}
	return { ...base, eligible: true };
}

type ResultRow = {
	finalDecision: DeliberationDecision | null;
	autoDecision: DeliberationDecision | null;
	deliberationId: string;
	deliberationStatus: DeliberationStatus;
	classId: string;
	academicYearId: string;
	/** Last level of its cycle: the jury awards the cycle's degree. */
	isFinalLevel?: boolean | null;
};

const decisionOf = (r: ResultRow) => r.finalDecision ?? r.autoDecision;

/**
 * The jury that decides each year: rows come most recent year first, the
 * retake jury before the annual one, so the first closed row of a class and
 * year is the decisive one. An annual decision superseded by the retake
 * jury no longer counts (either way).
 */
function decisiveClosedRows<T extends ResultRow>(rows: T[]): T[] {
	const seen = new Set<string>();
	return rows.filter((r) => {
		if (!CLOSED.has(r.deliberationStatus)) return false;
		const key = `${r.classId}:${r.academicYearId}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

/** Closed jury with a favourable decision. */
export function isFavourableResult(r: ResultRow) {
	const d = decisionOf(r);
	return CLOSED.has(r.deliberationStatus) && d != null && FAVOURABLE.has(d);
}

/**
 * Pass certificate / diploma: the student needs a favourable decision
 * (admitted or compensated) of a closed or signed year-end jury. Rows are the
 * student's annual/retake results, most recent first; when the year is not
 * fixed, any year with a favourable decision qualifies (latest wins).
 *
 * A diploma (`finalLevelOnly`) certifies a whole cycle: only a jury of the
 * last level of the cycle counts (an admitted L1 student is no Licence
 * graduate).
 */
export function resultEligibility(
	rows: ResultRow[],
	opts: { finalLevelOnly?: boolean } = {},
): DocumentEligibility {
	if (rows.length === 0) {
		return { eligible: false, reason: "no_deliberation" };
	}
	const closed = decisiveClosedRows(rows);
	const favourable = closed.find(
		(r) =>
			isFavourableResult(r) &&
			(!opts.finalLevelOnly || r.isFinalLevel !== false),
	);
	if (favourable) {
		return {
			eligible: true,
			decision: decisionOf(favourable),
			classId: favourable.classId,
			academicYearId: favourable.academicYearId,
			deliberationId: favourable.deliberationId,
		};
	}
	if (opts.finalLevelOnly) {
		const intermediate = closed.find(isFavourableResult);
		if (intermediate) {
			return {
				eligible: false,
				reason: "not_final_level",
				decision: decisionOf(intermediate),
				classId: intermediate.classId,
				academicYearId: intermediate.academicYearId,
				deliberationId: intermediate.deliberationId,
			};
		}
	}
	const latest = closed[0];
	if (!latest) {
		return {
			eligible: false,
			reason: "deliberation_not_closed",
			classId: rows[0].classId,
			academicYearId: rows[0].academicYearId,
			deliberationId: rows[0].deliberationId,
		};
	}
	const decision = decisionOf(latest);
	return {
		eligible: false,
		reason:
			decision == null || decision === "pending"
				? "decision_pending"
				: "decision_unfavourable",
		decision,
		classId: latest.classId,
		academicYearId: latest.academicYearId,
		deliberationId: latest.deliberationId,
	};
}

/**
 * Favourable closed juries of one student, most recent first: what a pass
 * certificate can attest (one per year) and, on the last level of a cycle,
 * the diplomas earned (one per cycle — the latest jury of that cycle).
 */
export async function listStudentResultDocuments(
	institutionId: string,
	studentId: string,
) {
	const rows = await repo.listFinalDeliberationResults(institutionId, [
		studentId,
	]);
	const results = [];
	// The decisive jury of each year (a retake after the annual one)
	for (const r of decisiveClosedRows(rows)) {
		if (!isFavourableResult(r)) continue;
		results.push({
			deliberationId: r.deliberationId,
			classId: r.classId,
			className: r.className,
			academicYearId: r.academicYearId,
			academicYearName: r.academicYearName,
			programName: r.programName,
			cycleId: r.cycleId ?? null,
			cycleName: r.cycleName ?? null,
			cycleCode: r.cycleCode ?? null,
			levelName: r.levelName ?? null,
			isFinalLevel: r.isFinalLevel !== false,
			decision: decisionOf(r),
			juryDate: r.juryDate ? new Date(r.juryDate).toISOString() : null,
		});
	}
	const seenCycles = new Set<string>();
	const diplomas = results.filter((r) => {
		if (!r.isFinalLevel) return false;
		const key = r.cycleId ?? `program:${r.programName}`;
		if (seenCycles.has(key)) return false;
		seenCycles.add(key);
		return true;
	});
	return { results, diplomas };
}

/**
 * Decides whether `kind` may be issued for one student. `classId` pins the
 * class (and so the academic year) the document is about; `deliberationId`
 * pins the jury for result documents. Transcripts are always allowed.
 */
export async function checkDocumentEligibility(
	institutionId: string,
	kind: DocumentKind,
	studentId: string,
	opts: { classId?: string | null; deliberationId?: string | null } = {},
): Promise<DocumentEligibility> {
	if (kind === "enrollment_certificate") {
		const enrollments = await repo.listStudentEnrollments(
			institutionId,
			studentId,
		);
		return enrollmentEligibility(enrollments, opts.classId);
	}
	if (RESULT_KINDS.has(kind)) {
		let academicYearId: string | null = null;
		if (opts.classId) {
			const cls = await repo.loadClassForDocument(institutionId, opts.classId);
			academicYearId = cls?.academicYear?.id ?? null;
		}
		let rows = await repo.listFinalDeliberationResults(
			institutionId,
			[studentId],
			academicYearId,
		);
		if (opts.deliberationId) {
			rows = rows.filter((r) => r.deliberationId === opts.deliberationId);
		}
		return resultEligibility(rows, { finalLevelOnly: kind === "diploma" });
	}
	return { eligible: true, classId: opts.classId ?? null };
}

/**
 * Eligibility of every student enrolled in a class, for the batch page: one
 * row per enrollment (withdrawn and pending ones included, flagged), so the
 * count matches the class and nobody is skipped silently.
 */
export async function classDocumentRoster(
	institutionId: string,
	kind: DocumentKind,
	classId: string,
) {
	const enrollments = await repo.listClassEnrollments(institutionId, classId);
	const resultsByStudent = new Map<string, ResultRow[]>();
	if (RESULT_KINDS.has(kind) && enrollments.length > 0) {
		const rows = await repo.listFinalDeliberationResults(
			institutionId,
			enrollments.map((e) => e.studentId),
			enrollments[0].academicYearId,
		);
		for (const r of rows) {
			const list = resultsByStudent.get(r.studentId) ?? [];
			list.push(r);
			resultsByStudent.set(r.studentId, list);
		}
	}
	return enrollments.map((e) => {
		let eligibility: DocumentEligibility;
		if (kind === "enrollment_certificate") {
			eligibility = enrollmentEligibility(
				[
					{
						classId,
						academicYearId: e.academicYearId,
						status: e.enrollmentStatus,
					},
				],
				classId,
			);
		} else if (RESULT_KINDS.has(kind)) {
			eligibility = resultEligibility(resultsByStudent.get(e.studentId) ?? [], {
				finalLevelOnly: kind === "diploma",
			});
		} else {
			eligibility = { eligible: true };
		}
		return {
			studentId: e.studentId,
			registrationNumber: e.registrationNumber,
			firstName: e.firstName,
			lastName: e.lastName,
			enrollmentStatus: e.enrollmentStatus,
			eligible: eligibility.eligible,
			reason: eligibility.reason ?? null,
			decision: eligibility.decision ?? null,
		};
	});
}
