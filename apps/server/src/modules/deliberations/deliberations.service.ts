import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import type {
	DeliberationDecision,
	DeliberationMention,
	DeliberationStatus,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";
import * as enrollmentsService from "../enrollments/enrollments.service";
import {
	type ExamWithRetake,
	normalizeExamType,
	resolveStudentGradesWithRetakes,
} from "../exports/template-helper";
import type { StudentPromotionFacts } from "../promotion-rules/promotion-rules.types";
import { getStudentPromotionFacts } from "../promotion-rules/student-facts.service";
import { evaluateStudent } from "./deliberation-rules-engine";
import * as repo from "./deliberations.repo";
import type {
	DeliberationCourseResult,
	DeliberationFacts,
	DeliberationStats,
	DeliberationUeResult,
	DiplomationExportData,
	UeDecision,
} from "./deliberations.types";
import type {
	CreateDeliberationInput,
	CreateDeliberationRuleInput,
	ExportDiplomationInput,
	GetLogsInput,
	ListDeliberationRulesInput,
	ListDeliberationsInput,
	OverrideDecisionInput,
	PromoteAdmittedInput,
	TransitionDeliberationInput,
	UpdateDeliberationInput,
	UpdateDeliberationRuleInput,
} from "./deliberations.zod";

const PASSING_GRADE = 10;

// LMD default thresholds
const DEFAULT_VALIDATION_THRESHOLD = 10; // UE validated if average >= 10
const DEFAULT_COMPENSATION_BAR = 8; // UE compensable if average >= 8

// ---------------------------------------------------------------------------
// State machine transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, Record<string, DeliberationStatus>> = {
	draft: { open: "open" },
	open: { close: "closed" },
	closed: { sign: "signed", reopen: "open" },
	signed: {},
};

// ---------------------------------------------------------------------------
// Deliberation CRUD
// ---------------------------------------------------------------------------

export async function create(
	input: CreateDeliberationInput,
	institutionId: string,
	createdBy: string,
) {
	// Validate class exists and belongs to institution
	const klass = await db.query.classes.findFirst({
		where: and(
			eq(schema.classes.id, input.classId),
			eq(schema.classes.institutionId, institutionId),
		),
	});
	if (!klass) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	}

	// Validate academic year
	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, input.academicYearId),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
	if (!year) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Academic year not found",
		});
	}

	const delib = await repo.createDeliberation({
		institutionId,
		classId: input.classId,
		semesterId: input.semesterId ?? null,
		academicYearId: input.academicYearId,
		type: input.type as schema.DeliberationType,
		presidentId: input.presidentId ?? null,
		juryMembers: input.juryMembers,
		deliberationDate: input.deliberationDate
			? new Date(input.deliberationDate)
			: null,
		createdBy,
	});

	await repo.createLog({
		deliberationId: delib.id,
		action: "created",
		actorId: createdBy,
	});

	return delib;
}

export async function update(
	input: UpdateDeliberationInput,
	institutionId: string,
) {
	const existing = await repo.findDeliberationById(input.id, institutionId);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}
	if (existing.status !== "draft") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Can only update deliberations in draft status",
		});
	}

	return repo.updateDeliberation(input.id, institutionId, {
		presidentId: input.presidentId,
		juryMembers: input.juryMembers,
		deliberationDate: input.deliberationDate
			? new Date(input.deliberationDate)
			: undefined,
	});
}

export async function remove(id: string, institutionId: string) {
	const existing = await repo.findDeliberationById(id, institutionId);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}
	if (existing.status !== "draft") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Can only delete deliberations in draft status",
		});
	}
	await repo.deleteDeliberation(id, institutionId);
}

export async function getById(id: string, institutionId: string) {
	const delib = await repo.findDeliberationById(id, institutionId);
	if (!delib) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}

	// Include student results
	const studentResults = await repo.findStudentResultsByDeliberationId(id);
	return { ...delib, studentResults };
}

export async function list(
	input: ListDeliberationsInput,
	institutionId: string,
) {
	return repo.listDeliberations({ ...input, institutionId });
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export async function transition(
	input: TransitionDeliberationInput,
	institutionId: string,
	actorId: string,
) {
	const delib = await repo.findDeliberationById(input.id, institutionId);
	if (!delib) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}

	const allowed = VALID_TRANSITIONS[delib.status];
	const targetStatus = allowed?.[input.action];
	if (!targetStatus) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot ${input.action} a deliberation in '${delib.status}' status`,
		});
	}

	const updates: Partial<schema.NewDeliberation> = {
		status: targetStatus,
	};

	if (input.action === "open") {
		updates.openedAt = new Date();
	} else if (input.action === "close") {
		updates.closedAt = new Date();
	} else if (input.action === "sign") {
		updates.signedAt = new Date();
		updates.signedBy = actorId;
	} else if (input.action === "reopen") {
		updates.closedAt = null;
	}

	const updated = await repo.updateDeliberation(
		input.id,
		institutionId,
		updates,
	);

	const logAction =
		input.action === "open"
			? "opened"
			: input.action === "close"
				? "closed"
				: input.action === "sign"
					? "signed"
					: "reopened";

	await repo.createLog({
		deliberationId: input.id,
		action: logAction as schema.DeliberationLogAction,
		actorId,
	});

	return updated;
}

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

export async function compute(
	id: string,
	institutionId: string,
	actorId: string,
) {
	const delib = await repo.findDeliberationById(id, institutionId);
	if (!delib) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}
	if (delib.status !== "open") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Deliberation must be open to compute results",
		});
	}

	// Get class info with program
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, delib.classId),
		with: {
			program: true,
			cycleLevel: true,
			classCourses: {
				with: {
					courseRef: {
						with: { teachingUnit: true },
					},
					exams: {
						with: {
							grades: {
								with: {
									studentRef: { with: { profile: true } },
								},
							},
						},
					},
				},
			},
			students: {
				with: { profile: true },
			},
		},
	});

	if (!klass) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	}

	// Filter classCourses by semester if semester-specific deliberation
	let classCourses = klass.classCourses;
	if (delib.semesterId) {
		classCourses = classCourses.filter(
			(cc) => cc.semesterId === delib.semesterId,
		);
	}

	// Get applicable rules
	const rules = await repo.findApplicableRules(
		institutionId,
		klass.program.id,
		klass.cycleLevelId,
		delib.type,
	);

	// Build UE map from class courses
	const ueMap = new Map<
		string,
		{
			id: string;
			code: string;
			name: string;
			credits: number;
			courses: Array<{
				id: string;
				code: string;
				name: string;
				coefficient: number;
				exams: ExamWithRetake[];
			}>;
		}
	>();

	for (const cc of classCourses) {
		const ue = cc.courseRef.teachingUnit;
		if (!ueMap.has(ue.id)) {
			ueMap.set(ue.id, {
				id: ue.id,
				code: ue.code,
				name: ue.name,
				credits: ue.credits,
				courses: [],
			});
		}

		const exams = (cc.exams || []).map((exam) => ({
			id: exam.id,
			type: exam.type,
			percentage: Number(exam.percentage),
			sessionType: (exam.sessionType || "normal") as "normal" | "retake",
			parentExamId: exam.parentExamId || null,
			scoringPolicy: (exam.scoringPolicy || "replace") as "replace" | "best_of",
			grades: exam.grades || [],
		})) as ExamWithRetake[];

		ueMap.get(ue.id)?.courses.push({
			id: cc.courseRef.id,
			code: cc.courseRef.code,
			name: cc.courseRef.name,
			coefficient: Number(cc.coefficient) || 1,
			exams,
		});
	}

	// Process each student
	const studentResults: Array<{
		studentId: string;
		registrationNumber: string;
		studentName: string;
		generalAverage: number | null;
		totalCreditsEarned: number;
		totalCreditsPossible: number;
		ueResults: DeliberationUeResult[];
		autoDecision: DeliberationDecision;
		finalDecision: DeliberationDecision;
		rank: number | null;
		mention: DeliberationMention | null;
		rulesEvaluated: schema.NewDeliberationStudentResult["rulesEvaluated"];
		factsSnapshot: Record<string, unknown>;
	}> = [];

	const includeRetakes = delib.type === "retake";

	for (const student of klass.students) {
		// Compute UE results for this student
		const ueResults: DeliberationUeResult[] = [];
		let totalCreditsEarned = 0;
		let totalCreditsPossible = 0;

		for (const ue of ueMap.values()) {
			const courseResults: DeliberationCourseResult[] = [];
			const coursesWithGrades: Array<{
				average: number;
				coefficient: number;
			}> = [];

			for (const course of ue.courses) {
				const resolved = resolveStudentGradesWithRetakes(
					course.exams,
					student.id,
					includeRetakes,
				);

				const cc = resolved.find((r) => normalizeExamType(r.type) === "CC");
				const ex = resolved.find((r) => normalizeExamType(r.type) === "EXAMEN");

				let average: number | null = null;
				if (cc && ex && cc.score !== null && ex.score !== null) {
					average = (cc.score * cc.percentage + ex.score * ex.percentage) / 100;
				} else if (resolved.length > 0) {
					// If there's only one exam type, compute from available grades
					const withScores = resolved.filter((r) => r.score !== null);
					if (withScores.length > 0) {
						const totalPerc = withScores.reduce(
							(sum, r) => sum + r.percentage,
							0,
						);
						if (totalPerc > 0) {
							average =
								withScores.reduce(
									(sum, r) => sum + (r.score ?? 0) * r.percentage,
									0,
								) / totalPerc;
						}
					}
				}

				courseResults.push({
					courseId: course.id,
					courseCode: course.code,
					courseName: course.name,
					coefficient: course.coefficient,
					average,
					cc: cc?.score ?? null,
					ex: ex?.score ?? null,
					ccIsRetake: cc?.isRetake ?? false,
					exIsRetake: ex?.isRetake ?? false,
				});

				if (average !== null) {
					coursesWithGrades.push({
						average,
						coefficient: course.coefficient,
					});
				}
			}

			// UE average: weighted by coefficient
			const allCoursesHaveGrades =
				coursesWithGrades.length === ue.courses.length;
			let ueAverage: number | null = null;

			if (allCoursesHaveGrades && coursesWithGrades.length > 0) {
				const sumWeighted = coursesWithGrades.reduce(
					(sum, c) => sum + c.average * c.coefficient,
					0,
				);
				const sumCoeffs = coursesWithGrades.reduce(
					(sum, c) => sum + c.coefficient,
					0,
				);
				ueAverage = sumCoeffs > 0 ? sumWeighted / sumCoeffs : null;
			}

			const isValidated =
				allCoursesHaveGrades &&
				ueAverage !== null &&
				ueAverage >= DEFAULT_VALIDATION_THRESHOLD;

			let ueDecision: UeDecision;
			if (!allCoursesHaveGrades) {
				ueDecision = "INC";
			} else if (isValidated) {
				ueDecision = "ADM";
			} else {
				ueDecision = "AJ";
			}

			const creditsEarned = isValidated ? ue.credits : 0;
			totalCreditsEarned += creditsEarned;
			totalCreditsPossible += ue.credits;

			ueResults.push({
				ueId: ue.id,
				ueCode: ue.code,
				ueName: ue.name,
				ueCredits: ue.credits,
				ueAverage,
				isValidated,
				isComplete: allCoursesHaveGrades,
				decision: ueDecision,
				creditsEarned,
				courseResults,
			});
		}

		// General average: credit-weighted UE averages
		const uesWithAverages = ueResults.filter((ue) => ue.ueAverage !== null);
		let generalAverage: number | null = null;

		if (uesWithAverages.length > 0) {
			const totalUeCredits = uesWithAverages.reduce(
				(sum, ue) => sum + ue.ueCredits,
				0,
			);
			if (totalUeCredits > 0) {
				generalAverage =
					uesWithAverages.reduce(
						(sum, ue) => sum + ue.ueAverage! * ue.ueCredits,
						0,
					) / totalUeCredits;
			} else {
				generalAverage =
					uesWithAverages.reduce((sum, ue) => sum + ue.ueAverage!, 0) /
					uesWithAverages.length;
			}
		}

		// -------------------------------------------------------------------
		// LMD inter-UE compensation
		// -------------------------------------------------------------------
		// If generalAverage >= threshold, UEs that failed but are above the
		// compensation bar are marked CMP (compensated) and their credits awarded.
		const allComplete = ueResults.every((ue) => ue.isComplete);
		if (
			allComplete &&
			generalAverage !== null &&
			generalAverage >= DEFAULT_VALIDATION_THRESHOLD
		) {
			for (const ue of ueResults) {
				if (
					ue.decision === "AJ" &&
					ue.ueAverage !== null &&
					ue.ueAverage >= DEFAULT_COMPENSATION_BAR
				) {
					ue.decision = "CMP";
					ue.isValidated = true;
					ue.creditsEarned = ue.ueCredits;
					totalCreditsEarned += ue.ueCredits;
				}
			}
		}

		// Get promotion facts for rule evaluation
		let promotionFacts: StudentPromotionFacts;
		try {
			promotionFacts = await getStudentPromotionFacts(
				student.id,
				delib.academicYearId,
				{ rebuildIfMissing: true },
			);
		} catch {
			// Build minimal facts if promotion summary unavailable
			promotionFacts = {
				studentId: student.id,
				registrationNumber: student.registrationNumber,
				classId: klass.id,
				className: klass.name,
				programId: klass.program.id,
				programCode: klass.program.code,
				academicYearId: delib.academicYearId,
				overallAverage: generalAverage ?? 0,
				overallAverageUnweighted: generalAverage ?? 0,
				averageByTeachingUnit: {},
				averageByCourse: {},
				lowestScore: 0,
				highestScore: 0,
				lowestUnitAverage: 0,
				scoresAbove10: 0,
				scoresBelow10: 0,
				scoresBelow8: 0,
				failedCoursesCount: 0,
				failedTeachingUnitsCount: 0,
				compensableFailures: 0,
				eliminatoryFailures: 0,
				validatedCoursesCount: 0,
				validatedUnitsCount: 0,
				successRate: 0,
				unitValidationRate: 0,
				creditsEarned: totalCreditsEarned,
				creditsEarnedThisYear: totalCreditsEarned,
				creditsInProgress: 0,
				creditsAttempted: totalCreditsPossible,
				requiredCredits: totalCreditsPossible,
				creditDeficit: totalCreditsPossible - totalCreditsEarned,
				creditCompletionRate:
					totalCreditsPossible > 0
						? totalCreditsEarned / totalCreditsPossible
						: 0,
				creditSuccessRate: 0,
				coursesWithMultipleAttempts: 0,
				maxAttemptCount: 1,
				totalAttempts: 0,
				activeCourses: 0,
				completedCourses: 0,
				withdrawnCourses: 0,
				failedCourseAttempts: 0,
				firstAttemptSuccessRate: 0,
				retakeSuccessRate: 0,
				enrollmentStatus: "active",
				previousEnrollmentsCount: 0,
				completedYears: 0,
				activeYearsCount: 1,
				performanceIndex: 0,
				isOnTrack: false,
				progressionRate: 0,
				projectedCreditsEndOfYear: totalCreditsEarned,
				canReachRequiredCredits: true,
				admissionType: "normal",
				isTransferStudent: false,
				isDirectAdmission: false,
				hasAcademicHistory: false,
				transferCredits: 0,
				transferInstitution: null,
				transferLevel: null,
			};
		}

		// Build extended deliberation facts
		const compensableUECount = ueResults.filter(
			(ue) =>
				ue.ueAverage !== null &&
				ue.ueAverage >= 8 &&
				ue.ueAverage < PASSING_GRADE,
		).length;

		const deliberationFacts: DeliberationFacts = {
			...promotionFacts,
			overallAverage: generalAverage ?? promotionFacts.overallAverage,
			creditsEarned: totalCreditsEarned,
			compensableUECount,
			allUEsComplete: ueResults.every((ue) => ue.isComplete),
			consecutiveRepeats: 0, // Would need historical data
			previousDeliberationDecision: null, // Would need previous deliberation lookup
			totalUECount: ueResults.length,
			validatedUECount: ueResults.filter((ue) => ue.isValidated).length,
			failedUECount: ueResults.filter((ue) => ue.isComplete && !ue.isValidated)
				.length,
		};

		// -------------------------------------------------------------------
		// LMD default decision (before custom rules)
		// -------------------------------------------------------------------
		let autoDecision: DeliberationDecision = "pending";

		if (!allComplete) {
			// Some UEs have missing grades → cannot decide yet
			autoDecision = "pending";
		} else {
			const allValidatedOrCompensated = ueResults.every(
				(ue) => ue.decision === "ADM" || ue.decision === "CMP",
			);
			if (allValidatedOrCompensated) {
				autoDecision = "admitted";
			} else if (
				generalAverage !== null &&
				generalAverage >= DEFAULT_VALIDATION_THRESHOLD
			) {
				// Average ≥ 10 but at least one UE below compensation bar
				autoDecision = "compensated";
			} else {
				autoDecision = "deferred";
			}
		}

		// Custom rules can override the default decision
		let rulesEvaluated: schema.NewDeliberationStudentResult["rulesEvaluated"] =
			[];

		if (rules.length > 0) {
			const evalResult = await evaluateStudent(rules, deliberationFacts);
			rulesEvaluated = evalResult.traces;
			// Only override if rule engine produced a non-pending decision
			if (evalResult.decision !== "pending") {
				autoDecision = evalResult.decision;
			}
		}

		studentResults.push({
			studentId: student.id,
			registrationNumber: student.registrationNumber,
			studentName: `${student.profile.lastName} ${student.profile.firstName}`,
			generalAverage,
			totalCreditsEarned,
			totalCreditsPossible,
			ueResults,
			autoDecision,
			finalDecision: autoDecision,
			rank: null,
			mention: null,
			rulesEvaluated,
			factsSnapshot: deliberationFacts as unknown as Record<string, unknown>,
		});
	}

	// Compute ranks (by general average descending)
	const ranked = [...studentResults]
		.filter((s) => s.generalAverage !== null)
		.sort((a, b) => (b.generalAverage ?? 0) - (a.generalAverage ?? 0));

	let currentRank = 0;
	let lastAvg: number | null = null;
	for (let i = 0; i < ranked.length; i++) {
		if (ranked[i].generalAverage !== lastAvg) {
			currentRank = i + 1;
			lastAvg = ranked[i].generalAverage;
		}
		const original = studentResults.find(
			(s) => s.studentId === ranked[i].studentId,
		);
		if (original) {
			original.rank = currentRank;
			original.mention = computeMention(original.generalAverage);
		}
	}

	// Compute stats
	const stats = computeStats(studentResults);

	// Upsert results
	await repo.upsertStudentResults(
		studentResults.map((r) => ({
			deliberationId: id,
			studentId: r.studentId,
			generalAverage: r.generalAverage,
			totalCreditsEarned: r.totalCreditsEarned,
			totalCreditsPossible: r.totalCreditsPossible,
			ueResults: r.ueResults,
			autoDecision: r.autoDecision,
			finalDecision: r.finalDecision,
			isOverridden: false,
			rank: r.rank,
			mention: r.mention,
			rulesEvaluated: r.rulesEvaluated,
			factsSnapshot: r.factsSnapshot,
		})),
	);

	// Update deliberation stats
	await repo.updateDeliberation(id, institutionId, {
		stats,
	});

	// Log
	await repo.createLog({
		deliberationId: id,
		action: "computed",
		actorId,
		details: {
			studentsProcessed: studentResults.length,
			rulesApplied: rules.length,
		},
	});

	return {
		deliberationId: id,
		stats,
		results: studentResults,
		computedAt: new Date(),
	};
}

// ---------------------------------------------------------------------------
// Override
// ---------------------------------------------------------------------------

export async function overrideDecision(
	input: OverrideDecisionInput,
	institutionId: string,
	actorId: string,
) {
	const result = await repo.findStudentResultById(input.studentResultId);
	if (!result) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Student result not found",
		});
	}

	// Verify deliberation is open
	const delib = await repo.findDeliberationById(
		input.deliberationId,
		institutionId,
	);
	if (!delib) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}
	if (delib.status !== "open") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Deliberation must be open to override decisions",
		});
	}

	const previousDecision = result.finalDecision;

	const updated = await repo.updateStudentResult(input.studentResultId, {
		finalDecision: input.finalDecision as DeliberationDecision,
		isOverridden: true,
		overrideReason: input.reason,
		overriddenBy: actorId,
		mention: input.mention
			? (input.mention as DeliberationMention)
			: result.mention,
	});

	await repo.createLog({
		deliberationId: input.deliberationId,
		action: "override_decision",
		actorId,
		studentId: result.studentId,
		details: {
			previousDecision,
			newDecision: input.finalDecision,
			reason: input.reason,
		},
	});

	return updated;
}

// ---------------------------------------------------------------------------
// Export diplomation
// ---------------------------------------------------------------------------

export async function exportDiplomation(
	input: ExportDiplomationInput,
	institutionId: string,
	actorId: string,
): Promise<DiplomationExportData> {
	const delib = await repo.findDeliberationById(input.id, institutionId);
	if (!delib) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}
	if (delib.status !== "closed" && delib.status !== "signed") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Deliberation must be closed or signed to export",
		});
	}

	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
	});
	if (!institution) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}

	const results = await repo.findStudentResultsByDeliberationId(input.id);

	// Sort by rank
	const sortedResults = [...results].sort(
		(a, b) => (a.rank ?? 999) - (b.rank ?? 999),
	);

	// Log export
	await repo.createLog({
		deliberationId: input.id,
		action: "exported",
		actorId,
	});

	const signatures =
		(institution.metadata as schema.InstitutionMetadata)?.export_config
			?.signatures?.pv ?? [];

	return {
		institution: {
			name: institution.nameFr,
			code: institution.code,
			logoUrl: institution.logoUrl,
		},
		deliberation: {
			id: delib.id,
			type: delib.type,
			date: delib.deliberationDate?.toISOString() ?? null,
			status: delib.status,
			className: (delib as any).classRef?.name ?? "",
			programName: (delib as any).classRef?.program?.name ?? "",
			academicYearName: (delib as any).academicYear?.name ?? "",
			semesterName: (delib as any).semester?.name ?? null,
		},
		jury: {
			president: delib.presidentId
				? {
						name: (delib as any).president
							? `${(delib as any).president.lastName} ${(delib as any).president.firstName}`
							: "",
						role: "Président",
					}
				: null,
			members: (delib.juryMembers as any[]) ?? [],
		},
		students: sortedResults.map((r) => ({
			rank: r.rank,
			registrationNumber: (r as any).student?.registrationNumber ?? "",
			lastName: (r as any).student?.profile?.lastName ?? "",
			firstName: (r as any).student?.profile?.firstName ?? "",
			generalAverage: r.generalAverage,
			totalCreditsEarned: r.totalCreditsEarned,
			totalCreditsPossible: r.totalCreditsPossible,
			finalDecision: r.finalDecision,
			mention: r.mention,
			ueResults: (r.ueResults as DeliberationUeResult[]) ?? [],
		})),
		stats: delib.stats as DeliberationStats | null,
		signatures,
	};
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export async function getLogs(input: GetLogsInput) {
	return repo.listLogs(input);
}

// ---------------------------------------------------------------------------
// Deliberation Rules CRUD
// ---------------------------------------------------------------------------

export async function createRule(
	input: CreateDeliberationRuleInput,
	institutionId: string,
) {
	return repo.createRule({
		...input,
		institutionId,
		category: input.category as schema.DeliberationRuleCategory,
		deliberationType:
			(input.deliberationType as schema.DeliberationType) ?? null,
		decision: input.decision as schema.DeliberationDecision,
		ruleset: input.ruleset as Record<string, unknown>,
	});
}

export async function updateRule(
	input: UpdateDeliberationRuleInput,
	institutionId: string,
) {
	const existing = await repo.findRuleById(input.id, institutionId);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation rule not found",
		});
	}

	const { id, ...updateData } = input;
	return repo.updateRule(id, institutionId, updateData as any);
}

export async function deleteRule(id: string, institutionId: string) {
	const existing = await repo.findRuleById(id, institutionId);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation rule not found",
		});
	}
	await repo.deleteRule(id, institutionId);
}

export async function getRuleById(id: string, institutionId: string) {
	const rule = await repo.findRuleById(id, institutionId);
	if (!rule) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation rule not found",
		});
	}
	return rule;
}

export async function listRules(
	input: ListDeliberationRulesInput,
	institutionId: string,
) {
	return repo.listRules({ ...input, institutionId });
}

// ---------------------------------------------------------------------------
// Promote admitted students
// ---------------------------------------------------------------------------

export async function promoteAdmitted(
	input: PromoteAdmittedInput,
	institutionId: string,
	actorId: string,
) {
	const delib = await repo.findDeliberationById(
		input.deliberationId,
		institutionId,
	);
	if (!delib) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Deliberation not found",
		});
	}
	if (delib.status !== "closed" && delib.status !== "signed") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Deliberation must be closed or signed to promote students",
		});
	}

	// Validate target class
	const targetClass = await db.query.classes.findFirst({
		where: and(
			eq(schema.classes.id, input.targetClassId),
			eq(schema.classes.institutionId, institutionId),
		),
	});
	if (!targetClass) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Target class not found",
		});
	}

	// Get admitted/compensated students
	const allResults = await repo.findStudentResultsByDeliberationId(
		input.deliberationId,
	);
	const admittedResults = allResults.filter(
		(r) => r.finalDecision === "admitted" || r.finalDecision === "compensated",
	);

	if (admittedResults.length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No admitted students to promote",
		});
	}

	const studentIds = admittedResults.map((r) => r.studentId);

	await db.transaction(async (tx) => {
		// Check for duplicate enrollments in target class
		const existingEnrollments = await tx
			.select({ studentId: schema.enrollments.studentId })
			.from(schema.enrollments)
			.where(
				and(
					inArray(schema.enrollments.studentId, studentIds),
					eq(schema.enrollments.classId, input.targetClassId),
					eq(schema.enrollments.status, "active"),
				),
			);
		if (existingEnrollments.length > 0) {
			const ids = existingEnrollments.map((e) => e.studentId).join(", ");
			throw new TRPCError({
				code: "CONFLICT",
				message: `Students already enrolled in target class: ${ids}`,
			});
		}

		for (const studentId of studentIds) {
			// Close current enrollment
			await enrollmentsService.closeActiveEnrollment(
				studentId,
				"completed",
				undefined,
				tx,
			);

			// Create new enrollment in target class
			await tx.insert(schema.enrollments).values({
				studentId,
				classId: input.targetClassId,
				academicYearId: delib.academicYearId,
				institutionId,
				status: "active",
			});

			// Update student's class reference
			await tx
				.update(schema.students)
				.set({ class: input.targetClassId })
				.where(eq(schema.students.id, studentId));
		}
	});

	// Log outside transaction (repo.createLog uses global db)
	await repo.createLog({
		deliberationId: input.deliberationId,
		action: "promoted",
		actorId,
		details: {
			promotedCount: studentIds.length,
			targetClassId: input.targetClassId,
			targetClassName: targetClass.name,
		},
	});

	return { promotedCount: studentIds.length };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeMention(average: number | null): DeliberationMention | null {
	if (average === null) return null;
	if (average >= 16) return "excellent";
	if (average >= 14) return "tres_bien";
	if (average >= 12) return "bien";
	if (average >= 10) return "assez_bien";
	if (average >= 8) return "passable";
	return null;
}

function computeStats(
	results: Array<{
		generalAverage: number | null;
		finalDecision: DeliberationDecision;
	}>,
): DeliberationStats {
	const total = results.length;
	const averages = results
		.map((r) => r.generalAverage)
		.filter((a): a is number => a !== null);

	const countByDecision = (decision: DeliberationDecision) =>
		results.filter((r) => r.finalDecision === decision).length;

	const admittedCount = countByDecision("admitted");
	const compensatedCount = countByDecision("compensated");

	return {
		totalStudents: total,
		admittedCount,
		compensatedCount,
		deferredCount: countByDecision("deferred"),
		repeatCount: countByDecision("repeat"),
		excludedCount: countByDecision("excluded"),
		pendingCount: countByDecision("pending"),
		classAverage:
			averages.length > 0
				? averages.reduce((sum, a) => sum + a, 0) / averages.length
				: null,
		successRate: total > 0 ? (admittedCount + compensatedCount) / total : 0,
		highestAverage: averages.length > 0 ? Math.max(...averages) : null,
		lowestAverage: averages.length > 0 ? Math.min(...averages) : null,
	};
}
