export const registrationFormatFields = [
	"academicYearLabel",
	"academicYearStartYear",
	"academicYearStartShort",
	"academicYearEndYear",
	"academicYearEndShort",
	"classCode",
	"programCode",
	"programSlug",
	"programOptionCode",
	"facultyCode",
	"cycleCode",
	"cycleLevelCode",
	"semesterCode",
	"studentNationality",
	"studentFirstInitial",
	"studentLastInitial",
	"studentInitials",
] as const;
export type RegistrationFormatField = (typeof registrationFormatFields)[number];

export const registrationCounterScopes = [
	"global",
	"academicYear",
	"faculty",
	"program",
	"class",
	"programOption",
	"cycle",
	"cycleLevel",
] as const;
export type RegistrationCounterScope = (typeof registrationCounterScopes)[number];

export type RegistrationFormatLiteralSegment = {
	kind: "literal";
	value: string;
};

export type RegistrationFormatFieldSegment = {
	kind: "field";
	field: RegistrationFormatField;
	transform?: "upper" | "lower" | "none";
	length?: number;
	format?: "yy" | "yyyy";
	fallback?: string;
};

export type RegistrationFormatCounterSegment = {
	kind: "counter";
	width?: number;
	scope?: RegistrationCounterScope[];
	start?: number;
	padChar?: string;
};

export type RegistrationFormatSegment =
	| RegistrationFormatLiteralSegment
	| RegistrationFormatFieldSegment
	| RegistrationFormatCounterSegment;

export type RegistrationNumberFormatDefinition = {
	segments: RegistrationFormatSegment[];
};
