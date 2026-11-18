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

const CLASS_LEVEL_LABELS: Record<ClassLevel, { fr: string; en: string }> = {
	sixth: { fr: "6e", en: "Grade 6" },
	fifth: { fr: "5e", en: "Grade 7" },
	fourth: { fr: "4e", en: "Grade 8" },
	third: { fr: "3e", en: "Grade 9" },
	second: { fr: "2nde", en: "Grade 10" },
	first: { fr: "1re", en: "Grade 11" },
	terminal: { fr: "Terminale", en: "Grade 12" },
};

const LEVEL_TO_GRADE: Record<string, number> = {
	sixth: 6,
	fifth: 7,
	fourth: 8,
	third: 9,
	second: 10,
	first: 11,
	terminal: 12,
};

export function classLevelGrade(level: string): number | undefined {
	return LEVEL_TO_GRADE[level];
}

export function classLevelLabel(level: string, language: "fr" | "en"): string {
	const normalized = normalizeClassLevel(level);
	return normalized ? CLASS_LEVEL_LABELS[normalized][language] : level;
}

export function normalizeClassLevel(level: string): ClassLevel | undefined {
	const grade = classLevelGrade(level);
	return grade ? CLASS_LEVELS[grade - 6] : undefined;
}

export function allowedClassLevels(
	type: InstitutionType,
): readonly ClassLevel[] {
	if (type === "college") return CLASS_LEVELS.slice(0, 4);
	if (type === "lycee") return CLASS_LEVELS.slice(4);
	return CLASS_LEVELS;
}

export function isClassLevelAllowed(
	type: InstitutionType,
	level: string,
): boolean {
	const normalized = normalizeClassLevel(level);
	return normalized ? allowedClassLevels(type).includes(normalized) : false;
}

export function classLevelFilterValues(level: string): string[] {
	const grade = classLevelGrade(level);
	const canonical = grade ? CLASS_LEVELS[grade - 6] : undefined;
	return canonical ? [canonical] : [level];
}
