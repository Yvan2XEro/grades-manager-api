import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type {
	TranscriptCourseResult,
	TranscriptExportData,
	TranscriptStudentData,
	TranscriptUeResult,
} from "../deliberations/deliberations.types";
import {
	type ExamWithRetake,
	type ResolvedGrade,
	resolveStudentGradesWithRetakes,
} from "./template-helper";

export async function buildTranscriptExport(
	classId: string,
	institutionId: string,
): Promise<TranscriptExportData> {
	// Load class with all relations needed
	const klass = await db.query.classes.findFirst({
		where: and(
			eq(schema.classes.id, classId),
			eq(schema.classes.institutionId, institutionId),
		),
		with: {
			program: true,
			cycleLevel: {
				with: { cycle: true },
			},
			academicYear: true,
			semester: true,
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

	const cycleLevel = (klass as any).cycleLevel;
	const studyCycle = cycleLevel?.cycle ?? null;

	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
	});

	if (!institution) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}

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

	for (const cc of klass.classCourses) {
		const ue = (cc as any).courseRef.teachingUnit;
		if (!ueMap.has(ue.id)) {
			ueMap.set(ue.id, {
				id: ue.id,
				code: ue.code,
				name: ue.name,
				credits: ue.credits,
				courses: [],
			});
		}

		const exams = ((cc as any).exams || []).map((exam: any) => ({
			id: exam.id,
			type: exam.type,
			percentage: exam.percentage,
			sessionType: exam.sessionType || "normal",
			parentExamId: exam.parentExamId || null,
			scoringPolicy: exam.scoringPolicy || "replace",
			grades: exam.grades || [],
		})) as ExamWithRetake[];

		ueMap.get(ue.id)?.courses.push({
			id: (cc as any).courseRef.id,
			code: (cc as any).courseRef.code,
			name: (cc as any).courseRef.name,
			coefficient: Number(cc.coefficient) || 1,
			exams,
		});
	}

	const PASSING_GRADE = 10;

	// Build transcript data per student
	const students: TranscriptStudentData[] = (klass as any).students.map(
		(student: any) => {
			const ueResults: TranscriptUeResult[] = [];
			const _totalWeightedAvg = 0;
			let _totalUeCredits = 0;
			let validWeightedSum = 0;
			let validCredits = 0;

			for (const ue of ueMap.values()) {
				const courses: TranscriptCourseResult[] = [];
				const coursesWithGrades: Array<{
					average: number;
					coefficient: number;
				}> = [];

				for (const course of ue.courses) {
					const resolvedGrades: ResolvedGrade[] =
						resolveStudentGradesWithRetakes(
							course.exams,
							student.id,
							true, // include retakes with scoring policy
						);

					let courseAvg: number | null = null;
					let session: "normal" | "retake" = "normal";

					if (resolvedGrades.length > 0) {
						let weightedSum = 0;
						let totalWeight = 0;
						for (const rg of resolvedGrades) {
							if (rg.score !== null) {
								const pct = rg.percentage / 100;
								weightedSum += rg.score * pct;
								totalWeight += pct;
							}
						}
						if (totalWeight > 0) {
							courseAvg = weightedSum / totalWeight;
						}
						// Determine if any retake grade was used
						session = resolvedGrades.some((rg) => rg.isRetake)
							? "retake"
							: "normal";
					}

					courses.push({
						code: course.code,
						name: course.name,
						coefficient: course.coefficient,
						grade:
							courseAvg !== null ? Math.round(courseAvg * 100) / 100 : null,
						session,
					});

					if (courseAvg !== null) {
						coursesWithGrades.push({
							average: courseAvg,
							coefficient: course.coefficient,
						});
					}
				}

				// Calculate UE average (weighted by coefficient)
				let ueAverage: number | null = null;
				if (coursesWithGrades.length > 0) {
					const weightedSum = coursesWithGrades.reduce(
						(sum, c) => sum + c.average * c.coefficient,
						0,
					);
					const totalCoef = coursesWithGrades.reduce(
						(sum, c) => sum + c.coefficient,
						0,
					);
					ueAverage = totalCoef > 0 ? weightedSum / totalCoef : null;
				}

				const isValidated = ueAverage !== null && ueAverage >= PASSING_GRADE;
				const decision: "ADM" | "AJ" = isValidated ? "ADM" : "AJ";

				ueResults.push({
					code: ue.code,
					name: ue.name,
					credits: ue.credits,
					average:
						ueAverage !== null ? Math.round(ueAverage * 100) / 100 : null,
					decision,
					courses,
				});

				_totalUeCredits += ue.credits;
				if (ueAverage !== null) {
					validWeightedSum += ueAverage * ue.credits;
					validCredits += ue.credits;
				}
			}

			const generalAverage =
				validCredits > 0
					? Math.round((validWeightedSum / validCredits) * 100) / 100
					: null;

			const totalCredits = ueResults
				.filter((ue) => ue.decision === "ADM")
				.reduce((sum, ue) => sum + ue.credits, 0);

			return {
				registrationNumber: student.registrationNumber ?? "",
				lastName: student.profile?.lastName ?? "",
				firstName: student.profile?.firstName ?? "",
				dateOfBirth: student.profile?.dateOfBirth ?? null,
				placeOfBirth: student.profile?.placeOfBirth ?? null,
				totalCredits,
				generalAverage,
				ues: ueResults,
			} satisfies TranscriptStudentData;
		},
	);

	// Sort students alphabetically
	students.sort(
		(a, b) =>
			a.lastName.localeCompare(b.lastName) ||
			a.firstName.localeCompare(b.firstName),
	);

	const docParams = (institution.metadata as schema.InstitutionMetadata)
		?.document_params;
	return {
		institution: {
			name: institution.nameFr,
			nameEn: institution.nameEn,
			code: institution.code,
			logoUrl: institution.logoUrl,
			sloganFr: institution.sloganFr ?? null,
			address: institution.addressFr ?? null,
			signatoryName: docParams?.signatoryName ?? null,
			signatoryTitle: docParams?.signatoryTitle ?? null,
			city: docParams?.city ?? null,
		},
		academicYear: {
			name: (klass as any).academicYear?.name ?? "",
		},
		program: {
			name: (klass as any).program?.name ?? "",
			cycle: studyCycle?.name ?? "",
			level: cycleLevel?.name ?? "",
		},
		semester: {
			name: (klass as any).semester?.name ?? "",
			code: (klass as any).semester?.code ?? "",
		},
		className: klass.name,
		students,
	};
}
