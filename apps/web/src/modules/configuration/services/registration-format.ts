import { registrationFormatFields } from "../../../../../server/src/db/schema/registration-number-types";
import type {
	CounterSegment,
	DraftFormat,
	RegistrationCounterScope,
	RegistrationFormatField,
	Segment,
} from "../types";

const defaultField: RegistrationFormatField = registrationFormatFields[0];

/** A new segment of the given kind with its default options. */
export const createSegment = (kind: Segment["kind"]): Segment => {
	switch (kind) {
		case "literal":
			return { kind: "literal", value: "" };
		case "field":
			return {
				kind: "field",
				field: defaultField,
				transform: "upper",
			};
		default:
			return {
				kind: "counter",
				width: 4,
				scope: ["global"],
				start: 1,
				padChar: "0",
			};
	}
};

export const createEmptyDraft = (): DraftFormat => ({
	name: "",
	description: "",
	isActive: false,
	definition: { segments: [] },
});

/** Short text of a segment shown in the formats list. */
export const describeSegment = (segment: Segment) => {
	switch (segment.kind) {
		case "literal":
			return `"${segment.value}"`;
		case "field":
			return `{{${segment.field}}}`;
		case "counter":
			return `#(${segment.scope?.join(",") ?? "global"})`;
		default:
			return "";
	}
};

/** Swaps a segment with its neighbour; unchanged at the ends. */
export const moveSegment = (
	segments: Segment[],
	index: number,
	direction: "up" | "down",
) => {
	const targetIndex = direction === "up" ? index - 1 : index + 1;
	if (targetIndex < 0 || targetIndex >= segments.length) return segments;
	const next = [...segments];
	next[index] = segments[targetIndex];
	next[targetIndex] = segments[index];
	return next;
};

/** Adds or removes a counter scope, keeping at least one. */
export const toggleCounterScope = (
	segment: CounterSegment,
	scope: RegistrationCounterScope,
): CounterSegment => {
	const current = segment.scope ?? ["global"];
	if (current.includes(scope)) {
		if (current.length === 1) return segment;
		return { ...segment, scope: current.filter((item) => item !== scope) };
	}
	return { ...segment, scope: [...current, scope] };
};
