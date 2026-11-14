import type { RouterOutputs } from "@/utils/trpc";

/** An academic year as listed in the academic years table. */
export type AcademicYearRow =
	RouterOutputs["academicYears"]["listPaged"]["items"][number];
