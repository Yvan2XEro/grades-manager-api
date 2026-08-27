import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { assessments, enrollments, subjects } from "../../db/schema";
import { notFound } from "../../lib/errors";
import * as repo from "./report-cards.repo";

export async function list(
	institutionId: string,
	academicYearId: string,
	termId?: string,
	classId?: string,
) {
	const results = await repo.findAll(
		institutionId,
		academicYearId,
		termId,
		classId,
	);
	return results.map((row) => row.report_cards);
}

export async function get(id: string, institutionId: string) {
	const card = await repo.findById(id, institutionId);
	if (!card) throw notFound("Report card not found");
	return card;
}

/**
 * Generate a report card for a student in a specific term.
 * Computes averages per subject from all assessments in the term.
 */
export async function generate(
	studentId: string,
	termId: string,
	institutionId: string,
) {
	// Find the enrollment for this student in the term's academic year
	const enrollmentResult = await db
		.select()
		.from(enrollments)
		.where(
			and(
				eq(enrollments.institutionId, institutionId),
				eq(enrollments.studentId, studentId),
			),
		)
		.limit(1);

	const enrollment = enrollmentResult[0];
	if (!enrollment) {
		throw notFound("Student enrollment not found");
	}

	// Fetch all assessments for this student in this term
	const allAssessments = await db
		.select()
		.from(assessments)
		.where(
			and(
				eq(assessments.institutionId, institutionId),
				eq(assessments.studentId, studentId),
				eq(assessments.termId, termId),
			),
		);

	// Group assessments by subject and compute averages
	const subjectAveragesMap: Record<
		string,
		{
			subjectId: string;
			subjectName: string;
			subjectNameFr: string;
			avg: number;
			assessmentCount: number;
		}
	> = {};

	// Fetch all subjects for reference
	const allSubjects = await db
		.select()
		.from(subjects)
		.where(eq(subjects.institutionId, institutionId));

	const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));

	for (const assessment of allAssessments) {
		// Skip absent (null) assessments
		if (!assessment.value) continue;

		if (!subjectAveragesMap[assessment.subjectId]) {
			const subject = subjectMap.get(assessment.subjectId);
			subjectAveragesMap[assessment.subjectId] = {
				subjectId: assessment.subjectId,
				subjectName: subject?.name || "Unknown",
				subjectNameFr: subject?.nameFr || "Unknown",
				avg: 0,
				assessmentCount: 0,
			};
		}

		const record = subjectAveragesMap[assessment.subjectId]!;
		const value = Number.parseFloat(assessment.value.toString());
		record.avg =
			(record.avg * record.assessmentCount + value) /
			(record.assessmentCount + 1);
		record.assessmentCount += 1;
	}

	// Round to 2 decimal places
	const subjectAverages = Object.fromEntries(
		Object.entries(subjectAveragesMap).map(([subjectId, data]) => [
			subjectId,
			{
				subjectId: data.subjectId,
				subjectName: data.subjectName,
				subjectNameFr: data.subjectNameFr,
				avg: Math.round(data.avg * 100) / 100,
				assessmentCount: data.assessmentCount,
			},
		]),
	);

	// Compute overall average
	const values = Object.values(subjectAveragesMap);
	const overallAverage =
		values.length > 0
			? Math.round(
					(values.reduce((sum, s) => sum + s.avg, 0) / values.length) * 100,
				) / 100
			: null;

	const snapshotData = {
		studentId,
		termId,
		enrollmentId: enrollment.id,
		generatedAt: new Date().toISOString(),
		subjectAverages,
		overallAverage,
		assessmentCount: allAssessments.length,
	};

	// Upsert the report card
	const card = await repo.upsert({
		institutionId,
		enrollmentId: enrollment.id,
		termId,
		status: "generated",
		snapshotData,
		language: "fr",
	});

	return card;
}
