import { useMemo, useState } from "react";
import type { ExamItem, ExamSort } from "../types";

/** Exams grouped by course, filtered by the search box, and the checked ones. */
export function useExamSelection(
	exams: ExamItem[] | undefined,
	initialSort: ExamSort,
) {
	const [selectedExams, setSelectedExams] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<ExamSort>(initialSort);

	// Group exams by course
	const examsByCourse = useMemo(() => {
		if (!exams) return new Map<string, ExamItem[]>();

		const grouped = new Map<string, ExamItem[]>();
		for (const exam of exams) {
			const courseKey = exam.courseCode || exam.courseName;
			if (!grouped.has(courseKey)) {
				grouped.set(courseKey, []);
			}
			grouped.get(courseKey)?.push(exam);
		}

		// Sort exams within each course by date
		for (const [, courseExams] of grouped) {
			courseExams.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);
		}

		return grouped;
	}, [exams]);

	// Filter and sort exams
	const filteredAndSortedCourses = useMemo(() => {
		if (!exams) return [];

		// Filter by search query
		let filtered = Array.from(examsByCourse.entries());
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(([courseKey, courseExams]) => {
				const courseMatch = courseKey.toLowerCase().includes(query);
				const examMatch = courseExams.some(
					(exam) =>
						exam.name.toLowerCase().includes(query) ||
						exam.type.toLowerCase().includes(query),
				);
				return courseMatch || examMatch;
			});
		}

		// Sort courses
		filtered.sort(([keyA, examsA], [keyB, examsB]) => {
			if (sortBy === "course") {
				return keyA.localeCompare(keyB);
			}
			if (sortBy === "date") {
				const dateA = examsA[0] ? new Date(examsA[0].date).getTime() : 0;
				const dateB = examsB[0] ? new Date(examsB[0].date).getTime() : 0;
				return dateA - dateB;
			}
			// sort by type
			return keyA.localeCompare(keyB);
		});

		return filtered;
	}, [examsByCourse, searchQuery, sortBy, exams]);

	const selectedExamDetails = useMemo(
		() => exams?.filter((exam) => selectedExams.includes(exam.id)) ?? [],
		[exams, selectedExams],
	);

	const selectAll = () => {
		if (!exams) return;
		setSelectedExams(exams.map((e) => e.id));
	};

	const deselectAll = () => setSelectedExams([]);

	const toggleExam = (examId: string, checked: boolean) =>
		setSelectedExams((prev) =>
			checked ? [...prev, examId] : prev.filter((id) => id !== examId),
		);

	const toggleCourse = (courseExams: ExamItem[]) => {
		const courseExamIds = courseExams.map((e) => e.id);
		const allSelected = courseExamIds.every((id) => selectedExams.includes(id));

		if (allSelected) {
			setSelectedExams((prev) =>
				prev.filter((id) => !courseExamIds.includes(id)),
			);
		} else {
			setSelectedExams((prev) => [...new Set([...prev, ...courseExamIds])]);
		}
	};

	return {
		selectedExams,
		selectedExamDetails,
		filteredAndSortedCourses,
		searchQuery,
		setSearchQuery,
		sortBy,
		setSortBy,
		selectAll,
		deselectAll,
		toggleExam,
		toggleCourse,
	};
}

export type ExamSelection = ReturnType<typeof useExamSelection>;
