import { curriculumStep } from "./foundation-curriculum";
import { cyclesStep } from "./foundation-cycles";
import { programsStep } from "./foundation-programs";
import type { ImportStepDef } from "./types";
import { classesStep } from "./year-classes";
import { coursesStep } from "./year-courses";
import { examsStep } from "./year-exams";
import { studentsStep } from "./year-students";

/** Steps of the guided import, in the order they must be done. */
export const FOUNDATION_STEPS: ImportStepDef[] = [
	cyclesStep,
	programsStep,
	curriculumStep,
];

/** Steps of the import of one academic year, in dependency order. */
export const YEAR_STEPS: ImportStepDef[] = [
	classesStep,
	studentsStep,
	coursesStep,
	examsStep,
];

const ALL_STEPS = [...FOUNDATION_STEPS, ...YEAR_STEPS];

export const IMPORT_STEP_KEYS = ALL_STEPS.map((s) => s.key) as [
	string,
	...string[],
];

export function getImportStep(key: string) {
	const step = ALL_STEPS.find((s) => s.key === key);
	if (!step) throw new Error(`Unknown import step: ${key}`);
	return step;
}

export type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
