import { useState } from "react";

/** Year + semester filter of a personal timetable; changing the year resets the semester. */
export function useTimetablePeriod() {
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	return {
		academicYearId,
		semesterId,
		/** Query input: only the filters that are set. */
		input: {
			...(academicYearId ? { academicYearId } : {}),
			...(semesterId ? { semesterId } : {}),
		},
		changeAcademicYear: (value: string | null) => {
			setAcademicYearId(value);
			setSemesterId(null);
		},
		changeSemester: setSemesterId,
	};
}

export type TimetablePeriod = ReturnType<typeof useTimetablePeriod>;
