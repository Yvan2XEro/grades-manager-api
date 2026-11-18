export const CLASS_LEVELS = [
	"sixth",
	"fifth",
	"fourth",
	"third",
	"second",
	"first",
	"terminal",
] as const;

export type ClassLevel = (typeof CLASS_LEVELS)[number];
export type InstitutionType = "college" | "lycee" | "mixed";

export function normalizeClassLevel(level?: string | null): ClassLevel {
	if (level && CLASS_LEVELS.includes(level as ClassLevel)) {
		return level as ClassLevel;
	}
	return "sixth";
}

export function allowedClassLevels(
	type?: InstitutionType | null,
): ClassLevel[] {
	if (type === "college") return [...CLASS_LEVELS.slice(0, 4)];
	if (type === "lycee") return [...CLASS_LEVELS.slice(4)];
	return [...CLASS_LEVELS];
}
