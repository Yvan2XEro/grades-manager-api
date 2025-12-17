import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
	academicYears,
	classCourses,
	classes,
	courses,
	domainUsers,
	exams,
	faculties,
	grades,
	institutions,
	programs,
	semesters,
	students,
	teachingUnits,
} from "../../db/schema/app-schema";

/**
 * Repository for fetching data needed for exports
 */
export class ExportsRepo {
	private db = db;

	/**
	 * Get the default institution (or first institution) with its configuration
	 */
	async getInstitution() {
		const institution = await this.db.query.institutions.findFirst({
			with: {
				faculty: true,
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
			where: eq(classes.id, classId),
			with: {
				program: {
					with: {
						faculty: true,
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

		return classData;
	}

	/**
	 * Get all data needed for an evaluation export
	 */
	async getEvaluationData(examId: string) {
		const examData = await this.db.query.exams.findFirst({
			where: eq(exams.id, examId),
			with: {
				classCourseRef: {
					with: {
						classRef: {
							with: {
								program: {
									with: {
										faculty: true,
									},
								},
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
				program: {
					with: {
						faculty: true,
					},
				},
				courses: true,
			},
		});

		if (!ueData) {
			throw new Error("Teaching unit not found");
		}

		// Get class courses for this UE
		const courseIds = ueData.courses.map((c) => c.id);
		const classCoursesData = await this.db.query.classCourses.findMany({
			where: and(
				eq(classCourses.class, classId),
				inArray(classCourses.course, courseIds),
				eq(classCourses.semesterId, semesterId),
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
			where: eq(students.class, classId),
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
