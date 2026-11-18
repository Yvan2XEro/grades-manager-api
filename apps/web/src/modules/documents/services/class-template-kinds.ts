/** Kinds of documents a class can be assigned a template for. */
export type DocumentKind =
	| "enrollment_certificate"
	| "diploma"
	| "transcript"
	| "attestation"
	| "student_list";

/** Labels live in `admin.documents.kinds.<value>.{label,description}`. */
export const KINDS: Array<{ value: DocumentKind }> = [
	{ value: "enrollment_certificate" },
	{ value: "diploma" },
	{ value: "transcript" },
	{ value: "student_list" },
	{ value: "attestation" },
];
