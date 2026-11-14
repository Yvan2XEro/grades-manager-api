import type { RouterOutputs } from "@/utils/trpc";

export type StatisticsTab =
	| "students"
	| "performance"
	| "finances"
	| "admissions";

export type EnrollmentStats = RouterOutputs["stats"]["enrollmentStats"];
export type PerformanceStats = RouterOutputs["stats"]["performanceStats"];
export type FinanceStats = RouterOutputs["stats"]["financeStats"];
export type AdmissionsStats = RouterOutputs["stats"]["admissionsStats"];

/** A slice of a chart / legend. */
export interface ChartDatum {
	name: string;
	value: number;
	color: string;
}
