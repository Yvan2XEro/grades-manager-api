import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
	classCourses,
	classes,
	deliberations,
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

	/** Lookup the parent class_course of an exam (used by eligibility checks) */
	async getExamMeta(examId: string) {
		const exam = await this.db.query.exams.findFirst({
			where: and(
				eq(exams.id, examId),
				eq(exams.institutionId, this.institutionId),
			),
		});
		return exam ? { classCourseId: exam.classCourse } : null;
	}

	/** Resolve the class an exam belongs to (via class_courses). */
	async getClassIdForExam(examId: string): Promise<string | null> {
		const meta = await this.getExamMeta(examId);
		if (!meta) return null;
		const cc = await this.db.query.classCourses.findFirst({
			where: eq(classCourses.id, meta.classCourseId),
		});
		return cc?.class ?? null;
	}

	/** Resolve the class a deliberation targets. */
	async getClassIdForDeliberation(
		deliberationId: string,
	): Promise<string | null> {
		const row = await this.db.query.deliberations.findFirst({
			where: and(
				eq(deliberations.id, deliberationId),
				eq(deliberations.institutionId, this.institutionId),
			),
		});
		return row?.classId ?? null;
	}

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
						// The class_course carries its OWN semesterId; join it so the
						// evaluation export shows the right semester (the class's
						// default semester is often null and was being printed empty).
						semester: true,
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

		// Also load every student of the class so the evaluation publication
		// can list students WITHOUT a grade (absent / not yet evaluated). The
		// previous implementation only iterated over `examData.grades`, which
		// silently dropped students whose grade hadn't been entered yet.
		const classId = examData.classCourseRef.class;
		const classStudents = await this.db.query.students.findMany({
			where: and(
				eq(students.class, classId),
				eq(students.institutionId, this.institutionId),
			),
			with: { profile: true },
		});

		return { ...examData, classStudents };
	}

	/**
	 * Get all data needed for a UE (Teaching Unit) export
	 */
	async getUEData(
		teachingUnitId: string,
		classId: string,
		semesterId: string,
		_academicYearId: string,
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

	/**
	 * Get all data needed for a single EC (class_course) publication.
	 * Returns one class_course with its parent UE/program/class context, all
	 * its exams (with grades), and the students enrolled in the class.
	 */
	async getEcData(classCourseId: string, classId: string) {
		const cc = await this.db.query.classCourses.findFirst({
			where: and(
				eq(classCourses.id, classCourseId),
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
				courseRef: {
					with: {
						teachingUnit: true,
					},
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
		});

		if (!cc) throw new Error("Class course not found");
		if (cc.class !== classId) {
			throw new Error("Class course does not belong to the requested class");
		}

		const studentsInClass = await this.db.query.students.findMany({
			where: and(
				eq(students.class, classId),
				eq(students.institutionId, this.institutionId),
			),
			with: { profile: true },
		});

		return {
			classCourse: cc,
			students: studentsInClass,
		};
	}

	/**
	 * List candidate exam IDs for a bulk evaluation export. Filters by the
	 * common "scope" inputs (academic year / semester / program / class)
	 * and only returns normal-session exams (no retakes — those don't make
	 * sense as standalone publications).
	 */
	async listExamIdsForBulk(filters: {
		academicYearId?: string;
		semesterId?: string;
		programId?: string;
		classId?: string;
	}): Promise<string[]> {
		const rows = await this.db.query.exams.findMany({
			where: and(
				eq(exams.institutionId, this.institutionId),
				eq(exams.sessionType, "normal"),
			),
			columns: { id: true, classCourse: true },
			with: {
				classCourseRef: {
					columns: { class: true, semesterId: true },
					with: {
						classRef: {
							columns: {
								id: true,
								program: true,
								academicYear: true,
							},
						},
					},
				},
			},
		});
		return rows
			.filter((r) => {
				if (
					filters.classId &&
					r.classCourseRef?.classRef?.id !== filters.classId
				)
					return false;
				if (
					filters.semesterId &&
					r.classCourseRef?.semesterId !== filters.semesterId
				)
					return false;
				if (
					filters.academicYearId &&
					r.classCourseRef?.classRef?.academicYear !== filters.academicYearId
				)
					return false;
				if (
					filters.programId &&
					r.classCourseRef?.classRef?.program !== filters.programId
				)
					return false;
				return true;
			})
			.map((r) => r.id);
	}

	/**
	 * List candidate class_course IDs for a bulk EC export. Returns the
	 * `id` and `classId` of each EC matching the scope filters.
	 */
	async listClassCoursesForBulk(filters: {
		academicYearId?: string;
		semesterId?: string;
		programId?: string;
		classId?: string;
	}): Promise<Array<{ id: string; classId: string }>> {
		const rows = await this.db.query.classCourses.findMany({
			where: eq(classCourses.institutionId, this.institutionId),
			columns: { id: true, class: true, semesterId: true },
			with: {
				classRef: {
					columns: { id: true, program: true, academicYear: true },
				},
			},
		});
		return rows
			.filter((r) => {
				if (filters.classId && r.classRef?.id !== filters.classId) return false;
				if (filters.semesterId && r.semesterId !== filters.semesterId)
					return false;
				if (
					filters.academicYearId &&
					r.classRef?.academicYear !== filters.academicYearId
				)
					return false;
				if (filters.programId && r.classRef?.program !== filters.programId)
					return false;
				return true;
			})
			.map((r) => ({ id: r.id, classId: r.class }));
	}

	/**
	 * List candidate (teachingUnitId, classId, semesterId, academicYearId)
	 * tuples for a bulk UE export. Distinct per (UE × class × semester) so
	 * we don't duplicate when several class_courses share the same UE.
	 */
	async listUeTuplesForBulk(filters: {
		academicYearId?: string;
		semesterId?: string;
		programId?: string;
		classId?: string;
	}): Promise<
		Array<{
			teachingUnitId: string;
			classId: string;
			semesterId: string;
			academicYearId: string;
		}>
	> {
		const rows = await this.db.query.classCourses.findMany({
			where: eq(classCourses.institutionId, this.institutionId),
			columns: { class: true, semesterId: true },
			with: {
				courseRef: { columns: { teachingUnitId: true } },
				classRef: {
					columns: { id: true, program: true, academicYear: true },
				},
			},
		});
		const seen = new Set<string>();
		const tuples: Array<{
			teachingUnitId: string;
			classId: string;
			semesterId: string;
			academicYearId: string;
		}> = [];
		for (const r of rows) {
			if (filters.classId && r.classRef?.id !== filters.classId) continue;
			if (filters.semesterId && r.semesterId !== filters.semesterId) continue;
			if (
				filters.academicYearId &&
				r.classRef?.academicYear !== filters.academicYearId
			)
				continue;
			if (filters.programId && r.classRef?.program !== filters.programId)
				continue;
			const teachingUnitId = r.courseRef?.teachingUnitId;
			const semesterId = r.semesterId;
			const academicYearId = r.classRef?.academicYear;
			const classId = r.classRef?.id;
			if (!teachingUnitId || !semesterId || !academicYearId || !classId)
				continue;
			const key = `${teachingUnitId}|${classId}|${semesterId}`;
			if (seen.has(key)) continue;
			seen.add(key);
			tuples.push({ teachingUnitId, classId, semesterId, academicYearId });
		}
		return tuples;
	}
}
