import type { RouterOutputs } from "@/utils/trpc";

type Ref = { id: string; name: string; code: string };

/** A class as listed in the classes table. */
export interface ClassRow {
	id: string;
	code: string;
	name: string;
	totalCredits: number;
	assignedCredits: number;
	studentCount: number;
	program: { name: string; code: string };
	academicYear: { name: string };
	cycle?: Ref;
	cycleLevel?: Ref;
	programOption?: Ref;
	semester?: Ref;
}

export type ClassListItem =
	RouterOutputs["classes"]["listPaged"]["items"][number];

/** A class with its relations, as loaded by the class detail page. */
export type ClassData = NonNullable<RouterOutputs["classes"]["getById"]>;

/** A course assignment as listed in the assignments table. */
export interface ClassCourseRow {
	id: string;
	code: string;
	class: string;
	course: string;
	teacher: string;
	semesterId: string | null;
	coefficient: number;
	courseName?: string | null;
	courseCode?: string | null;
	ueSemester?: string | null;
	className?: string;
	programName?: string;
	teacherName?: string;
}
