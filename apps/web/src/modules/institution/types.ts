import type { RouterOutputs } from "@/utils/trpc";

export type InstitutionType = "university" | "institution" | "faculty";

export type Institution = {
	id: string;
	code: string;
	nameFr: string;
	nameEn: string;
	shortName: string | null;
	abbreviation: string | null;
	type: string;
	legalNameFr: string | null;
	legalNameEn: string | null;
	sloganFr: string | null;
	sloganEn: string | null;
	descriptionFr: string | null;
	descriptionEn: string | null;
	addressFr: string | null;
	addressEn: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	fax: string | null;
	postalBox: string | null;
	website: string | null;
	logoUrl: string | null;
	logoSvg: string | null;
	coverImageUrl: string | null;
	parentInstitutionId: string | null;
	institutionId: string | null;
	timezone: string | null;
	defaultAcademicYearId?: string | null;
	registrationFormatId?: string | null;
};

export type StudyCycleRow =
	RouterOutputs["studyCycles"]["listPaged"]["items"][number];

/** The fields of a study cycle the form edits. */
export type StudyCycle = {
	id: string;
	code: string;
	name: string;
	nameEn: string | null;
	description: string | null;
	totalCreditsRequired: number;
	durationYears: number;
};

export type CycleLevel = {
	id: string;
	code: string;
	name: string;
	minCredits: number;
};

export type DocumentParams = {
	signatoryName?: string;
	signatoryTitle?: string;
	city?: string;
};

export type AttendanceExcusePolicy = {
	acceptedCategories?: string[];
	requiresDocument?: boolean;
	approvalDeadlineDays?: number | null;
};
