/** Kinds of documents a class can be assigned a template for. */
export type DocumentKind =
	| "diploma"
	| "transcript"
	| "attestation"
	| "student_list";

/** Labels live in `admin.documents.kinds.<value>.{label,description}`. */
export const KINDS: Array<{ value: DocumentKind }> = [
	{ value: "diploma" },
	{ value: "transcript" },
	{ value: "student_list" },
	{ value: "attestation" },
];
