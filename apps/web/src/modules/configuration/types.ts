import type { RouterOutputs } from "@/utils/trpc";
import type { RegistrationNumberFormatDefinition } from "../../../../server/src/db/schema/registration-number-types";

export type {
	RegistrationCounterScope,
	RegistrationFormatField,
	RegistrationNumberFormatDefinition,
} from "../../../../server/src/db/schema/registration-number-types";

export type FormatRecord = RouterOutputs["registrationNumbers"]["list"][number];
export type Segment = RegistrationNumberFormatDefinition["segments"][number];
export type CounterSegment = Extract<Segment, { kind: "counter" }>;

/** A registration number format being edited. */
export type DraftFormat = {
	id?: string;
	name: string;
	description?: string | null;
	isActive: boolean;
	definition: RegistrationNumberFormatDefinition;
};

/** Sample student data the preview generates a number for. */
export type PreviewProfile = {
	firstName: string;
	lastName: string;
	nationality: string;
};

export type MentionRange = NonNullable<
	RouterOutputs["gradeScales"]["get"]
>["mentionRanges"][number];
