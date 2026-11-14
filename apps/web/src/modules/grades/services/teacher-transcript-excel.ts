import { format } from "date-fns";
import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import { trpcClient } from "@/utils/trpc";
import type { TeacherExportExam } from "../types";
import { sortStudentsByName } from "./student-grades";

interface TeacherStudentExport {
	id: string;
	first_name: string;
	last_name: string;
	registration_number: string;
	birth_date: string | null;
	birth_place: string | null;
	gender: string | null;
	grades: {
		score: number;
		exam: {
			id: string;
			percentage: number;
			class_course: { course: { name: string } };
		};
	}[];
}

interface StudentItem {
	id: string;
	registrationNumber: string;
	profile: {
		firstName: string;
		lastName: string;
		dateOfBirth: string | null;
		placeOfBirth: string | null;
		gender: string | null;
	};
}

/** Students of the class with their grades on the selected exams. */
async function fetchStudentsWithSelectedGrades(
	classId: string,
	exams: TeacherExportExam[],
	selectedExams: string[],
): Promise<TeacherStudentExport[]> {
	const [studentsResult, gradesResult] = await Promise.all([
		trpcClient.students.list.query({
			classId,
			limit: 5000,
		}),
		trpcClient.grades.listByClass.query({
			classId,
			limit: 10000,
		}),
	]);

	const examMetaById = new Map(
		exams.map((exam) => [
			exam.id,
			{
				id: exam.id,
				percentage: exam.percentage,
				class_course: {
					course: { name: exam.courseName },
				},
			},
		]),
	);

	const gradesByStudent = new Map<string, TeacherStudentExport["grades"]>();
	for (const grade of gradesResult.items) {
		if (!selectedExams.includes(grade.exam)) continue;
		const examMeta = examMetaById.get(grade.exam);
		if (!examMeta) continue;
		const bucket = gradesByStudent.get(grade.student) ?? [];
		bucket.push({
			score: Number(grade.score),
			exam: examMeta,
		});
		gradesByStudent.set(grade.student, bucket);
	}

	return studentsResult.items.map(
		(s: StudentItem) =>
			({
				id: s.id,
				first_name: s.profile.firstName,
				last_name: s.profile.lastName,
				registration_number: s.registrationNumber,
				birth_date: s.profile.dateOfBirth ?? null,
				birth_place: s.profile.placeOfBirth ?? null,
				gender: s.profile.gender ?? null,
				grades: gradesByStudent.get(s.id) ?? [],
			}) as TeacherStudentExport,
	);
}

/** Teacher transcript: average per course of the selected exams, as Excel. */
export async function exportTeacherTranscript({
	classId,
	className,
	exams,
	selectedExams,
	t,
}: {
	classId: string;
	className: string;
	exams: TeacherExportExam[];
	selectedExams: string[];
	t: TFunction;
}) {
	const students = await fetchStudentsWithSelectedGrades(
		classId,
		exams,
		selectedExams,
	);

	const exportData = sortStudentsByName(students).map((student) => {
		const courseGrades = new Map<string, number[]>();
		student.grades.forEach((grade) => {
			const courseName = grade.exam.class_course.course.name;
			if (!courseGrades.has(courseName)) {
				courseGrades.set(courseName, []);
			}
			if (selectedExams.includes(grade.exam.id)) {
				courseGrades.get(courseName)?.push(grade.score);
			}
		});
		const courseAverages = new Map<string, number>();
		courseGrades.forEach((grades, course) => {
			if (grades.length > 0) {
				const average = grades.reduce((a, b) => a + b, 0) / grades.length;
				courseAverages.set(course, Number(average.toFixed(2)));
			}
		});
		return {
			[t("teacher.gradeExport.columns.lastName")]: student.last_name,
			[t("teacher.gradeExport.columns.firstName")]: student.first_name,
			[t("teacher.gradeExport.columns.registration")]:
				student.registration_number,
			[t("teacher.gradeExport.columns.birthDate")]: student.birth_date
				? format(new Date(student.birth_date), "dd/MM/yyyy")
				: "",
			[t("teacher.gradeExport.columns.birthPlace")]: student.birth_place || "",
			[t("teacher.gradeExport.columns.gender")]: student.gender || "",
			...Object.fromEntries(courseAverages),
		};
	});

	const ws = XLSX.utils.json_to_sheet(exportData);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, t("teacher.gradeExport.sheetName"));
	const filename = `${t("teacher.gradeExport.filePrefix")}_${className}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
	XLSX.writeFile(wb, filename);
}
