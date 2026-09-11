import type { TemplateData } from "../template-renderer";

export function buildCandidateListTemplateData(params: {
	institution: {
		name: string;
		city?: string | null;
		minesecCode?: string | null;
		centerCode?: string | null;
	};
	examType: string;
	sessionYear: number;
	series?: string | null;
	language: "fr" | "en";
	candidates: Array<{
		candidateNumber?: string | null;
		lastName: string;
		firstName: string;
		mnu?: string | null;
		dateOfBirth?: Date | null;
		isEligible?: boolean;
		isAdmitted?: boolean | null;
		mention?: string | null;
		hasPaidFee?: boolean;
		annualAverage?: number | null;
	}>;
}): TemplateData {
	const lang = params.language;

	const formatDob = (dob: Date | null | undefined): string => {
		if (!dob) return "—";
		return dob.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US");
	};

	const candidates: TemplateData[] = params.candidates.map((c, i) => ({
		num: String(i + 1),
		candidate_number: c.candidateNumber ?? "—",
		student_name: `${c.lastName.toUpperCase()} ${c.firstName}`,
		mnu: c.mnu ?? "—",
		dob: formatDob(c.dateOfBirth),
		eligible: c.isEligible ? "✓" : "✗",
		admitted:
			c.isAdmitted === null || c.isAdmitted === undefined
				? ""
				: c.isAdmitted
					? "✓"
					: "✗",
		mention: c.mention ?? "",
		has_paid: c.hasPaidFee ? "✓" : "✗",
	}));

	return {
		institution_name: params.institution.name,
		school_city: params.institution.city ?? "",
		minesec_code: params.institution.minesecCode ?? "",
		center_code: params.institution.centerCode ?? "",
		exam_type: params.examType,
		session_year: String(params.sessionYear),
		series: params.series ?? "",
		total_candidates: String(params.candidates.length),
		candidates,
	};
}
