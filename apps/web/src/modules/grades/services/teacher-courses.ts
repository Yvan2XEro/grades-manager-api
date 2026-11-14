import type { CourseData, ExamData, TeacherCourseSort } from "../types";

/** An exam still waiting for the teacher: grades to enter or to submit. */
const examNeedsAction = (e: ExamData) =>
	e.status === "locked" ||
	(!e.isLocked && !["approved", "submitted"].includes(e.status));

export const courseNeedsAction = (course: CourseData) =>
	course.exams.some(examNeedsAction);

function coursePriority(course: CourseData): number {
	if (course.exams.length === 0) return 4;
	if (courseNeedsAction(course)) return 0;
	if (course.exams.some((e) => e.status === "submitted")) return 1;
	if (course.exams.some((e) => e.status === "approved")) return 2;
	return 3;
}

/** Courses matching the search (course, class, program) in the chosen order. */
export function filterTeacherCourses(
	courses: CourseData[],
	{
		search,
		actionOnly,
		sortBy,
	}: { search: string; actionOnly: boolean; sortBy: TeacherCourseSort },
) {
	let list = [...courses];
	if (search) {
		const q = search.toLowerCase();
		list = list.filter(
			(c) =>
				c.courseName.toLowerCase().includes(q) ||
				c.className.toLowerCase().includes(q) ||
				c.programName.toLowerCase().includes(q),
		);
	}
	if (actionOnly) {
		list = list.filter(courseNeedsAction);
	}
	if (sortBy === "relevance") {
		list.sort((a, b) => coursePriority(a) - coursePriority(b));
	} else if (sortBy === "name") {
		list.sort((a, b) => a.courseName.localeCompare(b.courseName));
	} else if (sortBy === "class") {
		list.sort((a, b) => a.className.localeCompare(b.className));
	}
	return list;
}
