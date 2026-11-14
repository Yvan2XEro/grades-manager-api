import { curriculumStep } from "./foundation-curriculum";
import { cyclesStep } from "./foundation-cycles";
import { programsStep } from "./foundation-programs";
import type { ImportStepDef } from "./types";

/** Steps of the guided import, in the order they must be done. */
export const FOUNDATION_STEPS: ImportStepDef[] = [
	cyclesStep,
	programsStep,
	curriculumStep,
];

export const IMPORT_STEP_KEYS = FOUNDATION_STEPS.map((s) => s.key) as [
	string,
	...string[],
];

export function getImportStep(key: string) {
	const step = FOUNDATION_STEPS.find((s) => s.key === key);
	if (!step) throw new Error(`Unknown import step: ${key}`);
	return step;
}

export type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
