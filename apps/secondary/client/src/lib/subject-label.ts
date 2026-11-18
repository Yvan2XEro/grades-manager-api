export function subjectLabel(
	subject: { name: string; nameFr?: string | null },
	language: string,
): string {
	return language.startsWith("fr")
		? subject.nameFr?.trim() || subject.name
		: subject.name;
}
