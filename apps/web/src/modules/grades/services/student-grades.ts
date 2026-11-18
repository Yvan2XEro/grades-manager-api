import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";
import type { StudentExport, StudentListItem } from "../types";

type ExamDetails = RouterOutputs["exams"]["getById"];
type ClassCourseDetails = RouterOutputs["classCourses"]["getById"];
type CourseDetails = RouterOutputs["courses"]["getById"];

interface GradeItem {
	exam: string;
	score: string | number;
}

/** Students of a class with every grade (and its exam/course), for Excel exports. */
export async function fetchStudentsWithGrades(
	classId: string,
): Promise<StudentExport[]> {
	if (!classId) return [];
	const { items: studentItems } = await trpcClient.students.list.query({
		classId,
		limit: 1000,
	});
	const typedStudents = studentItems as StudentListItem[];
	const examCache = new Map<string, ExamDetails>();
	const classCourseCache = new Map<string, ClassCourseDetails>();
	const courseCache = new Map<string, CourseDetails>();

	return Promise.all(
		typedStudents.map(async (student) => {
			const profile = student.profile;
			const { items: gradeItems } = await trpcClient.grades.listByStudent.query(
				{
					studentId: student.id,
				},
			);
			const grades = await Promise.all(
				gradeItems.map(async (grade: GradeItem) => {
					let exam = examCache.get(grade.exam);
					if (!exam) {
						exam = await trpcClient.exams.getById.query({
							id: grade.exam,
						});
						examCache.set(grade.exam, exam);
					}
					let classCourse = classCourseCache.get(exam.classCourse);
					if (!classCourse) {
						classCourse = await trpcClient.classCourses.getById.query({
							id: exam.classCourse,
						});
						classCourseCache.set(exam.classCourse, classCourse);
					}
					let course = courseCache.get(classCourse.course);
					if (!course) {
						course = await trpcClient.courses.getById.query({
							id: classCourse.course,
						});
						courseCache.set(classCourse.course, course);
					}
					return {
						score: Number(grade.score),
						exam: {
							id: exam.id,
							name: exam.name,
							type: exam.type,
							percentage: Number(exam.percentage),
							sessionType: (exam.sessionType || "normal") as
								| "normal"
								| "retake",
							parentExamId: exam.parentExamId || null,
							scoringPolicy: (exam.scoringPolicy || "replace") as
								| "replace"
								| "best_of",
							class_course: {
								id: classCourse.id,
								code: classCourse.code ?? null,
								course: {
									id: classCourse.course,
									name: course.name,
									code: course.code ?? null,
								},
							},
						},
					};
				}),
			);
			return {
				id: student.id,
				first_name: profile.firstName,
				last_name: profile.lastName,
				registration_number: student.registrationNumber,
				birth_date: profile.dateOfBirth ?? null,
				birth_place: profile.placeOfBirth ?? null,
				gender: profile.gender ?? null,
				grades,
			} as StudentExport;
		}),
	);
}

/** Alphabetical order (last name, then first name). */
export const sortStudentsByName = <
	T extends { last_name: string; first_name: string },
>(
	students: T[],
) =>
	[...students].sort(
		(a, b) =>
			a.last_name.localeCompare(b.last_name) ||
			a.first_name.localeCompare(b.first_name),
	);
