import type {
	CourseData,
	ExamData,
	TeacherCoursePeriod,
	TeacherCourseSort,
} from "../types";

/**
 * Half of the academic year we are in: before the middle of the active year
 * is the first semester. Without year dates, September–January is the first.
 */
export function currentYearHalf(
	year?: {
		startDate?: string | Date | null;
		endDate?: string | Date | null;
	} | null,
	now = new Date(),
): "first" | "second" {
	const start = year?.startDate
		? new Date(year.startDate).getTime()
		: Number.NaN;
	const end = year?.endDate ? new Date(year.endDate).getTime() : Number.NaN;
	const time = now.getTime();
	if (
		!Number.isNaN(start) &&
		!Number.isNaN(end) &&
		time >= start &&
		time <= end
	) {
		return time < (start + end) / 2 ? "first" : "second";
	}
	const month = now.getMonth();
	return month >= 8 || month === 0 ? "first" : "second";
}

/** Courses taught in that half of the year; annual courses belong to both. */
export const coursesOfPeriod = (
	courses: CourseData[],
	period: TeacherCoursePeriod,
) =>
	period === "all"
		? courses
		: courses.filter((c) => c.yearHalf === null || c.yearHalf === period);

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
