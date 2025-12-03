type BaseInput = {
	programCode?: string | null;
	levelCode?: string | null;
	semesterCode?: string | null;
	existingCodes?: string[];
	counterPadding?: number;
};

const PROGRAM_FALLBACK = "PRG";
const LEVEL_FALLBACK = "1";
const SEMESTER_FALLBACK = "1";

const sanitizePrefix = (value?: string | null) => {
	if (!value) return PROGRAM_FALLBACK;
	const normalized = value.replace(/[^a-z0-9]/gi, "").toUpperCase();
	return normalized.length ? normalized.slice(0, 6) : PROGRAM_FALLBACK;
};

const extractDigits = (value?: string | null, fallback = LEVEL_FALLBACK) => {
	if (!value) return fallback;
	const match = value.match(/\d+/);
	return match ? match[0] : fallback;
};

const normalizeSemester = (value?: string | null) => {
	if (!value) return SEMESTER_FALLBACK;
	if (/spring/i.test(value)) return "2";
	if (/fall|autumn/i.test(value)) return "1";
	if (/annual/i.test(value)) return "0";
	const match = value.match(/\d+/);
	if (match) return match[0];
	return SEMESTER_FALLBACK;
};

const nextCounter = (
	existingCodes: string[],
	base: string,
	padding: number,
) => {
	const regex = new RegExp(`^${base}-?(\\d+)$`, "i");
	let max = 0;
	for (const code of existingCodes) {
		const match = code.toUpperCase().match(regex);
		if (match) {
			const value = Number(match[1]);
			if (!Number.isNaN(value) && value > max) {
				max = value;
			}
		}
	}
	return String(max + 1).padStart(padding, "0");
};

export function generateCourseCode({
	programCode,
	levelCode,
	semesterCode,
	existingCodes = [],
	counterPadding = 2,
}: BaseInput) {
	const prefix = sanitizePrefix(programCode);
	const level = extractDigits(levelCode);
	const semester = normalizeSemester(semesterCode);
	const base = `${prefix}${level}${semester}`;
	const counter = nextCounter(existingCodes, base, counterPadding);
	return `${base}${counter}`;
}

type ClassCodeInput = BaseInput;

export function generateClassCode({
	programCode,
	levelCode,
	semesterCode,
	existingCodes = [],
	counterPadding = 2,
}: ClassCodeInput) {
	const prefix = sanitizePrefix(programCode);
	const level = extractDigits(levelCode);
	const semester = normalizeSemester(semesterCode);
	const base = `${prefix}${level}${semester}`;
	const counter = nextCounter(existingCodes, base, counterPadding);
	return `${base}-${counter}`;
}

type ClassCourseCodeInput = {
	programCode?: string | null;
	levelCode?: string | null;
	semesterCode?: string | null;
	existingCodes?: string[];
	counterPadding?: number;
};

export function generateClassCourseCode({
	programCode,
	levelCode,
	semesterCode,
	existingCodes = [],
	counterPadding = 1,
}: ClassCourseCodeInput) {
	const prefix = sanitizePrefix(programCode);
	const level = extractDigits(levelCode);
	const semester = normalizeSemester(semesterCode);
	const base = `${prefix}${level}${semester}`;
	const counter = nextCounter(existingCodes, base, counterPadding);
	return `${base}${counter}`;
}
