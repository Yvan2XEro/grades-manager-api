import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
	classCourses,
	classes,
	exams,
	institutions,
	students,
	teachingUnits,
} from "../../db/schema/app-schema";

/**
 * Repository for fetching data needed for exports
 */
export class ExportsRepo {
	private db = db;

	constructor(private readonly institutionId: string) {}

	/**
	 * Get institution with its optional parent institution
	 * L'institution parente est optionnelle - une institution n'est pas forcément parrainée
	 */
	async getInstitution() {
		const institution = await this.db.query.institutions.findFirst({
			where: eq(institutions.id, this.institutionId),
			with: {
				parentInstitution: true,
			},
		});

		if (!institution) {
			throw new Error(
				"No institution found. Please create an institution first.",
			);
		}

		return institution;
	}

	/**
	 * Get all data needed for a PV export
	 */
	async getPVData(classId: string, semesterId: string, academicYearId: string) {
		// Get class with related data
		const classData = await this.db.query.classes.findFirst({
			where: and(
				eq(classes.id, classId),
				eq(classes.institutionId, this.institutionId),
			),
			with: {
				program: {
					with: {
						teachingUnits: {
							with: {
								courses: true,
							},
						},
					},
				},
				academicYear: true,
				semester: true,
				cycleLevel: {
					with: {
						cycle: true,
					},
				},
				programOption: true,
				classCourses: {
					where: eq(classCourses.semesterId, semesterId),
					with: {
						courseRef: {
							with: {
								teachingUnit: true,
							},
						},
						teacherRef: true,
						exams: {
							with: {
								grades: {
									with: {
										studentRef: {
											with: {
												profile: true,
											},
										},
									},
								},
							},
						},
					},
				},
				students: {
					with: {
						profile: true,
					},
				},
			},
		});

		if (!classData) {
			throw new Error("Class not found");
		}

		console.log({ academicYearId, classYear: classData.academicYear });
		const classAcademicYearId =
			typeof classData.academicYear === "string"
				? (typeof classData.academicYear as string)
				: (classData.academicYear as any).id;
		if (classAcademicYearId !== academicYearId) {
			throw new Error("Class does not belong to the requested academic year");
		}

		return classData;
	}

	/**
	 * Get all data needed for an evaluation export
	 */
	async getEvaluationData(examId: string) {
		const examData = await this.db.query.exams.findFirst({
			where: and(
				eq(exams.id, examId),
				eq(exams.institutionId, this.institutionId),
			),
			with: {
				classCourseRef: {
					with: {
						classRef: {
							with: {
								program: true,
								academicYear: true,
								semester: true,
								cycleLevel: true,
							},
						},
						courseRef: {
							with: {
								teachingUnit: true,
							},
						},
						teacherRef: true,
					},
				},
				grades: {
					with: {
						studentRef: {
							with: {
								profile: true,
							},
						},
					},
				},
			},
		});

		if (!examData) {
			throw new Error("Exam not found");
		}

		return examData;
	}

	/**
	 * Get all data needed for a UE (Teaching Unit) export
	 */
	async getUEData(
		teachingUnitId: string,
		classId: string,
		semesterId: string,
		academicYearId: string,
	) {
		// Get teaching unit
		const ueData = await this.db.query.teachingUnits.findFirst({
			where: eq(teachingUnits.id, teachingUnitId),
			with: {
				program: true,
				courses: true,
			},
		});

		if (!ueData) {
			throw new Error("Teaching unit not found");
		}

		if (ueData.program.institutionId !== this.institutionId) {
			throw new Error("Teaching unit not found for this institution");
		}

		// Get class courses for this UE
		const courseIds = ueData.courses.map((c) => c.id);
		const classCoursesData = await this.db.query.classCourses.findMany({
			where: and(
				eq(classCourses.class, classId),
				inArray(classCourses.course, courseIds),
				eq(classCourses.semesterId, semesterId),
				eq(classCourses.institutionId, this.institutionId),
			),
			with: {
				classRef: {
					with: {
						program: true,
						academicYear: true,
						semester: true,
						cycleLevel: true,
					},
				},
				courseRef: true,
				exams: {
					with: {
						grades: {
							with: {
								studentRef: {
									with: {
										profile: true,
									},
								},
							},
						},
					},
				},
			},
		});

		// Get all students in class
		const studentsInClass = await this.db.query.students.findMany({
			where: and(
				eq(students.class, classId),
				eq(students.institutionId, this.institutionId),
			),
			with: {
				profile: true,
			},
		});

		return {
			teachingUnit: ueData,
			classCourses: classCoursesData,
			students: studentsInClass,
		};
	}
}
