import type { TemplateData } from "../template-renderer";

export function buildClassRosterTemplateData(params: {
	institution: {
		name: string;
		city?: string | null;
		minesecCode?: string | null;
	};
	className: string;
	yearName: string;
	language: "fr" | "en";
	students: Array<{
		firstName: string;
		lastName: string;
		mnu?: string | null;
		dateOfBirth?: Date | null;
		gender?: string | null;
		registrationNumber?: string | null;
	}>;
}): TemplateData {
	const lang = params.language;

	const formatDob = (dob: Date | null | undefined): string => {
		if (!dob) return "—";
		return dob.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US");
	};

	const students: TemplateData[] = params.students.map((s, i) => ({
		num: String(i + 1),
		student_name: `${s.lastName.toUpperCase()} ${s.firstName}`,
		mnu: s.mnu ?? "—",
		dob: formatDob(s.dateOfBirth),
		gender: s.gender ?? "—",
		reg_num: s.registrationNumber ?? "—",
	}));

	return {
		institution_name: params.institution.name,
		school_city: params.institution.city ?? "",
		minesec_code: params.institution.minesecCode ?? "",
		class_name: params.className,
		year_name: params.yearName,
		total_students: String(params.students.length),
		students,
	};
}
