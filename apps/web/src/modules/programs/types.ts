import type { RouterOutputs } from "@/utils/trpc";

/** A program as listed in the programs table. */
export type ProgramRow = {
	id: string;
	code: string;
	name: string;
	nameEn: string | null;
	abbreviation: string | null;
	description: string | null;
	domainFr: string | null;
	domainEn: string | null;
	specialiteFr: string | null;
	specialiteEn: string | null;
	diplomaTitleFr: string | null;
	diplomaTitleEn: string | null;
	attestationValidityFr: string | null;
	attestationValidityEn: string | null;
	cycleId: string | null;
	centerId: string | null;
	isCenterProgram: boolean;
	optionsCount: number;
};

export type ProgramListItem =
	RouterOutputs["programs"]["list"]["items"][number];

/** A program with its relations, as loaded by the program detail page. */
export type ProgramData = NonNullable<RouterOutputs["programs"]["getById"]>;

export type ProgramOption =
	RouterOutputs["programOptions"]["list"]["items"][number];

export type TeachingUnitRow =
	RouterOutputs["teachingUnits"]["listPaged"]["items"][number];

export type CourseRow = RouterOutputs["courses"]["listPaged"]["items"][number];

/** A course (EC) as listed in a teaching unit's elements table. */
export type UeCourse = {
	id: string;
	name: string;
	code: string;
	hours: number;
	defaultTeacher: string;
	defaultCoefficient: number;
};

/** A course as edited by `CourseFormDialog`. */
export interface EditableCourse {
	id: string;
	code: string;
	name: string;
	hours: number;
	program: string;
	teachingUnitId?: string | null;
	defaultTeacher: string;
}

export type ExportTemplateType =
	| "pv"
	| "evaluation"
	| "ec"
	| "ue"
	| "deliberation"
	| "diploma"
	| "transcript"
	| "attestation"
	| "enrollment_certificate"
	| "student_list"
	| "payment_order"
	| "payment_receipt"
	| "financial_clearance";
