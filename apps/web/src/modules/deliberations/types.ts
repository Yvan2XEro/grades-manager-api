import type { RouterOutputs } from "@/utils/trpc";

// ─── Deliberations ──────────────────────────────────────────────────────────

export type DeliberationListItem =
	RouterOutputs["deliberations"]["listPaged"]["items"][number];
export type Deliberation = RouterOutputs["deliberations"]["getById"];
export type StudentResult = Deliberation["studentResults"][number];
export type UeResult = NonNullable<StudentResult["ueResults"]>[number];
export type LogEntry =
	RouterOutputs["deliberations"]["getLogs"]["items"][number];

export interface OverrideState {
	studentResultId: string;
	studentName: string;
	currentDecision: string;
}

export type DeliberationAction = "open" | "close" | "sign" | "reopen";

export interface RuleFormState {
	id?: string;
	name: string;
	description: string;
	category: string;
	decision: string;
	priority: number;
	ruleset: string;
	isActive: boolean;
}

export type GraduatedStudentItem =
	RouterOutputs["classes"]["graduatedStudentsPaged"]["items"][number];

/** Graduated student enrollment, keyed by its enrollment id for the table. */
export type GraduatedStudentRow = GraduatedStudentItem & { id: string };

// ─── Academic-year transitions ──────────────────────────────────────────────

export type TransitionListItem =
	RouterOutputs["academicYearTransitions"]["list"]["items"][number];
export type Transition = RouterOutputs["academicYearTransitions"]["getById"];
export type TransitionItem =
	RouterOutputs["academicYearTransitions"]["listItems"]["items"][number];
export type TransitionOutcome = TransitionItem["finalOutcome"];
export type ItemStatus = TransitionItem["status"];
export type TransitionStatus = NonNullable<Transition>["status"];
export type TransitionAction = "submit" | "approve" | "execute" | "cancel";
export type Summary = Record<string, number>;

export type TransitionReadiness =
	RouterOutputs["academicYearTransitions"]["getTransitionReadiness"];
export type ReadinessClass = TransitionReadiness["classes"][number];
/** Readiness of one class, keyed by its class id for the table. */
export type ReadinessClassRow = ReadinessClass & { id: string };
export type TransitionAudit =
	RouterOutputs["academicYearTransitions"]["getTransitionAudit"];
