import { TRPCError } from "@trpc/server";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";
import type {
	ExportTemplate,
	ExportTemplateType,
} from "../../db/schema/app-schema";
import * as expoTplRepo from "../export-templates/export-templates.repo";
import { loadTemplate, logoHelper } from "../exports/template-helper";
import {
	getDefaultTheme,
	mergeTheme,
	resolveTheme,
	type ThemeKind,
} from "../exports/themes";
import * as repo from "./academic-documents.repo";
import type {
	DocumentKind,
	GenerateDocumentInput,
	GenerateStudentListInput,
	PreviewDocumentBodyInput,
} from "./academic-documents.zod";

// ---------------- Handlebars helpers (registered once) ----------------
let helpersRegistered = false;
function ensureHelpers() {
	if (helpersRegistered) return;
	Handlebars.registerHelper("eq", (a, b) => a === b);
	Handlebars.registerHelper("gt", (a, b) => Number(a) > Number(b));
	Handlebars.registerHelper("gte", (a, b) => Number(a) >= Number(b));
	Handlebars.registerHelper("lt", (a, b) => Number(a) < Number(b));
	Handlebars.registerHelper("lte", (a, b) => Number(a) <= Number(b));
	Handlebars.registerHelper("add", (a, b) => Number(a) + Number(b));
	Handlebars.registerHelper("subtract", (a, b) => Number(a) - Number(b));
	Handlebars.registerHelper("multiply", (a, b) => Number(a) * Number(b));
	Handlebars.registerHelper("divide", (a, b) =>
		Number(b) === 0 ? 0 : Number(a) / Number(b),
	);
	Handlebars.registerHelper("abs", (a) => Math.abs(Number(a)));
	Handlebars.registerHelper("mod", (a, b) => Number(a) % Number(b));
	Handlebars.registerHelper("upper", (a) => String(a ?? "").toUpperCase());
	Handlebars.registerHelper("lower", (a) => String(a ?? "").toLowerCase());
	Handlebars.registerHelper(
		"formatNumber",
		(value: unknown, decimals: unknown = 2) => {
			if (value === null || value === undefined || value === "") return "—";
			const n = typeof value === "number" ? value : Number(value);
			if (!Number.isFinite(n)) return "—";
			// Handlebars trails an options hash; coerce non-number `decimals` to 2
			// so `{{formatNumber x}}` produces 2 decimals like `{{formatNumber x 2}}`.
			const d =
				typeof decimals === "number" && Number.isFinite(decimals)
					? decimals
					: 2;
			return n.toFixed(d).replace(".", ",");
		},
	);
	Handlebars.registerHelper("getAppreciation", (score: unknown) => {
		const n = Number(score);
		if (!Number.isFinite(n)) return "Absent";
		if (n >= 18) return "Excellent";
		if (n >= 16) return "Très Bien";
		if (n >= 14) return "Bien";
		if (n >= 12) return "Assez Bien";
		if (n >= 10) return "Passable";
		return "Insuffisant";
	});
	Handlebars.registerHelper("logo", logoHelper);
	Handlebars.registerHelper("or", (...args: unknown[]) =>
		args.slice(0, -1).some((v) => Boolean(v)),
	);
	helpersRegistered = true;
}

// ---------------- QR code (optional dependency) ----------------
type QrModule = {
	toDataURL: (data: string, opts?: object) => Promise<string>;
};
async function generateQrCode(payload: object): Promise<string | null> {
	try {
		// `qrcode` is an optional runtime dep (declared in package.json); the
		// dynamic import keeps the type-checker happy even before `bun install`.
		const moduleName = "qrcode";
		const mod = (await import(/* @vite-ignore */ moduleName)) as QrModule;
		return await mod.toDataURL(JSON.stringify(payload), {
			errorCorrectionLevel: "M",
			margin: 1,
			width: 200,
		});
	} catch (err) {
		console.warn(
			"[academic-documents] qrcode module not available — skipping QR.",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}

// ---------------- Template + theme resolution ----------------

export type ResolvedTemplate = {
	template: ExportTemplate | null;
	templateBody: string;
	themeStack: Array<Record<string, unknown> | null>;
	theme: Record<string, unknown>;
};

/**
 * Resolution order:
 *   class_export_templates → program_export_templates → institution default
 *   → bundled HTML fallback.
 *
 * Themes are deep-merged: template.themeDefaults ⊕ program.themeOverrides
 * ⊕ class.themeOverrides ⊕ caller-supplied overrides.
 */
export async function resolveDocumentTemplate(
	institutionId: string,
	classId: string | null,
	type: ExportTemplateType,
	options: {
		templateIdOverride?: string;
		themeOverridesOverride?: Record<string, unknown>;
	} = {},
): Promise<ResolvedTemplate> {
	let template: ExportTemplate | null = null;
	let classOverrides: Record<string, unknown> | null = null;
	let programOverrides: Record<string, unknown> | null = null;

	if (options.templateIdOverride) {
		template =
			(await expoTplRepo.findTemplateById(options.templateIdOverride)) ?? null;
	}

	if (!template && classId) {
		const classAssignment = await expoTplRepo.findClassAssignment(
			classId,
			type,
		);
		if (classAssignment) {
			template =
				(await expoTplRepo.findTemplateById(classAssignment.templateId)) ??
				null;
			classOverrides = (classAssignment.themeOverrides ?? null) as Record<
				string,
				unknown
			> | null;
		}
	}

	if (!template && classId) {
		// Try program-scoped default (resolve programId from class)
		const { db } = await import("../../db");
		const schema = await import("../../db/schema/app-schema");
		const { eq } = await import("drizzle-orm");
		const [classRow] = await db
			.select({ programId: schema.classes.program })
			.from(schema.classes)
			.where(eq(schema.classes.id, classId))
			.limit(1);
		if (classRow?.programId) {
			const programAssignment = await expoTplRepo.findProgramAssignment(
				classRow.programId,
				type,
			);
			if (programAssignment) {
				template =
					(await expoTplRepo.findTemplateById(programAssignment.templateId)) ??
					null;
				programOverrides = (programAssignment.themeOverrides ?? null) as Record<
					string,
					unknown
				> | null;
			}
		}
	}

	if (!template) {
		template =
			(await expoTplRepo.findDefaultTemplate(institutionId, type)) ?? null;
	}

	const templateBody = template?.templateBody ?? loadTemplate(type);
	const templateDefaults = (template?.themeDefaults ?? null) as Record<
		string,
		unknown
	> | null;

	// Final theme stack — innermost first
	const themeStack: Array<Record<string, unknown> | null> = [
		templateDefaults,
		programOverrides,
		classOverrides,
		options.themeOverridesOverride ?? null,
	];

	let theme: Record<string, unknown>;
	if (isThemeKind(type)) {
		const validated = resolveTheme(
			type,
			templateDefaults ?? {},
			programOverrides ?? {},
			classOverrides ?? {},
			options.themeOverridesOverride ?? {},
		);
		theme = validated as unknown as Record<string, unknown>;
	} else {
		// Non-document templates (pv/evaluation/ue/deliberation) — just merge.
		theme = themeStack.reduce<Record<string, unknown>>(
			(acc, layer) =>
				layer ? (mergeTheme(acc, layer) as Record<string, unknown>) : acc,
			{},
		);
	}

	return { template, templateBody, themeStack, theme };
}

function isThemeKind(type: ExportTemplateType): type is ThemeKind {
	return (
		type === "diploma" ||
		type === "transcript" ||
		type === "attestation" ||
		type === "student_list"
	);
}

// ---------------- Data assembly ----------------

const COUNTRY_DEFAULTS = {
	fr: "REPUBLIQUE DU CAMEROUN",
	en: "REPUBLIC OF CAMEROON",
	mottoFr: "Paix-Travail-Patrie",
	mottoEn: "Peace-Work-Fatherland",
};
const MINISTRY_DEFAULTS = {
	fr: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR",
	en: "MINISTRY OF HIGHER EDUCATION",
};
const MINISTER_DEFAULTS = {
	titleFr:
		"LE MINISTRE D'ETAT, MINISTRE DE L'ENSEIGNEMENT SUPERIEUR, CHANCELIER DES ORDRES ACADEMIQUES",
	titleEn:
		"THE MINISTER OF STATE, MINISTER OF HIGHER EDUCATION, CHANCELLOR OF ACADEMIC ORDERS",
};

function formatDate(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return String(date);
	return d.toLocaleDateString("fr-FR");
}

/**
 * Reference number builder.
 *
 * IPES (institution.type === "institution"):
 *   {YEAR}/{tutelleSigles top-down…}/VDPSAA/VDSSE/VDRC/CDAASSR/{institutionSigle}
 *   → e.g. 2026/UDO/FMSP/VDPSAA/VDSSE/VDRC/CDAASSR/IUD
 *
 * Faculty (institution.type === "faculty"):
 *   {YEAR}/{tutelleSigles…}/{institutionSigle}/VDPSAA/VDSSE/VDRC/CDAASSR/SSE
 *   → e.g. 2026/UDO/FMSP/VDPSAA/VDSSE/VDRC/CDAASSR/SSE
 *
 * The four constants (VDPSAA / VDSSE / VDRC / CDAASSR) are FMSP/UDo
 * service-codes inherited from the historical reference format. They stay
 * hardcoded for now — wire them through institution metadata if a tenant
 * needs different ones.
 */
function buildReferenceNumber(args: {
	institutionType: "institution" | "faculty" | "university";
	institutionSigle: string;
	tutelleSigles: string[];
	year: number;
}): string {
	const { institutionType, institutionSigle, tutelleSigles, year } = args;
	const constants = ["VDPSAA", "VDSSE", "VDRC", "CDAASSR"];
	const parents = tutelleSigles.filter(Boolean);
	const parts: Array<string | number> =
		institutionType === "faculty"
			? [year, ...parents, institutionSigle, ...constants, "SSE"]
			: [year, ...parents, ...constants, institutionSigle];
	return parts.filter(Boolean).join("/");
}

function diplomaTitleFor(
	kind: DocumentKind,
	programName: string,
	period: "semester" | "annual" = "annual",
) {
	if (kind === "diploma") {
		return {
			fr: `DIPLÔME D'ÉTAT — ${programName.toUpperCase()}`,
			en: `STATE DIPLOMA — ${programName.toUpperCase()}`,
		};
	}
	if (kind === "transcript") {
		// Semester vs year is a meaningful distinction for transcripts in
		// the FMSP/UDo workflow — admins commonly issue a "relevé semestriel"
		// per semester and an "annual transcript" at year-end.
		return period === "semester"
			? {
					fr: "RELEVÉ DE NOTES SEMESTRIEL",
					en: "OFFICIAL SEMESTER TRANSCRIPT",
				}
			: {
					fr: "RELEVÉ DE NOTES ANNUEL",
					en: "OFFICIAL ANNUAL TRANSCRIPT",
				};
	}
	return {
		fr: "ATTESTATION DE RÉUSSITE",
		en: "CERTIFICATE OF ACHIEVEMENT",
	};
}

function mentionLabel(mention: string | null | undefined): string {
	switch (mention) {
		case "excellent":
			return "Excellent";
		case "tres_bien":
			return "Très Bien";
		case "bien":
			return "Bien";
		case "assez_bien":
			return "Assez Bien";
		case "passable":
			return "Passable";
		default:
			return "—";
	}
}

function decisionLabel(decision: string | null | undefined): string {
	switch (decision) {
		case "admitted":
			return "ADMIS";
		case "compensated":
			return "ADMIS PAR COMPENSATION";
		case "deferred":
			return "AJOURNÉ";
		case "repeat":
			return "REDOUBLANT";
		case "excluded":
			return "EXCLU";
		default:
			return "EN ATTENTE";
	}
}

export type DocumentRenderData = Record<string, unknown>;

async function buildRenderData(args: {
	kind: DocumentKind;
	studentCtx: repo.StudentDocumentContext;
	deliberation: Awaited<ReturnType<typeof repo.loadDeliberationResult>>;
	theme: Record<string, unknown>;
	demoMode: boolean;
	/** "semester" | "annual" — defaults to "annual". Drives the document title. */
	period?: "semester" | "annual";
	/** Optional semester filter when period === "semester". */
	semesterId?: string;
}): Promise<DocumentRenderData> {
	const { kind, studentCtx, deliberation, theme, demoMode } = args;
	const period = args.period ?? "annual";
	const { student, institution, tutelleChain } = studentCtx;
	const cls = student.classRef;
	const program = cls?.program;
	// Prefer the full center payload (admin instances + legal texts) for the
	// center-variant templates; fall back to the lightweight relation row.
	const fullCenter = cls?.id ? await repo.loadCenterByClass(cls.id) : null;
	const center = fullCenter ?? program?.center ?? null;
	// `tutelleChain` is loaded by the repo top-down (highest tutelle first), e.g.
	// `[UDo, FMSP]` for ISSAM. Resolve the supervising university (type:
	// university) and faculty (type: faculty) from that chain so the export
	// header can render Ministère → Université → Faculté → Institut.
	const supervisingUniversity =
		tutelleChain.find((i) => i.type === "university") ?? null;
	const supervisingFaculty =
		tutelleChain.find((i) => i.type === "faculty") ?? null;

	const fullName = `${student.profile.lastName ?? ""} ${
		student.profile.firstName ?? ""
	}`.trim();

	const titles = diplomaTitleFor(kind, program?.name ?? "", period);

	const universityName =
		supervisingUniversity?.nameFr ?? institution?.nameFr ?? "";
	const universityNameEn =
		supervisingUniversity?.nameEn ?? institution?.nameEn ?? "";

	const qrPayload = {
		kind,
		mat: student.registrationNumber,
		nom: fullName,
		dateNaissance: student.profile.dateOfBirth ?? null,
		generalAverage: deliberation?.result.generalAverage ?? null,
		mention: deliberation?.result.mention ?? null,
		ref: `${institution?.abbreviation ?? "INS"}/${student.registrationNumber}`,
	};
	const qrCodeImage = await generateQrCode(qrPayload);

	const summary = {
		generalAverage: deliberation?.result.generalAverage ?? null,
		creditsEarned: deliberation?.result.totalCreditsEarned ?? 0,
		creditsTotal: deliberation?.result.totalCreditsPossible ?? 0,
		mention: mentionLabel(deliberation?.result.mention),
		decision: decisionLabel(
			deliberation?.result.finalDecision ?? deliberation?.result.autoDecision,
		),
		rank: deliberation?.result.rank ?? null,
		classSize: null as number | null,
	};

	// Group ueResults into "semesters" for the transcript template.
	const ueResults = deliberation?.result.ueResults ?? [];
	const semesterMap = new Map<
		string,
		{ name: string; ues: Array<Record<string, unknown>> }
	>();
	for (const ue of ueResults) {
		const semKey = "Semestre courant";
		if (!semesterMap.has(semKey))
			semesterMap.set(semKey, { name: semKey, ues: [] });
		semesterMap.get(semKey)!.ues.push({
			code: ue.ueCode,
			name: ue.ueName,
			credits: ue.ueCredits,
			average: ue.ueAverage,
			decision: ue.decision,
			courses: (ue.courseResults ?? []).map((c) => ({
				code: c.courseCode,
				name: c.courseName,
				credits: ue.ueCredits,
				coefficient: c.coefficient ?? 1,
				cc: c.cc ?? null,
				exam: c.ex ?? null,
				average: c.average ?? null,
			})),
		});
	}
	const semesters = Array.from(semesterMap.values());

	const document = {
		titleFr: titles.fr,
		titleEn: titles.en,
		referenceNumber: buildReferenceNumber({
			institutionType: institution?.type ?? "institution",
			institutionSigle:
				institution?.abbreviation ||
				institution?.shortName ||
				institution?.nameFr ||
				"INS",
			tutelleSigles: (tutelleChain ?? []).map(
				(p) => p.abbreviation || p.shortName || p.nameFr || "",
			),
			year: new Date().getFullYear(),
		}),
		issueDate: formatDate(new Date()),
		academicYear: cls?.academicYear?.name ?? "",
		yearObtention: cls?.academicYear?.name?.split("/")?.pop() ?? "",
		year: new Date().getFullYear(),
	};

	// `releve_template.html` and `attestation_template.html` use a flat
	// DIPLOMATION-style data shape (settings.* + student.NOM/PRENOM/...).
	// We expose both shapes here so old (theme.*) and new (settings.*)
	// templates can render from the same renderData.
	const establishmentType: "ipes" | "faculty" =
		institution?.type === "faculty" ? "faculty" : "ipes";

	const themeRecord = theme as Record<string, unknown>;
	const themeFonts = (themeRecord?.fonts ?? {}) as Record<string, unknown>;
	const themeColors = (themeRecord?.colors ?? {}) as Record<string, unknown>;
	// Watermark = the active subject's own logo. For the institution-level
	// templates this is the institution itself (INSES → INSES logo, faculty
	// → faculty logo). The center variant templates ignore these values and
	// use `center.logoSvg/Url` directly so center exports stay self-contained
	// and don't leak parent-institution branding.
	const watermarkLogo = institution?.logoUrl ?? null;
	const watermarkLogoSvg = institution?.logoSvg ?? null;

	const settings = {
		establishmentType,
		themeFont: (themeFonts.main as string) ?? "Times New Roman, serif",
		themeColor: (themeColors.primary as string) ?? "#000000",
		nameFrench: institution?.nameFr ?? "",
		nameEnglish: institution?.nameEn ?? "",
		nameAbreviation: institution?.abbreviation ?? "",
		postalBox: institution?.postalBox ?? "",
		postalBoxEn: institution?.postalBox ?? "",
		email: institution?.contactEmail ?? "",
		logo: watermarkLogo,
		logoSvg: watermarkLogoSvg,
		universityLogo: supervisingUniversity?.logoUrl ?? null,
		universityLogoSvg: supervisingUniversity?.logoSvg ?? null,
		facultyLogo: supervisingFaculty?.logoUrl ?? institution?.logoUrl ?? null,
		facultyLogoSvg: supervisingFaculty?.logoSvg ?? institution?.logoSvg ?? null,
	};

	// DIPLOMATION-shape uppercase keys on `student` (Excel column names).
	const dipStudent = {
		NOM: (student.profile.lastName ?? "").toUpperCase(),
		PRENOM: student.profile.firstName ?? "",
		MATRICULE: student.registrationNumber ?? "",
		"DATE DE NAISSANCE": student.profile.dateOfBirth ?? "—",
		"LIEU DE NAISSANCE": student.profile.placeOfBirth ?? "—",
		"ANNEE ACADEMIQUE": cls?.academicYear?.name ?? "",
		"ANNEE ACADÉMIQUE": cls?.academicYear?.name ?? "",
		CYCLE:
			(cls?.cycleLevel as { cycle?: { name?: string } } | undefined)?.cycle
				?.name ??
			cls?.cycleLevel?.name ??
			"",
		NIVEAU: cls?.cycleLevel?.name ?? "",
		FILIERE: program?.name ?? "",
		SEMESTRE: cls?.semester?.name ?? "",
		OPTION: cls?.programOption?.name ?? "",
		OPTION_EN: cls?.programOption?.name ?? "",
		MENTION: mentionLabel(deliberation?.result.mention),
		MENTION_EN: mentionLabel(deliberation?.result.mention),
		GRADE: deliberation?.result.mention ?? "",
		TOTAL_CREDITS: deliberation?.result.totalCreditsEarned ?? 0,
		MOYENNE: deliberation?.result.generalAverage ?? 0,
		DOMAINE: program?.name ?? "",
		DOMAINE_EN: program?.name ?? "",
		PARCOURS: program?.name ?? "",
		PARCOURS_EN: program?.name ?? "",
		SPECIALITE: cls?.programOption?.name ?? "",
		SPECIALITE_EN: cls?.programOption?.name ?? "",
		FINALITE: "",
		FINALITE_EN: "",
	};

	return {
		theme,
		settings,
		demoMode,
		qrCodeImage,
		country: COUNTRY_DEFAULTS,
		ministry: MINISTRY_DEFAULTS,
		minister: MINISTER_DEFAULTS,
		university: {
			fr: universityName,
			en: universityNameEn,
		},
		faculty: {
			fr: supervisingFaculty?.nameFr ?? "",
			en: supervisingFaculty?.nameEn ?? "",
		},
		institution: {
			id: institution?.id,
			type: institution?.type ?? "institution",
			// Convenience booleans so templates can write `{{#if institution.isIPES}}`
			// instead of `{{#if (eq institution.type 'institution')}}`.
			// "IPES" = Institut Privé d'Enseignement Supérieur, modeled as the
			// `"institution"` row type (not a faculty/university).
			isIPES: institution?.type === "institution",
			isFaculty: institution?.type === "faculty",
			isUniversity: institution?.type === "university",
			nameFr: institution?.nameFr ?? "",
			nameEn: institution?.nameEn ?? "",
			abbreviation: institution?.abbreviation ?? "",
			contactEmail: institution?.contactEmail ?? "",
			postalBox: institution?.postalBox ?? "",
			city: institution?.addressFr ?? "",
			addressFr: institution?.addressFr ?? "",
			addressEn: institution?.addressEn ?? "",
			logoUrl: institution?.logoUrl ?? null,
			logoSvg: institution?.logoSvg ?? null,
			watermarkLogoUrl: watermarkLogo,
			watermarkLogoSvg: watermarkLogoSvg,
		},
		// Full tutelle chain (top-down — highest authority first). Templates
		// iterate with `{{#each tutelleChain}}` so the header adapts to any
		// hierarchy depth (institut → faculté → université → ministère, etc.)
		// without hardcoding `university` / `faculty` placeholders.
		tutelleChain: (tutelleChain ?? []).map((p) => ({
			id: p.id,
			type: p.type,
			nameFr: p.nameFr ?? "",
			nameEn: p.nameEn ?? "",
			shortName: p.shortName ?? "",
			abbreviation: p.abbreviation ?? "",
			postalBox: p.postalBox ?? "",
			contactEmail: p.contactEmail ?? "",
			logoUrl: p.logoUrl ?? null,
			logoSvg: p.logoSvg ?? null,
		})),
		// Direct parent (= last entry in tutelleChain since chain is top-down).
		// Used for the "Doyen de [parent]" signature on IPES documents.
		parentInstitution: (() => {
			const list = tutelleChain ?? [];
			const p = list.length > 0 ? list[list.length - 1] : null;
			if (!p) return null;
			// Display label fallback: abbreviation > shortName > nameFr.
			// Templates use this to render "LE DOYEN <displaySigle>" without
			// having to repeat the fallback chain in Handlebars.
			const displaySigle = p.abbreviation || p.shortName || p.nameFr || "";
			return {
				id: p.id,
				type: p.type,
				nameFr: p.nameFr ?? "",
				nameEn: p.nameEn ?? "",
				shortName: p.shortName ?? "",
				abbreviation: p.abbreviation ?? "",
				displaySigle,
			};
		})(),
		// Full center payload (or null when the program isn't centre-attached).
		// Center-variant templates read this; standard templates ignore it.
		center,
		logos: {
			institution: institution?.logoUrl ?? null,
			institutionSvg: institution?.logoSvg ?? null,
			faculty: supervisingFaculty?.logoUrl ?? null,
			facultySvg: supervisingFaculty?.logoSvg ?? null,
			university: supervisingUniversity?.logoUrl ?? null,
			universitySvg: supervisingUniversity?.logoSvg ?? null,
			ministry: null as string | null,
			ministrySvg: null as string | null,
			coatOfArms: null as string | null,
			coatOfArmsSvg: null as string | null,
			// Logos for every parent in the tutelle chain — paired with the
			// `tutelleChain` entries above (same order). Templates can use
			// `{{this.logoUrl}}` (or `{{{this.logoSvg}}}`) inside
			// `{{#each tutelleChain}}` instead.
		},
		jury: {
			admissionDate: formatDate(deliberation?.deliberation.openedAt) || "—",
			deliberationDate:
				formatDate(deliberation?.deliberation.deliberationDate) || "—",
			number: deliberation?.deliberation.juryNumber ?? "",
		},
		legalGrounds: [
			{
				fr: `Vu les textes en vigueur, portant organisation des enseignements et des évaluations à ${institution?.nameFr ?? "l'institution"}`,
				en: `Mindful of the regulations organizing courses and examinations at ${institution?.nameEn ?? "the institution"}`,
			},
		],
		signatures: [
			{ fr: "L'impétrant", en: "The Holder" },
			{ fr: "Le Recteur", en: "The Rector" },
			{
				fr: "Le Ministre d'Etat, Ministre de l'Enseignement Supérieur,\nChancelier des Ordres Académiques",
				en: "The Minister of State, Minister of Higher Education,\nChancellor of Academic Orders",
				minister: true,
			},
		],
		authority: {
			name: "—",
			role: "Le Doyen",
		},
		watermarkRepeat: Array.from({ length: 24 }),
		showResults: kind === "attestation" && Boolean(deliberation),
		student: {
			id: student.id,
			matricule: student.registrationNumber,
			fullName,
			firstName: student.profile.firstName,
			lastName: student.profile.lastName,
			birthDate: student.profile.dateOfBirth ?? "—",
			birthPlace: student.profile.placeOfBirth ?? "—",
			mentionFr: mentionLabel(deliberation?.result.mention),
			mentionEn: mentionLabel(deliberation?.result.mention),
			option: cls?.programOption?.name ?? "",
			optionEn: cls?.programOption?.name ?? "",
			// DIPLOMATION-shape uppercase keys (used by releve_template.html
			// and attestation_template.html).
			...dipStudent,
		},
		program: {
			name: program?.name ?? "",
			level: cls?.cycleLevel?.name ?? "",
		},
		class: {
			name: cls?.name ?? "",
			code: cls?.code ?? "",
		},
		summary,
		semesters,
	};
}

// ---------------- PDF rendering ----------------

async function renderPdf(html: string, theme: Record<string, unknown>) {
	const page = (theme.page ?? {}) as {
		size?: string;
		orientation?: string;
		margins?: { top?: number; right?: number; bottom?: number; left?: number };
	};
	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
	});
	try {
		const p = await browser.newPage();
		// Use `domcontentloaded` instead of `networkidle0` — the latter waits
		// for ALL network activity to settle, which times out (default 30 s)
		// when the document references external images (institution logos,
		// QR codes hosted elsewhere) that don't load. We then explicitly
		// wait a short tick for inline assets and call it done.
		await p.setContent(html, {
			waitUntil: "domcontentloaded",
			timeout: 60_000,
		});
		// Give in-page images a chance to decode without blocking forever on
		// remote ones. `evaluate` returns once all <img> have either loaded or
		// errored, capped to 5 s.
		await p
			.evaluate(
				() =>
					new Promise<void>((resolve) => {
						const imgs = Array.from(document.images);
						if (imgs.length === 0) return resolve();
						let remaining = imgs.length;
						const done = () => {
							remaining--;
							if (remaining <= 0) resolve();
						};
						const cap = setTimeout(resolve, 5_000);
						for (const img of imgs) {
							if (img.complete) {
								done();
							} else {
								img.addEventListener("load", () => done(), { once: true });
								img.addEventListener("error", () => done(), { once: true });
							}
						}
						return cap;
					}),
			)
			.catch(() => {
				/* ignore — we proceed even if some images failed */
			});
		const pdf = await p.pdf({
			format: (page.size as "A4" | "A3" | "Letter") ?? "A4",
			landscape: page.orientation === "landscape",
			printBackground: true,
			margin: {
				top: `${page.margins?.top ?? 0}mm`,
				right: `${page.margins?.right ?? 0}mm`,
				bottom: `${page.margins?.bottom ?? 0}mm`,
				left: `${page.margins?.left ?? 0}mm`,
			},
		});
		return Buffer.from(pdf);
	} finally {
		await browser.close();
	}
}

function compileAndRender(templateBody: string, data: DocumentRenderData) {
	ensureHelpers();
	const template = Handlebars.compile(templateBody, { noEscape: false });
	return template(data);
}

// ---------------- Public API ----------------

export async function generateDocument(
	institutionId: string,
	input: GenerateDocumentInput,
) {
	const studentCtx = await repo.loadStudentContext(
		institutionId,
		input.studentId,
	);
	if (!studentCtx) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Student ${input.studentId} not found`,
		});
	}

	const deliberation = await repo.loadDeliberationResult(
		institutionId,
		input.studentId,
		input.deliberationId,
	);

	const resolved = await resolveDocumentTemplate(
		institutionId,
		studentCtx.student.class,
		input.kind,
		{
			templateIdOverride: input.templateId,
			themeOverridesOverride: input.themeOverrides,
		},
	);

	const data = await buildRenderData({
		kind: input.kind,
		studentCtx,
		deliberation,
		theme: resolved.theme,
		demoMode: input.demoMode,
		period: input.period,
		semesterId: input.semesterId,
	});

	const html = compileAndRender(resolved.templateBody, data);

	if (input.format === "html") {
		return { content: html, mimeType: "text/html" as const };
	}

	const pdf = await renderPdf(html, resolved.theme);
	return {
		content: pdf.toString("base64"),
		mimeType: "application/pdf" as const,
	};
}

/**
 * Generate a roster (class list, program list, year list) PDF/HTML.
 * Resolves the `student_list` template — pinned to a class via
 * `class_export_templates` when classId is provided, otherwise the
 * institution default.
 */
export async function generateStudentList(
	institutionId: string,
	input: GenerateStudentListInput,
) {
	const students = await repo.listRosterStudents(institutionId, {
		classId: input.classId,
		programId: input.programId,
		academicYearId: input.academicYearId,
		studentIds: input.studentIds,
	});

	const resolved = await resolveDocumentTemplate(
		institutionId,
		input.classId ?? null,
		"student_list",
		{
			templateIdOverride: input.templateId,
			themeOverridesOverride: input.themeOverrides,
		},
	);

	const { db } = await import("../../db");
	const schemaMod = await import("../../db/schema/app-schema");
	const { eq } = await import("drizzle-orm");
	const institution = await db.query.institutions.findFirst({
		where: eq(schemaMod.institutions.id, institutionId),
	});
	const tutelleChain = await repo.loadTutelleChain(institutionId);

	// Derive shared header strings from the tutelle chain.
	const supervisingUniversity =
		tutelleChain.find((i) => i.type === "university") ?? null;
	const supervisingFaculty =
		tutelleChain.find((i) => i.type === "faculty") ?? null;
	const universityName = supervisingUniversity?.nameFr ?? institution?.nameFr;

	// Try to enrich context by loading the first matching class/program/year.
	let contextClass: { name: string; code: string } | null = null;
	let contextProgram: { name: string } | null = null;
	let contextYear: { name: string } | null = null;
	let contextCycleLevel: { name: string } | null = null;
	if (input.classId) {
		const cls = await db.query.classes.findFirst({
			where: eq(schemaMod.classes.id, input.classId),
			with: { program: true, academicYear: true, cycleLevel: true },
		});
		if (cls) {
			contextClass = { name: cls.name, code: cls.code };
			contextProgram = cls.program ? { name: cls.program.name } : null;
			contextYear = cls.academicYear ? { name: cls.academicYear.name } : null;
			contextCycleLevel = cls.cycleLevel ? { name: cls.cycleLevel.name } : null;
		}
	} else if (students[0]?.classRef) {
		// Fall back to first student's context for program/year-wide rosters
		const cls = students[0].classRef;
		contextProgram = cls.program ? { name: cls.program.name } : null;
		contextYear = cls.academicYear ? { name: cls.academicYear.name } : null;
	}

	// Resolve the full center payload (admin instances + legal texts) when
	// applicable so center-variant templates can render the centre block.
	const center = await (async () => {
		if (input.classId) return await repo.loadCenterByClass(input.classId);
		if (input.programId) return await repo.loadCenterByProgram(input.programId);
		const firstClassId = students[0]?.classRef?.id;
		return firstClassId ? await repo.loadCenterByClass(firstClassId) : null;
	})();

	const sortedStudents = [...students].sort(
		(a, b) =>
			(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
			(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
	);

	// Case-insensitive gender lookup — the schema enum is `male|female|other`
	// but historical data and seed files (e.g. `20-users.yaml`) ship the
	// uppercase forms `MALE` / `FEMALE`. Normalize to lowercase before mapping.
	const normalizeGender = (raw: string | null | undefined) => {
		if (!raw) return null;
		const v = String(raw).trim().toLowerCase();
		if (v === "male" || v === "m" || v === "homme" || v === "h") return "male";
		if (v === "female" || v === "f" || v === "femme") return "female";
		if (v === "other" || v === "autre") return "other";
		return v;
	};

	const rows = sortedStudents.map((s, i) => {
		const g = normalizeGender(s.profile.gender);
		return {
			number: i + 1,
			registrationNumber: s.registrationNumber,
			lastName: s.profile.lastName ?? "",
			firstName: s.profile.firstName ?? "",
			gender:
				g === "male"
					? "M"
					: g === "female"
						? "F"
						: g === "other"
							? "Autre"
							: g
								? String(g).toUpperCase()
								: "Non précisé",
			birthDate: s.profile.dateOfBirth ?? "—",
			birthPlace: s.profile.placeOfBirth ?? "—",
			email: s.profile.primaryEmail ?? "",
			phone: s.profile.phone ?? "",
			className: s.classRef?.name ?? "",
			programName: s.classRef?.program?.name ?? "",
		};
	});

	const summary = {
		total: rows.length,
		male: sortedStudents.filter(
			(s) => normalizeGender(s.profile.gender) === "male",
		).length,
		female: sortedStudents.filter(
			(s) => normalizeGender(s.profile.gender) === "female",
		).length,
	};

	const titleParts = [
		"LISTE DES ÉTUDIANTS",
		contextClass?.name,
		contextProgram?.name,
		contextYear?.name,
	].filter(Boolean);

	const data: DocumentRenderData = {
		theme: resolved.theme,
		demoMode: input.demoMode,
		country: COUNTRY_DEFAULTS,
		ministry: MINISTRY_DEFAULTS,
		university: {
			fr: universityName ?? "",
			en: supervisingUniversity?.nameEn ?? institution?.nameEn ?? "",
		},
		faculty: {
			fr: supervisingFaculty?.nameFr ?? institution?.nameFr ?? "",
			en: supervisingFaculty?.nameEn ?? institution?.nameEn ?? "",
		},
		institution: {
			id: institution?.id,
			type: institution?.type ?? "institution",
			isIPES: institution?.type === "institution",
			isFaculty: institution?.type === "faculty",
			isUniversity: institution?.type === "university",
			nameFr: institution?.nameFr ?? "",
			nameEn: institution?.nameEn ?? "",
			abbreviation: institution?.abbreviation ?? "",
			contactEmail: institution?.contactEmail ?? "",
			postalBox: institution?.postalBox ?? "",
			city: institution?.addressFr ?? "",
			logoUrl: institution?.logoUrl ?? null,
			logoSvg: institution?.logoSvg ?? null,
			watermarkLogoUrl: institution?.logoUrl ?? null,
			watermarkLogoSvg: institution?.logoSvg ?? null,
		},
		tutelleChain: tutelleChain.map((p) => ({
			id: p.id,
			type: p.type,
			nameFr: p.nameFr ?? "",
			nameEn: p.nameEn ?? "",
			shortName: p.shortName ?? "",
			abbreviation: p.abbreviation ?? "",
			postalBox: p.postalBox ?? "",
			contactEmail: p.contactEmail ?? "",
			logoUrl: p.logoUrl ?? null,
			logoSvg: p.logoSvg ?? null,
		})),
		parentInstitution: (() => {
			const p =
				tutelleChain.length > 0 ? tutelleChain[tutelleChain.length - 1] : null;
			if (!p) return null;
			const displaySigle = p.abbreviation || p.shortName || p.nameFr || "";
			return {
				id: p.id,
				type: p.type,
				nameFr: p.nameFr ?? "",
				nameEn: p.nameEn ?? "",
				shortName: p.shortName ?? "",
				abbreviation: p.abbreviation ?? "",
				displaySigle,
			};
		})(),
		// Full center payload — read by center-variant templates.
		center,
		logos: {
			faculty: institution?.logoUrl ?? null,
			facultySvg: institution?.logoSvg ?? null,
			ministry: null as string | null,
			ministrySvg: null as string | null,
			coatOfArms: null as string | null,
			coatOfArmsSvg: null as string | null,
		},
		document: {
			title:
				(resolved.theme.display as { titleOverride?: string } | undefined)
					?.titleOverride ?? titleParts.join(" — "),
			subtitle: contextCycleLevel?.name ?? "",
			generatedAt: formatDate(new Date()),
		},
		context: {
			class: contextClass ? `${contextClass.code} — ${contextClass.name}` : "",
			program: contextProgram?.name ?? "",
			academicYear: contextYear?.name ?? "",
			cycleLevel: contextCycleLevel?.name ?? "",
		},
		students: rows,
		summary,
	};

	let html: string;
	try {
		html = compileAndRender(resolved.templateBody, data);
	} catch (err) {
		console.error(
			"[generateStudentList] Handlebars compile/render failed",
			"\n  template:",
			resolved.template?.name ?? "(bundled)",
			"\n  templateId:",
			resolved.template?.id ?? "(none)",
			"\n  variant:",
			resolved.template?.variant ?? "standard",
			"\n  error:",
			err,
		);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Échec du rendu Handlebars (template "${resolved.template?.name ?? "bundled"}") : ${err instanceof Error ? err.message : String(err)}`,
		});
	}
	const usedTemplate = resolved.template
		? {
				id: resolved.template.id,
				name: resolved.template.name,
				variant: resolved.template.variant,
				isSystemDefault: resolved.template.isSystemDefault,
			}
		: {
				id: null,
				name: "Modèle bundled (aucun template DB)",
				variant: "standard" as const,
				isSystemDefault: false,
			};
	if (input.format === "html") {
		return {
			content: html,
			mimeType: "text/html" as const,
			usedTemplate,
		};
	}
	let pdf: Buffer;
	try {
		pdf = await renderPdf(html, resolved.theme);
	} catch (err) {
		console.error(
			"[generateStudentList] Puppeteer renderPdf failed",
			"\n  template:",
			resolved.template?.name ?? "(bundled)",
			"\n  themeKeys:",
			Object.keys(resolved.theme ?? {}).join(","),
			"\n  error:",
			err,
		);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Échec du rendu PDF (Puppeteer) : ${err instanceof Error ? err.message : String(err)}`,
		});
	}
	return {
		content: pdf.toString("base64"),
		mimeType: "application/pdf" as const,
		usedTemplate,
	};
}

export async function previewTemplateBody(
	institutionId: string,
	input: PreviewDocumentBodyInput,
) {
	const data = input.studentId
		? await (async () => {
				const ctx = await repo.loadStudentContext(
					institutionId,
					input.studentId!,
				);
				if (!ctx) return null;
				const deli = await repo.loadDeliberationResult(
					institutionId,
					input.studentId!,
					input.deliberationId,
				);
				return await buildRenderData({
					kind: input.kind,
					studentCtx: ctx,
					deliberation: deli,
					theme: getDefaultTheme(input.kind) as unknown as Record<
						string,
						unknown
					>,
					demoMode: input.demoMode,
				});
			})()
		: await (async () => {
				// No studentId → load the real institution and its tutelle chain
				// so the preview shows accurate header info, while keeping
				// fictitious student/grades data from the sample.
				const sample = buildSampleRenderData(input.kind, input.demoMode);
				const { db } = await import("../../db");
				const schemaMod = await import("../../db/schema/app-schema");
				const { eq } = await import("drizzle-orm");
				const inst = await db.query.institutions.findFirst({
					where: eq(schemaMod.institutions.id, institutionId),
				});
				if (!inst) return sample;
				const chain = await repo.loadTutelleChain(institutionId);
				sample.institution = {
					...(sample.institution as Record<string, unknown>),
					id: inst.id,
					type: inst.type ?? "institution",
					isIPES: inst.type === "institution",
					isFaculty: inst.type === "faculty",
					isUniversity: inst.type === "university",
					nameFr: inst.nameFr ?? "",
					nameEn: inst.nameEn ?? "",
					abbreviation: inst.abbreviation ?? "",
					contactEmail: inst.contactEmail ?? "",
					postalBox: inst.postalBox ?? "",
					city: inst.addressFr ?? "",
					logoUrl: inst.logoUrl ?? null,
					logoSvg: inst.logoSvg ?? null,
					watermarkLogoUrl: inst.logoUrl ?? null,
					watermarkLogoSvg: inst.logoSvg ?? null,
				};
				sample.tutelleChain = chain.map((p) => ({
					id: p.id,
					type: p.type,
					nameFr: p.nameFr ?? "",
					nameEn: p.nameEn ?? "",
					shortName: p.shortName ?? "",
					abbreviation: p.abbreviation ?? "",
					postalBox: p.postalBox ?? "",
					contactEmail: p.contactEmail ?? "",
					logoUrl: p.logoUrl ?? null,
					logoSvg: p.logoSvg ?? null,
				}));
				const direct = chain.length > 0 ? chain[chain.length - 1] : null;
				sample.parentInstitution = direct
					? {
							id: direct.id,
							type: direct.type,
							nameFr: direct.nameFr ?? "",
							nameEn: direct.nameEn ?? "",
							shortName: direct.shortName ?? "",
							abbreviation: direct.abbreviation ?? "",
							displaySigle:
								direct.abbreviation || direct.shortName || direct.nameFr || "",
						}
					: null;
				// Recompute the document reference with the REAL institution +
				// tutelle so the preview shows the correct sigles instead of
				// the sample's hardcoded ones.
				const docRecord = sample.document as Record<string, unknown>;
				docRecord.referenceNumber = buildReferenceNumber({
					institutionType: (inst.type ?? "institution") as
						| "institution"
						| "faculty"
						| "university",
					institutionSigle:
						inst.abbreviation || inst.shortName || inst.nameFr || "INS",
					tutelleSigles: chain.map(
						(p) => p.abbreviation || p.shortName || p.nameFr || "",
					),
					year: new Date().getFullYear(),
				});
				// Replace the stub center from buildSampleRenderData with the
				// institution's actual first active center (with admin instances
				// and legal texts) so center-variant previews mirror production.
				const tplLoader = await import("../exports/template-loader");
				const realCenter =
					await tplLoader.loadFirstCenterForInstitution(institutionId);
				if (realCenter) {
					sample.center = realCenter;
				}
				return sample;
			})();

	if (!data) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Student not found for preview",
		});
	}

	// Apply caller's theme overrides on top of defaults
	const baseTheme = getDefaultTheme(input.kind) as unknown as Record<
		string,
		unknown
	>;
	data.theme = mergeTheme(baseTheme, input.themeOverrides ?? {});

	return compileAndRender(input.templateBody, data);
}

function buildSampleRenderData(
	kind: DocumentKind,
	demoMode: boolean,
): DocumentRenderData {
	const theme = getDefaultTheme(kind) as unknown as Record<string, unknown>;
	const themeFonts = (theme as Record<string, unknown>).fonts as Record<
		string,
		unknown
	>;
	const themeColors = (theme as Record<string, unknown>).colors as Record<
		string,
		unknown
	>;
	return {
		theme,
		settings: {
			establishmentType: "faculty" as const,
			themeFont: (themeFonts?.main as string) ?? "Times New Roman, serif",
			themeColor: (themeColors?.primary as string) ?? "#000000",
			nameFrench: "FACULTE DE DEMONSTRATION",
			nameEnglish: "FACULTY OF DEMONSTRATION",
			nameAbreviation: "DEMO",
			postalBox: "B.P 2701",
			postalBoxEn: "PO box 2701",
			email: "demo@example.com",
			logo: null,
			universityLogo: null,
			facultyLogo: null,
		},
		demoMode,
		qrCodeImage: null,
		country: COUNTRY_DEFAULTS,
		ministry: MINISTRY_DEFAULTS,
		minister: MINISTER_DEFAULTS,
		university: { fr: "UNIVERSITÉ DE DEMO", en: "DEMO UNIVERSITY" },
		faculty: {
			fr: "FACULTE DE DEMONSTRATION",
			en: "FACULTY OF DEMONSTRATION",
		},
		institution: {
			nameFr: "INSTITUT UNIVERSITAIRE DE DEMO",
			nameEn: "DEMO UNIVERSITY INSTITUTE",
			abbreviation: "IUD",
			contactEmail: "contact@iud-demo.cm",
			postalBox: "15712",
			city: "Douala",
			logoUrl: null,
			watermarkLogoUrl: null,
			type: "institution" as const,
			isIPES: true,
			isFaculty: false,
			isUniversity: false,
		},
		// Sample tutelle chain (top-down) so the preview shows the dynamic
		// header iteration. Real generations populate this from the
		// `parent_institution_id` chain.
		tutelleChain: [
			{
				id: "demo-univ",
				type: "university" as const,
				nameFr: "UNIVERSITE DE DOUALA",
				nameEn: "UNIVERSITY OF DOUALA",
				shortName: "UDo",
				abbreviation: "UDO",
				postalBox: "2701",
				contactEmail: "contact@udo.cm",
				logoUrl: null,
			},
			{
				id: "demo-faculty",
				type: "faculty" as const,
				nameFr: "FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES",
				nameEn: "FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES",
				shortName: "FMSP",
				abbreviation: "FMSP",
				postalBox: "2701",
				contactEmail: "contact@fmsp-udo.cm",
				logoUrl: null,
			},
		],
		// Direct parent (= last entry of tutelleChain) used by IPES signatures.
		parentInstitution: {
			id: "demo-faculty",
			type: "faculty" as const,
			nameFr: "FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES",
			nameEn: "FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES",
			shortName: "FMSP",
			abbreviation: "FMSP",
			displaySigle: "FMSP",
		},
		// Sample center for previewing the `*-center.html` template variants.
		// Real generations populate this from the program's `centerId` chain;
		// the preview uses this stub so the editor shows admin instances, legal
		// texts and the center-only header even without a studentId/program.
		center: {
			id: "demo-center",
			code: "DEMO",
			name: "CENTRE DE FORMATION DE DÉMONSTRATION",
			nameEn: "DEMONSTRATION TRAINING CENTER",
			shortName: "DEMO-CTR",
			city: "Douala",
			country: "Cameroun",
			postalBox: "9293 Douala",
			contactEmail: "demo@center.cm",
			contactPhone: "+237 6XX XX XX XX",
			logoUrl: null,
			logoSvg: null,
			adminInstanceLogoUrl: null,
			adminInstanceLogoSvg: null,
			watermarkLogoUrl: null,
			watermarkLogoSvg: null,
			authorizationOrderFr:
				"Arrêté N° 160 /MINEFOP/SG/DFOP/SDGSF/SACD du 09 avril 2014",
			authorizationOrderEn:
				"Order No. 160 /MINEFOP/SG/DFOP/SDGSF/SACD of April 9, 2014",
			administrativeInstances: [
				{
					nameFr: "MINISTÈRE DE L'EMPLOI ET DE LA FORMATION PROFESSIONNELLE",
					nameEn: "MINISTRY OF EMPLOYMENT AND VOCATIONAL TRAINING",
					acronymFr: "MINEFOP",
					acronymEn: "MINEFOP",
					logoUrl: null,
					logoSvg: null,
					showOnTranscripts: true,
					showOnCertificates: true,
				},
				{
					nameFr: "Délégation Régionale du Littoral",
					nameEn: "Regional Delegation of the Coast",
					acronymFr: "DRL",
					acronymEn: "RDC",
					logoUrl: null,
					logoSvg: null,
					showOnTranscripts: true,
					showOnCertificates: true,
				},
			],
			legalTexts: [
				{
					textFr: "Vu la loi N°92/007 du 14 août 1992 portant code du travail",
					textEn:
						"Mindful of law N°92/007 of 14 august 1992 on the labour code",
				},
				{
					textFr:
						"Vu le décret n°79/201 du 28 mai 1979 portant organisation et fonctionnement des Centres de Formation Professionnelle Rapide",
					textEn:
						"Mindful of law N°79/201 of 28 may 1979 on the organization and functioning of intensive and vocational training",
				},
			],
		},
		logos: { faculty: null, ministry: null, coatOfArms: null },
		jury: {
			admissionDate: "13/10/2017",
			deliberationDate: "28/07/2024",
			number: "DEMO/001",
		},
		legalGrounds: [
			{
				fr: "Vu les textes en vigueur de l'établissement de démo",
				en: "Mindful of the regulations of the demo institution",
			},
		],
		signatures: [
			{ fr: "L'impétrant", en: "The Holder" },
			{ fr: "Le Recteur", en: "The Rector" },
			{
				fr: "Le Ministre d'Etat",
				en: "The Minister of State",
				minister: true,
			},
		],
		authority: { name: "Pr. DEMO", role: "Le Doyen" },
		watermarkRepeat: Array.from({ length: 24 }),
		showResults: kind === "attestation",
		student: {
			id: "demo",
			matricule: "DEMO-2024-001",
			fullName: "JANE DOE",
			firstName: "Jane",
			lastName: "Doe",
			birthDate: "27/01/2000",
			birthPlace: "YAOUNDE",
			mentionFr: "Très Bien",
			mentionEn: "Very Good",
			option: "Médecine Générale",
			optionEn: "General Medicine",
			// DIPLOMATION-shape uppercase keys.
			NOM: "DOE",
			PRENOM: "Jane",
			MATRICULE: "DEMO-2024-001",
			"DATE DE NAISSANCE": "27/01/2000",
			"LIEU DE NAISSANCE": "YAOUNDE",
			"ANNEE ACADEMIQUE": "2023/2024",
			"ANNEE ACADÉMIQUE": "2023/2024",
			CYCLE: "LICENCE",
			NIVEAU: "L3",
			FILIERE: "MÉDECINE",
			SEMESTRE: "S5",
			OPTION: "Médecine Générale",
			OPTION_EN: "General Medicine",
			MENTION: "Très Bien",
			MENTION_EN: "Very Good",
			GRADE: "B+",
			TOTAL_CREDITS: 60,
			MOYENNE: 14.75,
			DOMAINE: "Sciences de la santé",
			DOMAINE_EN: "Health sciences",
			PARCOURS: "MÉDECINE",
			PARCOURS_EN: "Medicine",
			SPECIALITE: "Médecine Générale",
			SPECIALITE_EN: "General Medicine",
			FINALITE: "Professionnelle",
			FINALITE_EN: "Professional",
		},
		program: { name: "MÉDECINE", level: "L3" },
		class: { name: "L3 MED A", code: "L3MEDA" },
		document: {
			titleFr: diplomaTitleFor(kind, "MÉDECINE").fr,
			titleEn: diplomaTitleFor(kind, "MÉDECINE").en,
			referenceNumber: buildReferenceNumber({
				institutionType: "institution",
				institutionSigle: "IUD",
				tutelleSigles: ["UDO", "FMSP"],
				year: new Date().getFullYear(),
			}),
			issueDate: formatDate(new Date()),
			academicYear: "2023/2024",
			yearObtention: "2024",
			year: new Date().getFullYear(),
			// student_list-specific
			title: "LISTE DES ÉTUDIANTS — L3 MED A — 2023/2024",
			subtitle: "Démonstration",
			generatedAt: formatDate(new Date()),
		},
		// student_list roster sample
		context: {
			class: "L3MEDA — L3 MED A",
			program: "MÉDECINE",
			academicYear: "2023/2024",
			cycleLevel: "L3",
		},
		students:
			kind === "student_list"
				? Array.from({ length: 5 }).map((_, i) => ({
						number: i + 1,
						registrationNumber: `DEMO-2024-${String(i + 1).padStart(3, "0")}`,
						lastName: ["DOE", "SMITH", "MARTIN", "BERNARD", "DUPONT"][i],
						firstName: ["Jane", "John", "Marie", "Paul", "Sophie"][i],
						gender: i % 2 === 0 ? "F" : "M",
						birthDate: "27/01/2000",
						birthPlace: "YAOUNDE",
						email: "demo@example.com",
						phone: "+237 600 000 000",
						className: "L3 MED A",
						programName: "MÉDECINE",
					}))
				: undefined,
		summary:
			kind === "student_list"
				? { total: 5, male: 2, female: 3 }
				: {
						generalAverage: 14.75,
						creditsEarned: 60,
						creditsTotal: 60,
						mention: "Bien",
						decision: "ADMIS",
						rank: 3,
						classSize: 60,
					},
		semesters: [
			{
				name: "Semestre 1",
				ues: [
					{
						code: "LSF 50",
						name: "PREPARATION PSYCHOPROPHYLACTIQUE A L'ACCOUCHEMENT",
						credits: 7,
						average: 13.47,
						decision: "Ac",
						courses: [
							{
								code: "PPA-1",
								name: "Préparation Psychoprophylactique à l'Accouchement 1",
								credits: 7,
								coefficient: 1,
								cc: 13,
								exam: 12.8,
								average: 12.8,
							},
							{
								code: "PPA-2",
								name: "Préparation Psychoprophylactique à l'Accouchement 2",
								credits: 7,
								coefficient: 1,
								cc: 13,
								exam: 12.8,
								average: 12.8,
							},
						],
					},
					{
						code: "LSF 51",
						name: "OBSTETRIQUE ET MEDECINE FŒTALE",
						credits: 7,
						average: 14.05,
						decision: "Ac",
						courses: [
							{
								code: "OBS",
								name: "Obstétrique Médecine",
								credits: 7,
								coefficient: 1,
								cc: 15,
								exam: 15.4,
								average: 15.4,
							},
							{
								code: "MFE",
								name: "Médecine Fœtale",
								credits: 7,
								coefficient: 1,
								cc: 12,
								exam: 12.2,
								average: 12.2,
							},
						],
					},
					{
						code: "LSF 52",
						name: "SANTE GENESIQUE DES FEMMES ET PHARMACOLOGIE OBSTETRICALE",
						credits: 6,
						average: 11.3,
						decision: "Ac",
						courses: [
							{
								code: "SGF",
								name: "Santé Génésique des Femmes",
								credits: 6,
								coefficient: 1,
								cc: 10,
								exam: 10.4,
								average: 10.4,
							},
							{
								code: "PHO",
								name: "Pharmacologie Obstétricale",
								credits: 6,
								coefficient: 1,
								cc: 12,
								exam: 12.4,
								average: 12.4,
							},
						],
					},
					{
						code: "LSF 53",
						name: "SOINS DE LA MATERNITE ET NEONATALE",
						credits: 5,
						average: 10.4,
						decision: "Ac",
						courses: [
							{
								code: "SDM",
								name: "Soins de la Maternité",
								credits: 5,
								coefficient: 1,
								cc: 10,
								exam: 10.4,
								average: 10.4,
							},
							{
								code: "SNN",
								name: "Soins Néonataux",
								credits: 5,
								coefficient: 1,
								cc: 11,
								exam: 11.0,
								average: 11.0,
							},
						],
					},
				],
			},
		],
	};
}

export async function listClassesAvailableForBatch(
	institutionId: string,
	classId: string,
) {
	return await repo.listStudentsByClass(institutionId, classId);
}
