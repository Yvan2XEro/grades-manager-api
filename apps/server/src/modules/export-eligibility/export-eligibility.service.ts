import { TRPCError } from "@trpc/server";
import { notFound } from "@/modules/_shared/errors";
import * as repo from "./export-eligibility.repo";

const WEIGHT_TARGET = 100;
const WEIGHT_TOLERANCE = 0.01;

export type EcEligibility = {
	classCourseId: string;
	courseId: string;
	courseName: string;
	teachingUnitId: string;
	totalWeight: number;
	examCount: number;
	eligible: boolean;
	reason?: string;
};

export type UeEligibility = {
	teachingUnitId: string;
	teachingUnitName: string;
	teachingUnitCode: string;
	eligible: boolean;
	reason?: string;
	courses: EcEligibility[];
};

export type PvEligibility = {
	eligible: boolean;
	reason?: string;
	missingCourses: { classCourseId: string; courseName: string }[];
	incompleteUnits: UeEligibility[];
	allUnits: UeEligibility[];
};

function isWeightFull(weight: number) {
	return Math.abs(weight - WEIGHT_TARGET) < WEIGHT_TOLERANCE;
}

export async function checkEcEligibility(
	classCourseId: string,
	institutionId: string,
): Promise<EcEligibility> {
	const cc = await repo.findClassCourseById(classCourseId, institutionId);
	if (!cc) throw notFound("Class course not found");

	const exams = await repo.getExamsForClassCourse(classCourseId, institutionId);
	const totalWeight = exams
		.filter((e) => e.sessionType === "normal")
		.reduce((sum, e) => sum + Number(e.percentage), 0);

	const eligible = isWeightFull(totalWeight);
	return {
		classCourseId: cc.id,
		courseId: cc.courseId,
		courseName: cc.courseName,
		teachingUnitId: cc.teachingUnitId,
		totalWeight,
		examCount: exams.length,
		eligible,
		reason: eligible
			? undefined
			: `EC weights total ${totalWeight}%, expected 100%`,
	};
}

async function getUeBreakdown(params: {
	classId: string;
	semesterId?: string;
	institutionId: string;
}): Promise<UeEligibility[]> {
	const weights = await repo.getClassCourseExamWeights(params);
	const unitIds = Array.from(new Set(weights.map((w) => w.teachingUnitId)));
	const units = await repo.getTeachingUnitsByIds(unitIds);
	const unitMap = new Map(units.map((u) => [u.id, u]));

	const ecsByUnit = new Map<string, EcEligibility[]>();
	for (const row of weights) {
		const eligible = isWeightFull(row.totalWeight);
		const ec: EcEligibility = {
			classCourseId: row.classCourseId,
			courseId: row.courseId,
			courseName: row.courseName,
			teachingUnitId: row.teachingUnitId,
			totalWeight: row.totalWeight,
			examCount: row.examCount,
			eligible,
			reason: eligible
				? undefined
				: row.examCount === 0
					? "No exams scheduled for this EC"
					: `EC weights total ${row.totalWeight}%, expected 100%`,
		};
		const list = ecsByUnit.get(row.teachingUnitId) ?? [];
		list.push(ec);
		ecsByUnit.set(row.teachingUnitId, list);
	}

	return Array.from(ecsByUnit.entries()).map(([unitId, ecs]) => {
		const unit = unitMap.get(unitId);
		const allEcsEligible = ecs.every((ec) => ec.eligible);
		return {
			teachingUnitId: unitId,
			teachingUnitName: unit?.name ?? "—",
			teachingUnitCode: unit?.code ?? "—",
			eligible: allEcsEligible,
			reason: allEcsEligible
				? undefined
				: "Some ECs in this UE are not fully evaluated (weights ≠ 100%)",
			courses: ecs,
		};
	});
}

export async function checkUeEligibility(params: {
	teachingUnitId: string;
	classId: string;
	semesterId?: string;
	institutionId: string;
}): Promise<UeEligibility> {
	const breakdown = await getUeBreakdown({
		classId: params.classId,
		semesterId: params.semesterId,
		institutionId: params.institutionId,
	});
	const target = breakdown.find(
		(u) => u.teachingUnitId === params.teachingUnitId,
	);
	if (!target) {
		// No class_courses found for this UE in this class/semester — treat as not eligible.
		return {
			teachingUnitId: params.teachingUnitId,
			teachingUnitName: "—",
			teachingUnitCode: "—",
			eligible: false,
			reason: "No courses assigned to this UE for the selected class/semester",
			courses: [],
		};
	}
	return target;
}

export async function checkPvEligibility(params: {
	classId: string;
	semesterId?: string;
	institutionId: string;
}): Promise<PvEligibility> {
	const breakdown = await getUeBreakdown(params);
	const allCourses = breakdown.flatMap((u) => u.courses);

	if (!allCourses.length) {
		return {
			eligible: false,
			reason:
				"No courses assigned to this class for the selected semester — cannot generate a PV",
			missingCourses: [],
			incompleteUnits: [],
			allUnits: breakdown,
		};
	}

	const missingCourses = allCourses
		.filter((c) => !c.eligible)
		.map((c) => ({ classCourseId: c.classCourseId, courseName: c.courseName }));
	const incompleteUnits = breakdown.filter((u) => !u.eligible);

	const eligible = missingCourses.length === 0 && incompleteUnits.length === 0;
	return {
		eligible,
		reason: eligible
			? undefined
			: `${missingCourses.length} course(s) and ${incompleteUnits.length} UE(s) are not fully evaluated`,
		missingCourses,
		incompleteUnits,
		allUnits: breakdown,
	};
}

export function assertEcEligible(ec: EcEligibility) {
	if (!ec.eligible) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				ec.reason ??
				`EC ${ec.courseName} is not ready for export — evaluations must total 100%`,
		});
	}
}

export function assertUeEligible(ue: UeEligibility) {
	if (!ue.eligible) {
		const failing = ue.courses
			.filter((c) => !c.eligible)
			.map((c) => `${c.courseName} (${c.totalWeight}%)`)
			.join(", ");
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: `UE ${ue.teachingUnitName} not exportable — incomplete ECs: ${failing || "n/a"}`,
		});
	}
}

export function assertPvEligible(pv: PvEligibility) {
	if (!pv.eligible) {
		const missing = pv.missingCourses
			.slice(0, 5)
			.map((c) => c.courseName)
			.join(", ");
		const more =
			pv.missingCourses.length > 5
				? ` (+${pv.missingCourses.length - 5} more)`
				: "";
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				pv.missingCourses.length > 0
					? `PV cannot be generated — incomplete courses: ${missing}${more}`
					: (pv.reason ?? "PV is not eligible for export"),
		});
	}
}
