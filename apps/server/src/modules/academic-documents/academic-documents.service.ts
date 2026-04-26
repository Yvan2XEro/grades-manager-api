import { TRPCError } from "@trpc/server";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";
import type {
	ExportTemplate,
	ExportTemplateType,
} from "../../db/schema/app-schema";
import * as expoTplRepo from "../export-templates/export-templates.repo";
import { loadTemplate } from "../exports/template-helper";
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
	Handlebars.registerHelper("formatNumber", (value: unknown, decimals = 2) => {
		if (value === null || value === undefined || value === "") return "—";
		const n = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(n)) return "—";
		return n.toFixed(decimals).replace(".", ",");
	});
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

function diplomaTitleFor(kind: DocumentKind, programName: string) {
	if (kind === "diploma") {
		return {
			fr: `DIPLÔME D'ÉTAT — ${programName.toUpperCase()}`,
			en: `STATE DIPLOMA — ${programName.toUpperCase()}`,
		};
	}
	if (kind === "transcript") {
		return {
			fr: "RELEVÉ DE NOTES OFFICIEL",
			en: "OFFICIAL ACADEMIC TRANSCRIPT",
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
}): Promise<DocumentRenderData> {
	const { kind, studentCtx, deliberation, theme, demoMode } = args;
	const { student, institution } = studentCtx;
	const cls = student.classRef;
	const program = cls?.program;
	const center = program?.center ?? null;
	const parent = institution?.parentInstitution ?? null;
	// Grandparent is loaded by loadStudentContext (institution → parent → parent).
	const grandparent =
		(parent as typeof parent & { parentInstitution?: typeof parent })
			?.parentInstitution ?? null;

	const fullName = `${student.profile.lastName ?? ""} ${
		student.profile.firstName ?? ""
	}`.trim();

	const titles = diplomaTitleFor(kind, program?.name ?? "");

	// Tutelle chain resolution. Two supported shapes:
	//   1) institut → faculté → université  (parent is a faculty, grandparent the university)
	//   2) institut → université             (parent is the university, no faculty)
	// When neither parent is a faculty we fall back to "no supervising faculty".
	const supervisingFaculty = parent?.type === "faculty" ? parent : null;
	const supervisingUniversity = supervisingFaculty
		? grandparent
		: parent?.type !== "faculty"
			? parent
			: null;
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
		referenceNumber: `${new Date().getFullYear()}/${institution?.abbreviation ?? "INS"}/${kind.toUpperCase()}/${student.registrationNumber}`,
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
	const watermarkLogo =
		center?.watermarkLogoUrl ?? institution?.logoUrl ?? null;

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
		universityLogo: parent?.logoUrl ?? null,
		facultyLogo: supervisingFaculty?.logoUrl ?? institution?.logoUrl ?? null,
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
			nameFr: institution?.nameFr ?? "",
			nameEn: institution?.nameEn ?? "",
			abbreviation: institution?.abbreviation ?? "",
			contactEmail: institution?.contactEmail ?? "",
			postalBox: institution?.postalBox ?? "",
			city: institution?.addressFr ?? "",
			addressFr: institution?.addressFr ?? "",
			addressEn: institution?.addressEn ?? "",
			watermarkLogoUrl: watermarkLogo,
		},
		logos: {
			institution: institution?.logoUrl ?? null,
			faculty: supervisingFaculty?.logoUrl ?? null,
			university: supervisingUniversity?.logoUrl ?? null,
			ministry: null as string | null,
			coatOfArms: null as string | null,
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
		await p.setContent(html, { waitUntil: "networkidle0" });
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
		with: { parentInstitution: true },
	});

	// Derive shared header strings (faculty / university / center).
	const parent = institution?.parentInstitution ?? null;
	const supervisingFaculty = parent?.type === "faculty" ? parent : null;
	const universityName = supervisingFaculty
		? null
		: (parent?.nameFr ?? institution?.nameFr);

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

	const sortedStudents = [...students].sort(
		(a, b) =>
			(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
			(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
	);

	const rows = sortedStudents.map((s, i) => ({
		number: i + 1,
		registrationNumber: s.registrationNumber,
		lastName: s.profile.lastName ?? "",
		firstName: s.profile.firstName ?? "",
		gender:
			s.profile.gender === "male"
				? "M"
				: s.profile.gender === "female"
					? "F"
					: "—",
		birthDate: s.profile.dateOfBirth ?? "—",
		birthPlace: s.profile.placeOfBirth ?? "—",
		email: s.profile.primaryEmail ?? "",
		phone: s.profile.phone ?? "",
		className: s.classRef?.name ?? "",
		programName: s.classRef?.program?.name ?? "",
	}));

	const summary = {
		total: rows.length,
		male: sortedStudents.filter((s) => s.profile.gender === "male").length,
		female: sortedStudents.filter((s) => s.profile.gender === "female").length,
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
			en: parent?.nameEn ?? institution?.nameEn ?? "",
		},
		faculty: {
			fr: supervisingFaculty?.nameFr ?? institution?.nameFr ?? "",
			en: supervisingFaculty?.nameEn ?? institution?.nameEn ?? "",
		},
		institution: {
			id: institution?.id,
			nameFr: institution?.nameFr ?? "",
			nameEn: institution?.nameEn ?? "",
			abbreviation: institution?.abbreviation ?? "",
			contactEmail: institution?.contactEmail ?? "",
			watermarkLogoUrl: institution?.logoUrl ?? null,
		},
		logos: {
			faculty: institution?.logoUrl ?? null,
			ministry: null as string | null,
			coatOfArms: null as string | null,
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
		: buildSampleRenderData(input.kind, input.demoMode);

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
			nameFr: "Établissement de démo",
			nameEn: "Demo institution",
			abbreviation: "DEMO",
			contactEmail: "demo@example.com",
			city: "Douala",
			watermarkLogoUrl: null,
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
			referenceNumber: `2024/DEMO/${kind.toUpperCase()}/0001`,
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
						code: "UE101",
						name: "Anatomie",
						credits: 6,
						average: 15.5,
						decision: "Ac",
						courses: [
							{
								code: "ANA101",
								name: "Anatomie générale",
								credits: 6,
								coefficient: 1,
								cc: 16,
								exam: 15,
								average: 15.5,
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
