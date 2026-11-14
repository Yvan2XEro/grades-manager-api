import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Filters of the timetable page. The year starts on the active academic year;
 * changing a filter resets the ones that depend on it.
 */
export function useTimetableFilters() {
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [classId, setClassId] = useState<string | null>(null);
	const [teacherId, setTeacherId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);

	// Initialize year filter to the active academic year
	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	const [yearInitialized, setYearInitialized] = useState(false);
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
		if (!yearInitialized && active) {
			setAcademicYearId(active);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

	const currentYearName =
		yearListQuery.data?.items.find((y) => y.id === academicYearId)?.name ??
		null;

	const hasFilters = !!(
		academicYearId ||
		classId ||
		teacherId ||
		classCourseId
	);

	const clear = () => {
		setAcademicYearId(null);
		setSemesterId(null);
		setClassId(null);
		setTeacherId(null);
		setClassCourseId(null);
		setYearInitialized(false); // allow re-init to active year on next mount
	};

	return {
		academicYearId,
		semesterId,
		classId,
		teacherId,
		classCourseId,
		currentYearName,
		hasFilters,
		clear,
		changeAcademicYear: (value: string | null) => {
			setAcademicYearId(value);
			setSemesterId(null);
			setClassId(null);
			setTeacherId(null);
			setClassCourseId(null);
		},
		changeSemester: setSemesterId,
		changeClass: (value: string | null) => {
			setClassId(value);
			setClassCourseId(null);
		},
		changeTeacher: (value: string | null) => {
			setTeacherId(value);
			setClassCourseId(null);
		},
		changeClassCourse: setClassCourseId,
	};
}

export type TimetableFilters = ReturnType<typeof useTimetableFilters>;
