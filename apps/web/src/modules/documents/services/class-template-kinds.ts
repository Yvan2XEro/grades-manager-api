/** Kinds of documents a class can be assigned a template for. */
export type DocumentKind =
	| "diploma"
	| "transcript"
	| "attestation"
	| "student_list";

export const KINDS: Array<{
	value: DocumentKind;
	label: string;
	description: string;
}> = [
	{
		value: "diploma",
		label: "Diplôme",
		description: "Diplôme d'État officiel",
	},
	{
		value: "transcript",
		label: "Relevé de notes",
		description: "Relevé officiel des notes de l'étudiant",
	},
	{
		value: "student_list",
		label: "Liste d'étudiants",
		description: "Liste/roster pour cette classe (colonnes configurables)",
	},
	{
		value: "attestation",
		label: "Attestation",
		description: "Attestation de réussite ou d'inscription",
	},
];
