import { inArray } from "drizzle-orm";
import { db } from "../../db";
import { subjects } from "../../db/schema";
import type { TemplateData } from "../template-renderer";

type SubjectAvgEntry = {
	subjectId: string;
	subjectName: string;
	subjectNameFr: string;
	avg: number;
	assessmentCount: number;
	coeff?: number;
};

type SnapshotData = {
	subjectAverages?: Record<string, SubjectAvgEntry>;
	overallAverage?: number | null;
	rank?: number | null;
	mentionCode?: string | null;
};

const DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
	languages: { fr: "Langues", en: "Languages" },
	sciences: { fr: "Sciences", en: "Sciences" },
	humanities: { fr: "Sciences Humaines", en: "Humanities" },
	arts: { fr: "Arts", en: "Arts" },
	pe: { fr: "EPS", en: "Physical Education" },
	other: { fr: "Matières", en: "Subjects" },
};

const DOMAIN_ORDER = [
	"languages",
	"sciences",
	"humanities",
	"arts",
	"pe",
	"other",
];

function appreciation(avg: number, lang: "fr" | "en"): string {
	if (avg >= 16) return lang === "fr" ? "Très bien" : "Excellent";
	if (avg >= 14) return lang === "fr" ? "Bien" : "Good";
	if (avg >= 12) return lang === "fr" ? "Assez bien" : "Fair";
	if (avg >= 10) return lang === "fr" ? "Passable" : "Pass";
	return lang === "fr" ? "Insuffisant" : "Fail";
}

function formatAvg(avg: number): string {
	return avg.toFixed(2).replace(".", ",");
}

function formatDob(dob: Date | null | undefined, lang: "fr" | "en"): string {
	if (!dob) return "—";
	return dob.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US");
}

function formatRank(rank: number | null, lang: "fr" | "en"): string {
	if (rank === null) return "—";
	if (lang === "fr") {
		return `${rank}${rank === 1 ? "er" : "e"}`;
	}
	const suffix =
		rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
	return `${rank}${suffix}`;
}

export async function buildReportCardTemplateData(params: {
	snapshot: SnapshotData;
	student: {
		firstName: string;
		lastName: string;
		gender?: string | null;
		mnu?: string | null;
		dateOfBirth?: Date | null;
	};
	institution: {
		name: string;
		city?: string | null;
		minesecCode?: string | null;
		logoUrl?: string | null;
	};
	className: string;
	yearName: string;
	termNumber: number;
	language: "fr" | "en";
	rank: number | null;
}): Promise<TemplateData> {
	const lang = params.language;
	const subjectAverages = params.snapshot.subjectAverages ?? {};
	const subjectIds = Object.keys(subjectAverages);

	const subjectGroupMap = new Map<string, string | null>();
	if (subjectIds.length > 0) {
		const rows = await db
			.select({ id: subjects.id, subjectGroup: subjects.subjectGroup })
			.from(subjects)
			.where(inArray(subjects.id, subjectIds));
		for (const row of rows) {
			subjectGroupMap.set(row.id, row.subjectGroup ?? null);
		}
	}

	// If all subjects have no group configured, collapse into a single "other" domain.
	const allNull = subjectIds.every((id) => !subjectGroupMap.get(id));

	const domainsMap = new Map<string, SubjectAvgEntry[]>();
	for (const [subjectId, entry] of Object.entries(subjectAverages)) {
		const group = subjectGroupMap.get(subjectId) ?? null;
		const domainKey = allNull || !group ? "other" : group;
		if (!domainsMap.has(domainKey)) {
			domainsMap.set(domainKey, []);
		}
		domainsMap.get(domainKey)?.push(entry);
	}

	const domains: TemplateData[] = [];
	for (const domainKey of DOMAIN_ORDER) {
		const entries = domainsMap.get(domainKey);
		if (!entries || entries.length === 0) continue;

		let domainWeightedSum = 0;
		let domainTotalCoeff = 0;
		for (const e of entries) {
			const coeff = e.coeff ?? 1;
			domainWeightedSum += e.avg * coeff;
			domainTotalCoeff += coeff;
		}
		const domainAvg =
			domainTotalCoeff > 0 ? domainWeightedSum / domainTotalCoeff : 0;

		const label =
			DOMAIN_LABELS[domainKey]?.[lang] ??
			(lang === "fr" ? "Matières" : "Subjects");

		const courses: TemplateData[] = entries.map((e) => ({
			subject: lang === "fr" ? e.subjectNameFr || e.subjectName : e.subjectName,
			coeff: String(e.coeff ?? 1),
			avg: formatAvg(e.avg),
			appreciation: appreciation(e.avg, lang),
			cc: "",
			exam: "",
		}));

		domains.push({
			domain_name: label,
			domain_avg: formatAvg(domainAvg),
			courses,
		});
	}

	const overallAverage =
		typeof params.snapshot.overallAverage === "number"
			? params.snapshot.overallAverage
			: null;

	return {
		institution_name: params.institution.name,
		school_city: params.institution.city ?? "",
		minesec_code: params.institution.minesecCode ?? "",
		logo_url: params.institution.logoUrl ?? "",
		student_name: `${params.student.lastName.toUpperCase()} ${params.student.firstName}`,
		student_mnu: params.student.mnu ?? "—",
		student_dob: formatDob(params.student.dateOfBirth, lang),
		student_gender: params.student.gender ?? "",
		class_name: params.className,
		year_name: params.yearName,
		term: String(params.termNumber),
		overall_avg: overallAverage !== null ? formatAvg(overallAverage) : "—",
		overall_appreciation:
			overallAverage !== null ? appreciation(overallAverage, lang) : "—",
		rank: formatRank(params.rank, lang),
		domains,
	};
}
