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
	courseCode?: string | null;
	classCode?: string | null;
	academicYear?: string | null;
	existingCodes?: string[];
	counterPadding?: number;
};

const normalizeYearSegment = (value?: string | null) => {
	if (!value) return "00";
	const firstYearMatch = value.match(/\d{4}/);
	if (firstYearMatch) {
		return firstYearMatch[0].slice(-2);
	}
	const digits = value.replace(/[^0-9]/g, "");
	if (!digits) return "00";
	if (digits.length >= 2) return digits.slice(-2);
	return digits.padStart(2, "0");
};

export function generateClassCourseCode({
	courseCode,
	classCode,
	academicYear,
	existingCodes = [],
	counterPadding = 2,
}: ClassCourseCodeInput) {
	const baseCourse = sanitizePrefix(courseCode ?? PROGRAM_FALLBACK);
	const classSegment = sanitizePrefix(classCode ?? "CLS");
	const yearSegment = normalizeYearSegment(academicYear);
	const base = `${baseCourse}-${classSegment}${yearSegment}`;
	const counter = nextCounter(existingCodes, base, counterPadding);
	return `${base}-${counter}`;
}
