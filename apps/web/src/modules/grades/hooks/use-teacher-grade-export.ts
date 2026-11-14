import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { ExportClass, TeacherExportExam } from "../types";

/** Classes (from the teacher's class courses of the year) and exams of a class. */
export function useTeacherGradeExport(
	selectedYear: string,
	selectedClass: string,
) {
	const { data: classCourses } = useQuery({
		queryKey: ["teacher-export-class-courses", selectedYear],
		queryFn: async () => {
			if (!selectedYear) return [];
			const result = await trpcClient.classCourses.list.query({
				academicYearId: selectedYear,
				limit: 500,
			});
			return result.items;
		},
		enabled: !!selectedYear,
	});

	const classes = (classCourses ?? []).reduce<
		Array<Omit<ExportClass, "program"> & { program: { name: string } }>
	>((acc, classCourse) => {
		if (acc.some((item) => item.id === classCourse.class)) {
			return acc;
		}
		acc.push({
			id: classCourse.class,
			name: classCourse.className ?? classCourse.class,
			program: {
				name: classCourse.programName ?? "",
			},
		});
		return acc;
	}, []);

	const { data: exams } = useQuery({
		queryKey: ["teacher-export-exams", selectedClass],
		queryFn: async (): Promise<TeacherExportExam[]> => {
			if (!selectedClass) return [];
			const { items } = await trpcClient.exams.list.query({
				classId: selectedClass,
				limit: 500,
			});
			return items
				.map((exam) => ({
					id: exam.id,
					name: exam.name,
					date: exam.date,
					percentage: Number(exam.percentage),
					courseName: exam.courseName,
				}))
				.sort((a, b) => a.courseName.localeCompare(b.courseName));
		},
		enabled: !!selectedClass,
	});

	return { classes, exams };
}
