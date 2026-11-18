import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { RosterStudent, SpreadsheetExam } from "../types";

/** Course header, roster, exams and every grade of a class course. */
export function useSpreadsheetData(courseId: string | undefined) {
	const courseQuery = useQuery({
		queryKey: ["spreadsheet-course", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) throw new Error("missing courseId");
			const cc = await trpcClient.classCourses.getById.query({ id: courseId });
			const klass = await trpcClient.classes.getById.query({ id: cc.class });
			const [course, program] = await Promise.all([
				trpcClient.courses.getById.query({ id: cc.course }),
				trpcClient.programs.getById.query({ id: klass.program }),
			]);
			return {
				className: klass.name,
				courseName: course.name,
				courseCode: course.code,
				programName: program.name,
			};
		},
	});

	const rosterQuery = useQuery({
		queryKey: ["spreadsheet-roster", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as RosterStudent[];
			const { students } = await trpcClient.classCourses.roster.query({
				id: courseId,
			});
			return students as RosterStudent[];
		},
	});

	const examsQuery = useQuery({
		queryKey: ["spreadsheet-exams", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as SpreadsheetExam[];
			const { items } = await trpcClient.exams.list.query({
				classCourseId: courseId,
			});
			return items.map(
				(e: any): SpreadsheetExam => ({
					id: e.id,
					name: e.name,
					type: e.type,
					percentage: Number(e.percentage),
					isLocked: e.isLocked,
					canEdit: e.canEdit ?? false,
				}),
			);
		},
	});

	const gradesQuery = useQuery({
		queryKey: ["spreadsheet-grades", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [];
			const { items } = await trpcClient.grades.listByClassCourse.query({
				classCourseId: courseId,
				limit: 5000,
			});
			return items as Array<{
				id: string;
				student: string;
				exam: string;
				score: string;
			}>;
		},
	});

	return {
		courseInfo: courseQuery.data,
		students: rosterQuery.data,
		exams: examsQuery.data ?? [],
		grades: gradesQuery.data,
		isLoading:
			courseQuery.isLoading ||
			rosterQuery.isLoading ||
			examsQuery.isLoading ||
			gradesQuery.isLoading,
	};
}
