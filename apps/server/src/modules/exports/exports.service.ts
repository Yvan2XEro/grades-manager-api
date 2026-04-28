import { and, eq, inArray } from "drizzle-orm";
import Handlebars from "handlebars";
import JSZip from "jszip";
import puppeteer from "puppeteer";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { loadTutelleChain } from "../academic-documents/academic-documents.repo";
import type { DiplomationExportData } from "../deliberations/deliberations.types";
import * as eligibility from "../export-eligibility/export-eligibility.service";
import { ExportsRepo } from "./exports.repo";
import type {
	BulkExportFilters,
	GenerateCourseCatalogInput,
	GenerateDeliberationInput,
	GenerateEcInput,
	GenerateEvaluationInput,
	GeneratePVInput,
	GenerateUEInput,
} from "./exports.zod";
import {
	calculateStats,
	calculateSuccessRate,
	type ExamWithRetake,
	formatNumber,
	getAppreciation,
	getObservation,
	loadExportConfig,
	loadTemplate,
	logoHelper,
	resolveStudentGradesWithRetakes,
} from "./template-helper";
import {
	loadExportTemplate,
	loadFirstCenterForInstitution,
	type TemplateConfiguration,
} from "./template-loader";

const COURSE_CATALOG_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 10mm 12mm 10mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 9px; color: #222; background: #fff; }
  .page-title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 2mm; letter-spacing: 0.5px; }
  .page-subtitle { text-align: center; font-size: 9px; color: #666; margin-bottom: 6mm; }
  .classes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  .class-block { border: 1px solid #ccc; border-radius: 3px; overflow: hidden; page-break-inside: avoid; margin-bottom: 0; }
  .class-header { background: #2c3e50; color: #fff; padding: 2.5mm 3mm; font-size: 10px; font-weight: bold; }
  .class-header span { font-size: 8px; font-weight: normal; opacity: 0.75; margin-left: 4px; }
  .ue-block { border-top: 1px solid #e0e0e0; }
  .ue-header { background: #ecf0f1; padding: 1.5mm 3mm; font-size: 8.5px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; color: #2c3e50; }
  .ue-meta { font-size: 7.5px; color: #888; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f7f9fa; }
  th { text-align: left; padding: 1.2mm 3mm; font-size: 7.5px; font-weight: 600; color: #555; border-bottom: 1px solid #e0e0e0; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 1.2mm 3mm; font-size: 8px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .coef { text-align: center; width: 18mm; }
  .code { color: #888; font-size: 7.5px; white-space: nowrap; }
  .teacher { color: #555; }
</style>
</head>
<body>
  <div class="page-title">Catalogue des Enseignements</div>
  <div class="page-subtitle">Généré le {{generatedDate}} &nbsp;·&nbsp; {{totalClasses}} classe(s)</div>
  <div class="classes-grid">
    {{#each classes}}
    <div class="class-block">
      <div class="class-header">{{name}} <span>{{code}}</span></div>
      {{#each ues}}
      <div class="ue-block">
        <div class="ue-header">
          <span>{{code}} — {{name}}</span>
          <span class="ue-meta">{{semester}} · {{credits}} crédits</span>
        </div>
        <table>
          <thead><tr>
            <th>Code</th><th>Intitulé EC</th><th class="coef">Coef.</th><th>Enseignant</th>
          </tr></thead>
          <tbody>
            {{#each courses}}
            <tr>
              <td class="code">{{code}}</td>
              <td>{{name}}</td>
              <td class="coef">{{coefficient}}</td>
              <td class="teacher">{{teacher}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
      {{/each}}
    </div>
    {{/each}}
  </div>
</body>
</html>`;

/** Bilingual tutelle header context shared by every PV/EC/UE/deliberation
 * template. Mirrors the shape consumed by the modern transcript / attestation
 * templates so the same Handlebars `{{country.fr}}…{{logos.faculty}}` partials
 * work everywhere. */
type HeaderContext = {
	country: { fr: string; en: string; mottoFr: string; mottoEn: string };
	ministry: { fr: string; en: string };
	university: { fr: string; en: string };
	faculty: { fr: string; en: string; postalBox: string; contactEmail: string };
	institutionHeader: {
		id: string | undefined;
		nameFr: string;
		nameEn: string;
		abbreviation: string;
		contactEmail: string;
		postalBox: string;
		addressFr: string;
		addressEn: string;
		watermarkLogoUrl: string | null;
		watermarkLogoSvg: string | null;
	};
	logos: {
		institution: string | null;
		institutionSvg: string | null;
		faculty: string | null;
		facultySvg: string | null;
		university: string | null;
		universitySvg: string | null;
		ministry: string | null;
		ministrySvg: string | null;
	};
};

/**
 * Strip filesystem-unsafe characters from a filename and collapse runs of
 * underscores. Keeps letters/digits/hyphens/underscores/dots, replaces the
 * rest with `_`, and trims trailing underscores.
 */
function sanitizeFilename(name: string): string {
	return name
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "") // strip combining diacritics
		.replace(/[^A-Za-z0-9._-]+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "");
}

/**
 * Sample center used when previewing `*-center.html` templates without a
 * real student/program. Mirrors the shape returned by `loadCenterByClass` so
 * the preview can exercise admin instances, legal texts and the authorization
 * order block.
 */
function buildSampleCenter() {
	return {
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
		logoUrl: null as string | null,
		logoSvg: null as string | null,
		adminInstanceLogoUrl: null as string | null,
		adminInstanceLogoSvg: null as string | null,
		watermarkLogoUrl: null as string | null,
		watermarkLogoSvg: null as string | null,
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
				logoUrl: null as string | null,
				logoSvg: null as string | null,
				showOnTranscripts: true,
				showOnCertificates: true,
			},
			{
				nameFr: "Délégation Régionale du Littoral",
				nameEn: "Regional Delegation of the Coast",
				acronymFr: "DRL",
				acronymEn: "RDC",
				logoUrl: null as string | null,
				logoSvg: null as string | null,
				showOnTranscripts: true,
				showOnCertificates: true,
			},
		],
		legalTexts: [
			{
				textFr: "Vu la loi N°92/007 du 14 août 1992 portant code du travail",
				textEn: "Mindful of law N°92/007 of 14 august 1992 on the labour code",
			},
			{
				textFr:
					"Vu le décret n°79/201 du 28 mai 1979 portant organisation et fonctionnement des Centres de Formation Professionnelle Rapide",
				textEn:
					"Mindful of law N°79/201 of 28 may 1979 on the organization and functioning of intensive and vocational training",
			},
		],
	};
}

/**
 * Service for generating grade exports (PDFs and HTML previews)
 */
export class ExportsService {
	private repo: ExportsRepo;
	private config: ReturnType<typeof loadExportConfig> = loadExportConfig();

	constructor(private readonly institutionId: string) {
		this.repo = new ExportsRepo(this.institutionId);

		// Register Handlebars helpers
		this.registerHelpers();
	}

	/**
	 * Get export config from institution or fallback to JSON file
	 */
	private async getConfig(): Promise<ReturnType<typeof loadExportConfig>> {
		try {
			// Try to load from institution
			const institution = await this.repo.getInstitution();
			const { institutionToExportConfig } = await import("./template-helper");
			this.config = institutionToExportConfig(institution);
			return this.config;
		} catch (error) {
			// Fallback to JSON file
			console.warn(
				"Failed to load institution config, falling back to JSON file:",
				error,
			);
			this.config = loadExportConfig();
			return this.config;
		}
	}

	/**
	 * Register custom Handlebars helpers
	 */
	private registerHelpers() {
		Handlebars.registerHelper("formatNumber", formatNumber);
		Handlebars.registerHelper("getAppreciation", (score: number) =>
			getAppreciation(score, this.config),
		);
		Handlebars.registerHelper("getObservation", (score: number | null) =>
			getObservation(score, this.config),
		);
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
		Handlebars.registerHelper("or", (...args: unknown[]) =>
			args.slice(0, -1).some((v) => Boolean(v)),
		);
		Handlebars.registerHelper("logo", logoHelper);
	}

	/** Return the parent class_course of an exam (for eligibility checks) */
	async getExamClassCourse(
		examId: string,
	): Promise<{ classCourseId: string } | null> {
		const meta = await this.repo.getExamMeta(examId);
		return meta;
	}

	/** Return structured PV data (JSON) for frontend Excel export */
	async getPVDataStructured(
		input: Omit<GeneratePVInput, "format" | "templateId">,
	) {
		const config = await this.getConfig();
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"pv",
			undefined,
			{ classId: input.classId },
		);

		const data = await this.repo.getPVData(
			input.classId,
			input.semesterId,
			input.academicYearId,
		);

		const includeRetakes = input.includeRetakes ?? true;
		return this.processPVData(data, config, templateConfig, includeRetakes);
	}

	/** Generate PV (official minutes) export */
	async generatePV(input: GeneratePVInput) {
		const config = await this.getConfig();

		// Resolves program-default template + center branding via classId
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"pv",
			input.templateId,
			{ classId: input.classId },
		);

		const data = await this.repo.getPVData(
			input.classId,
			input.semesterId,
			input.academicYearId,
		);

		// Process data for template with template configuration
		// includeRetakes defaults to true if not specified
		const includeRetakes = input.includeRetakes ?? true;
		const templateData = this.processPVData(
			data,
			config,
			templateConfig,
			includeRetakes,
		);

		// Generate HTML
		const html = await this.renderTemplate("pv", templateData, templateConfig);

		// Filename: PV_<classCode>_<semester>_<YYYYMMDD>.<ext>
		const today = new Date().toISOString().split("T")[0];
		const dataAny = data as {
			code?: string;
			academicYear?: { name?: string };
			semester?: { name?: string };
		};
		const suggestedFilename = sanitizeFilename(
			[
				"PV",
				dataAny.code,
				dataAny.semester?.name,
				dataAny.academicYear?.name,
				today,
			]
				.filter(Boolean)
				.join("_") + (input.format === "html" ? ".html" : ".pdf"),
		);

		// Return HTML or PDF based on format
		if (input.format === "html") {
			return {
				content: html,
				mimeType: "text/html",
				filename: suggestedFilename,
			};
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		// Convert to Buffer if it isn't already (Bun's Puppeteer returns Uint8Array)
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
			filename: suggestedFilename,
		};
	}

	/**
	 * Generate evaluation publication export
	 */
	async generateEvaluation(input: GenerateEvaluationInput) {
		const config = await this.getConfig();

		// Resolve classId so we pick up the program's default evaluation template
		const classId = await this.repo.getClassIdForExam(input.examId);

		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"evaluation",
			input.templateId,
			{ classId: classId ?? undefined },
		);

		const data = await this.repo.getEvaluationData(input.examId);

		// Process data for template with template configuration
		const templateData = this.processEvaluationData(
			data,
			config,
			templateConfig,
			input.observations,
		);

		// Build a meaningful filename from the metadata we already loaded:
		//   Eval_<classCode>_<ECcode>_<TYPE>_<YYYYMMDD>.<ext>
		// e.g. Eval_TLB-S2_TLB235-EC1_CC_2025-12-15.pdf
		const examDateRaw = data.date as string | Date | null;
		const examDate = examDateRaw
			? new Date(examDateRaw).toISOString().split("T")[0]
			: new Date().toISOString().split("T")[0];
		const suggestedFilename = sanitizeFilename(
			[
				"Eval",
				data.classCourseRef.classRef?.code,
				data.classCourseRef.courseRef?.code,
				(data.type ?? "").toUpperCase(),
				examDate,
			]
				.filter(Boolean)
				.join("_") + (input.format === "html" ? ".html" : ".pdf"),
		);

		// Generate HTML
		const html = await this.renderTemplate(
			"evaluation",
			templateData,
			templateConfig,
		);

		// Return HTML or PDF based on format
		if (input.format === "html") {
			return {
				content: html,
				mimeType: "text/html",
				filename: suggestedFilename,
			};
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		// Convert to Buffer if it isn't already (Bun's Puppeteer returns Uint8Array)
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
			filename: suggestedFilename,
		};
	}

	/**
	 * Generate UE (Teaching Unit) publication export
	 */
	async generateUE(input: GenerateUEInput) {
		const config = await this.getConfig();

		// Resolves program-default template + center branding via classId
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"ue",
			input.templateId,
			{ classId: input.classId },
		);

		const data = await this.repo.getUEData(
			input.teachingUnitId,
			input.classId,
			input.semesterId,
			input.academicYearId,
		);

		// Process data for template with template configuration
		// includeRetakes defaults to true if not specified
		const includeRetakes = input.includeRetakes ?? true;
		const templateData = this.processUEData(
			data,
			config,
			templateConfig,
			includeRetakes,
		);

		// Generate HTML
		const html = await this.renderTemplate("ue", templateData, templateConfig);

		// Filename: UE_<classCode>_<UEcode>_<YYYYMMDD>.<ext>
		const today = new Date().toISOString().split("T")[0];
		const ueDataAny = data as {
			teachingUnit?: { code?: string; name?: string };
			classCourses?: Array<{ classRef?: { code?: string } }>;
		};
		const classCode =
			ueDataAny.classCourses?.[0]?.classRef?.code ?? input.classId.slice(0, 8);
		const suggestedFilename = sanitizeFilename(
			["UE", classCode, ueDataAny.teachingUnit?.code, today]
				.filter(Boolean)
				.join("_") + (input.format === "html" ? ".html" : ".pdf"),
		);

		// Return HTML or PDF based on format
		if (input.format === "html") {
			return {
				content: html,
				mimeType: "text/html",
				filename: suggestedFilename,
			};
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		// Convert to Buffer if it isn't already (Bun's Puppeteer returns Uint8Array)
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
			filename: suggestedFilename,
		};
	}

	/**
	 * Generate EC (class_course) publication export — one PDF per Élément
	 * Constitutif. Aggregates ALL evaluations of the EC (CC + TP + Examen ...)
	 * into a single table with one row per student + their final EC average,
	 * decision and credits. Eligibility (sum of percentages = 100%) is checked
	 * upstream in the router.
	 */
	async generateEc(input: GenerateEcInput) {
		const config = await this.getConfig();

		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"ec",
			input.templateId,
			{ classId: input.classId },
		);

		const data = await this.repo.getEcData(input.classCourseId, input.classId);
		const includeRetakes = input.includeRetakes ?? true;
		const templateData = this.processEcData(data, config, includeRetakes);

		const html = await this.renderTemplate("ec", templateData, templateConfig);

		// Filename: EC_<classCode>_<ECcode>_<YYYYMMDD>.<ext>
		const today = new Date().toISOString().split("T")[0];
		const cls = data.classCourse.classRef;
		const course = data.classCourse.courseRef;
		const suggestedFilename = sanitizeFilename(
			["EC", cls?.code, course?.code, today].filter(Boolean).join("_") +
				(input.format === "html" ? ".html" : ".pdf"),
		);

		if (input.format === "html") {
			return {
				content: html,
				mimeType: "text/html",
				filename: suggestedFilename,
			};
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
			filename: suggestedFilename,
		};
	}

	/**
	 * Run a function with a shared Puppeteer browser, exposing a `renderPdf`
	 * helper that produces a PDF buffer per HTML+styleConfig pair. Reusing
	 * one browser across hundreds of PDFs is ~50× faster than relaunching
	 * Chromium for each one. The browser is always closed in the finally.
	 */
	private async withSharedBrowser<T>(
		fn: (
			renderPdf: (
				html: string,
				styleConfig: TemplateConfiguration["styleConfig"],
			) => Promise<Buffer>,
		) => Promise<T>,
	): Promise<T> {
		const browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
			// Bump Puppeteer's CDP protocolTimeout — large data-URI logos can
			// take >30s to decode in headless Chrome under load (the default
			// 30s timeout fires "Runtime.callFunctionOn timed out" mid-batch).
			protocolTimeout: 180_000,
		});
		try {
			const renderPdf = async (
				html: string,
				styleConfig: TemplateConfiguration["styleConfig"],
			): Promise<Buffer> => {
				const page = await browser.newPage();
				page.setDefaultTimeout(60_000);
				try {
					// Force print media so the layout/raster work is done once,
					// for the print pipeline directly (avoids "screen-then-print"
					// re-decode that can drop a logo).
					await page.emulateMediaType("print");
					await page.setContent(html, { waitUntil: ["load", "networkidle0"] });
					// Robust image readiness — see generatePDF for details.
					await Promise.race([
						page.evaluate(async () => {
							const tryDecode = async (img: HTMLImageElement) => {
								try {
									await img.decode();
								} catch {
									try {
										await img.decode();
									} catch {
										/* keep printing */
									}
								}
							};
							const imgs = Array.from(document.images);
							await Promise.all(imgs.map((img) => tryDecode(img)));
							const start = Date.now();
							while (
								Date.now() - start < 8000 &&
								imgs.some(
									(img) =>
										!img.complete ||
										(img.naturalHeight === 0 && img.naturalWidth === 0),
								)
							) {
								await new Promise((r) => setTimeout(r, 100));
							}
						}),
						new Promise<void>((resolve) => setTimeout(resolve, 25000)),
					]);
					const baseBottomMm = styleConfig.margins?.bottom ?? 10;
					const bottomWithFooter = Math.max(baseBottomMm, 18);
					const footerTemplate = `
						<div style="font-size:8px; width:100%; text-align:center; color:#888; padding: 0 8mm; font-family: Arial, sans-serif;">
							Page <span class="pageNumber"></span> / <span class="totalPages"></span>
						</div>
					`;
					const pdf = await page.pdf({
						format: styleConfig.pageSize || "A4",
						landscape: styleConfig.pageOrientation === "landscape",
						printBackground: true,
						displayHeaderFooter: true,
						headerTemplate: "<div></div>",
						footerTemplate,
						margin: {
							top: `${styleConfig.margins?.top || 10}mm`,
							right: `${styleConfig.margins?.right || 10}mm`,
							bottom: `${bottomWithFooter}mm`,
							left: `${styleConfig.margins?.left || 10}mm`,
						},
					});
					return Buffer.from(pdf);
				} finally {
					await page.close();
				}
			};
			return await fn(renderPdf);
		} finally {
			await browser.close();
		}
	}

	/**
	 * Bulk-export every EVALUATION matching the scope filters. Per-évaluation
	 * exports are NOT gated on EC eligibility (single CC/TP/Examen results
	 * publish independently of the EC being complete). Each PDF lands in
	 * `Évaluations/<programCode>/<classCode>/<filename>.pdf` inside the ZIP.
	 * Returns a base64 ZIP + per-item success/failure counters.
	 */
	async bulkExportEvaluations(filters: BulkExportFilters) {
		const config = await this.getConfig();
		const examIds = await this.repo.listExamIdsForBulk(filters);
		const zip = new JSZip();
		const skipped: Array<{ id: string; reason: string }> = [];
		let succeeded = 0;

		await this.withSharedBrowser(async (renderPdf) => {
			for (const examId of examIds) {
				try {
					const data = await this.repo.getEvaluationData(examId);
					if (!data) {
						skipped.push({ id: examId, reason: "evaluation data not found" });
						continue;
					}
					const classId = data.classCourseRef.classRef.id;
					const templateConfig = await loadExportTemplate(
						this.institutionId,
						"evaluation",
						undefined,
						{ classId },
					);
					const templateData = this.processEvaluationData(
						data,
						config,
						templateConfig,
					);
					const html = await this.renderTemplate(
						"evaluation",
						templateData,
						templateConfig,
					);
					const pdf = await renderPdf(html, templateConfig.styleConfig);

					const examDate = data.date
						? new Date(data.date as unknown as string)
								.toISOString()
								.split("T")[0]
						: "no-date";
					const programCode =
						data.classCourseRef.classRef.program?.code ?? "no-program";
					const classCode = data.classCourseRef.classRef?.code ?? "no-class";
					const courseCode = data.classCourseRef.courseRef?.code ?? "no-course";
					const filename = sanitizeFilename(
						`Eval_${classCode}_${courseCode}_${(data.type ?? "").toUpperCase()}_${examDate}.pdf`,
					);
					const folder = sanitizeFilename(
						`Evaluations/${programCode}/${classCode}`,
					).replace(/_+/g, "_");
					zip.file(`${folder}/${filename}`, pdf);
					succeeded++;
				} catch (err) {
					skipped.push({
						id: examId,
						reason: err instanceof Error ? err.message : String(err),
					});
				}
			}
		});

		const buf = await zip.generateAsync({ type: "uint8array" });
		const today = new Date().toISOString().split("T")[0];
		return {
			content: Buffer.from(buf).toString("base64"),
			mimeType: "application/zip",
			filename: `Evaluations_bulk_${today}.zip`,
			total: examIds.length,
			succeeded,
			skipped,
		};
	}

	/**
	 * Bulk-export every EC (class_course). Eligibility (sum of percentages
	 * = 100%) IS enforced — non-eligible ECs are skipped (or fail-fast based
	 * on `skipIneligible`). Each PDF lands in
	 * `ECs/<programCode>/<classCode>/<filename>.pdf`.
	 */
	async bulkExportEcs(filters: BulkExportFilters) {
		const config = await this.getConfig();
		const candidates = await this.repo.listClassCoursesForBulk(filters);
		const zip = new JSZip();
		const skipped: Array<{ id: string; reason: string }> = [];
		let succeeded = 0;

		await this.withSharedBrowser(async (renderPdf) => {
			for (const cc of candidates) {
				try {
					// Eligibility gate.
					const ec = await eligibility.checkEcEligibility(
						cc.id,
						this.institutionId,
					);
					if (!ec.eligible) {
						if (filters.skipIneligible) {
							skipped.push({
								id: cc.id,
								reason: ec.reason ?? "EC not eligible",
							});
							continue;
						}
						throw new Error(ec.reason ?? "EC not eligible");
					}

					const data = await this.repo.getEcData(cc.id, cc.classId);
					const templateConfig = await loadExportTemplate(
						this.institutionId,
						"ec",
						undefined,
						{ classId: cc.classId },
					);
					const templateData = this.processEcData(data, config);
					const html = await this.renderTemplate(
						"ec",
						templateData,
						templateConfig,
					);
					const pdf = await renderPdf(html, templateConfig.styleConfig);

					const today = new Date().toISOString().split("T")[0];
					const cls = data.classCourse.classRef;
					const course = data.classCourse.courseRef;
					const programCode = cls?.program?.code ?? "no-program";
					const classCode = cls?.code ?? "no-class";
					const courseCode = course?.code ?? "no-course";
					const filename = sanitizeFilename(
						`EC_${classCode}_${courseCode}_${today}.pdf`,
					);
					const folder = sanitizeFilename(
						`ECs/${programCode}/${classCode}`,
					).replace(/_+/g, "_");
					zip.file(`${folder}/${filename}`, pdf);
					succeeded++;
				} catch (err) {
					skipped.push({
						id: cc.id,
						reason: err instanceof Error ? err.message : String(err),
					});
				}
			}
		});

		const buf = await zip.generateAsync({ type: "uint8array" });
		const today = new Date().toISOString().split("T")[0];
		return {
			content: Buffer.from(buf).toString("base64"),
			mimeType: "application/zip",
			filename: `ECs_bulk_${today}.zip`,
			total: candidates.length,
			succeeded,
			skipped,
		};
	}

	/**
	 * Bulk-export every UE (per (UE × class × semester)). Eligibility on
	 * the WHOLE UE (every EC inside at 100%) is enforced — non-eligible UEs
	 * are skipped. Each PDF lands in
	 * `UEs/<programCode>/<classCode>/<filename>.pdf`.
	 */
	async bulkExportUes(filters: BulkExportFilters) {
		const config = await this.getConfig();
		const tuples = await this.repo.listUeTuplesForBulk(filters);
		const zip = new JSZip();
		const skipped: Array<{ id: string; reason: string }> = [];
		let succeeded = 0;

		await this.withSharedBrowser(async (renderPdf) => {
			for (const t of tuples) {
				const key = `${t.teachingUnitId}/${t.classId}/${t.semesterId}`;
				try {
					const ue = await eligibility.checkUeEligibility({
						teachingUnitId: t.teachingUnitId,
						classId: t.classId,
						semesterId: t.semesterId,
						institutionId: this.institutionId,
					});
					if (!ue.eligible) {
						if (filters.skipIneligible) {
							skipped.push({
								id: key,
								reason: ue.reason ?? "UE not eligible",
							});
							continue;
						}
						throw new Error(ue.reason ?? "UE not eligible");
					}

					const data = await this.repo.getUEData(
						t.teachingUnitId,
						t.classId,
						t.semesterId,
						t.academicYearId,
					);
					const templateConfig = await loadExportTemplate(
						this.institutionId,
						"ue",
						undefined,
						{ classId: t.classId },
					);
					const templateData = this.processUEData(data, config, templateConfig);
					const html = await this.renderTemplate(
						"ue",
						templateData,
						templateConfig,
					);
					const pdf = await renderPdf(html, templateConfig.styleConfig);

					const today = new Date().toISOString().split("T")[0];
					const programCode =
						(data.teachingUnit as { program?: { code?: string } } | undefined)
							?.program?.code ?? "no-program";
					const classCode =
						(data.classCourses as Array<{ classRef?: { code?: string } }>)?.[0]
							?.classRef?.code ?? "no-class";
					const ueCode = data.teachingUnit?.code ?? "no-ue";
					const filename = sanitizeFilename(
						`UE_${classCode}_${ueCode}_${today}.pdf`,
					);
					const folder = sanitizeFilename(
						`UEs/${programCode}/${classCode}`,
					).replace(/_+/g, "_");
					zip.file(`${folder}/${filename}`, pdf);
					succeeded++;
				} catch (err) {
					skipped.push({
						id: key,
						reason: err instanceof Error ? err.message : String(err),
					});
				}
			}
		});

		const buf = await zip.generateAsync({ type: "uint8array" });
		const today = new Date().toISOString().split("T")[0];
		return {
			content: Buffer.from(buf).toString("base64"),
			mimeType: "application/zip",
			filename: `UEs_bulk_${today}.zip`,
			total: tuples.length,
			succeeded,
			skipped,
		};
	}

	/**
	 * Build the template-ready payload for an EC publication.
	 *  - For each student: one column per normal-session exam (chronological)
	 *    carrying the raw score, then the weighted EC average, decision and
	 *    credits (granted on pass, 0 otherwise).
	 *  - Bottom row aggregates the global EC success rate + class average.
	 *  - Retake exams are excluded from the per-cell view; if you need a
	 *    retake-aware projection use `processUEData`.
	 */
	private processEcData(
		data: Awaited<ReturnType<ExportsRepo["getEcData"]>>,
		config: ReturnType<typeof loadExportConfig>,
		_includeRetakes = true,
	) {
		const { classCourse, students } = data;
		const cls = classCourse.classRef;
		const course = classCourse.courseRef;
		const teachingUnit = course?.teachingUnit ?? null;
		const passingGrade = config.grading.passing_grade;

		// Normal-session exams of this class_course, ordered by date asc so the
		// CC/TP/Examen sequence on the PDF matches chronological scheduling.
		const normalExams = (classCourse.exams ?? [])
			.filter((e) => (e.sessionType ?? "normal") === "normal")
			.sort((a, b) => {
				const da = new Date(a.date as unknown as string).getTime();
				const db = new Date(b.date as unknown as string).getTime();
				return da - db;
			});

		// Header descriptors (one per exam column on the PDF).
		const examDescriptors = normalExams.map((e) => ({
			id: e.id,
			label: e.name || e.type,
			type: e.type,
			percentage: Number(e.percentage),
			maxScore: 20,
		}));

		// Index grades by (examId → studentId → score) for O(1) lookup.
		const gradeIndex = new Map<string, Map<string, number>>();
		for (const exam of normalExams) {
			const inner = new Map<string, number>();
			for (const g of exam.grades ?? []) {
				const sid = g.studentRef?.id ?? g.student;
				if (sid && g.score !== null && g.score !== undefined) {
					inner.set(sid, Number(g.score));
				}
			}
			gradeIndex.set(exam.id, inner);
		}

		const sortedStudents = [...students].sort(
			(a, b) =>
				(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
				(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
		);

		const studentRows = sortedStudents.map((student, index) => {
			const examGrades = examDescriptors.map((ed) => {
				const score = gradeIndex.get(ed.id)?.get(student.id) ?? null;
				return { examId: ed.id, score };
			});

			const allHaveScores = examGrades.every((g) => g.score !== null);
			let average: number | null = null;
			if (allHaveScores && examGrades.length > 0) {
				// Weighted average: Σ(score × percentage) / 100. Assumes the EC
				// percentages already sum to 100 — enforced by the eligibility
				// check at the router level.
				const sum = examGrades.reduce((acc, g, i) => {
					return acc + (g.score as number) * examDescriptors[i].percentage;
				}, 0);
				average = sum / 100;
			}

			const isPassed = average !== null && average >= passingGrade;
			let decision: string;
			if (!allHaveScores) decision = "Inc";
			else if (isPassed) decision = "Ac";
			else decision = "Nac";

			// Credits for this EC are inherited from the parent UE — courses
			// don't carry their own credit count in the schema.
			const ecCredits = Number(teachingUnit?.credits ?? 0);

			return {
				number: index + 1,
				lastName: student.profile.lastName,
				firstName: student.profile.firstName,
				registrationNumber: student.registrationNumber,
				examGrades,
				average,
				decision,
				credits: isPassed ? ecCredits : 0,
				isComplete: allHaveScores,
			};
		});

		const finalScores = studentRows
			.map((r) => r.average)
			.filter((s): s is number => s !== null);
		const stats = calculateStats(finalScores);
		const globalSuccessRate = calculateSuccessRate(finalScores, passingGrade);

		return {
			program: {
				name: cls?.program?.name ?? "",
				level: cls?.cycleLevel?.name ?? "",
			},
			semester: cls?.semester?.name ?? "",
			academicYear: cls?.academicYear?.name ?? "",
			classCode: cls?.code ?? "",
			className: cls?.name ?? "",
			classCourse: {
				code: course?.code ?? "",
				name: course?.name ?? "",
				courseCode: course?.code ?? "",
				courseName: course?.name ?? "",
				credits: Number(teachingUnit?.credits ?? 0),
				coefficient: Number(classCourse.coefficient ?? 1),
			},
			teachingUnit: teachingUnit
				? {
						code: teachingUnit.code,
						name: teachingUnit.name,
						credits: Number(teachingUnit.credits ?? 0),
					}
				: null,
			exams: examDescriptors,
			students: studentRows,
			globalAverage: stats.average,
			globalSuccessRate,
			signatures: config.signatures.evaluation,
		};
	}

	/** Generate deliberation export (PDF or HTML) */
	async generateDeliberation(
		input: GenerateDeliberationInput,
		diplomationData: DiplomationExportData,
	) {
		const config = await this.getConfig();
		const classId = await this.repo.getClassIdForDeliberation(
			input.deliberationId,
		);
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"deliberation",
			input.templateId,
			{ classId: classId ?? undefined },
		);

		const templateData = this.processDeliberationData(
			diplomationData,
			config,
			templateConfig,
		);

		const html = await this.renderTemplate(
			"deliberation",
			templateData,
			templateConfig,
		);

		if (input.format === "html") {
			return { content: html, mimeType: "text/html" };
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
		};
	}

	/** Return structured deliberation data for frontend Excel export */
	async getDeliberationDataStructured(
		diplomationData: DiplomationExportData,
		deliberationId?: string,
	) {
		const config = await this.getConfig();
		const classId = deliberationId
			? await this.repo.getClassIdForDeliberation(deliberationId)
			: null;
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"deliberation",
			undefined,
			{ classId: classId ?? undefined },
		);
		return this.processDeliberationData(
			diplomationData,
			config,
			templateConfig,
		);
	}

	/** Process DiplomationExportData into template-ready format */
	private processDeliberationData(
		data: DiplomationExportData,
		config: ReturnType<typeof loadExportConfig>,
		_templateConfig: TemplateConfiguration,
	) {
		const decisionLabels: Record<string, string> = {
			admitted: "Admis en cl. supérieure",
			compensated: "Admis par compensation",
			deferred: "Ajourné",
			repeat: "Redoublant",
			excluded: "Exclu",
			pending: "En attente",
		};

		const mentionLabels: Record<string, string> = {
			excellent: "Excellent",
			tres_bien: "Très Bien",
			bien: "Bien",
			assez_bien: "Assez Bien",
			passable: "Passable",
		};

		// Collect unique UEs across all students
		const ueMap = new Map<
			string,
			{ id: string; code: string; name: string; credits: number }
		>();
		for (const student of data.students) {
			for (const ue of student.ueResults) {
				if (!ueMap.has(ue.ueId)) {
					ueMap.set(ue.ueId, {
						id: ue.ueId,
						code: ue.ueCode,
						name: ue.ueName,
						credits: ue.ueCredits,
					});
				}
			}
		}
		const ues = Array.from(ueMap.values());

		// Sort students alphabetically by last name, then first name
		const sortedStudents = [...data.students].sort(
			(a, b) =>
				(a.lastName ?? "").localeCompare(b.lastName ?? "") ||
				(a.firstName ?? "").localeCompare(b.firstName ?? ""),
		);

		// Enrich students with labels and ensure UE order matches
		const students = sortedStudents.map((s) => {
			// Build ueResults in same order as ues array
			const orderedUeResults = ues.map((ue) => {
				const found = s.ueResults.find((r) => r.ueId === ue.id);
				return (
					found ?? {
						ueId: ue.id,
						ueCode: ue.code,
						ueName: ue.name,
						ueCredits: ue.credits,
						ueAverage: null,
						isValidated: false,
						isComplete: false,
						decision: "INC" as const,
						creditsEarned: 0,
						courseResults: [],
					}
				);
			});

			return {
				...s,
				ueResults: orderedUeResults,
				finalDecisionLabel:
					decisionLabels[s.finalDecision ?? "pending"] ?? s.finalDecision,
				mentionLabel: s.mention ? (mentionLabels[s.mention] ?? s.mention) : "",
			};
		});

		return {
			...config.institution,
			deliberation: data.deliberation,
			jury: data.jury,
			ues,
			students,
			stats: data.stats ?? {
				totalStudents: students.length,
				admittedCount: 0,
				compensatedCount: 0,
				deferredCount: 0,
				repeatCount: 0,
				excludedCount: 0,
				pendingCount: students.length,
				classAverage: null,
				successRate: 0,
				highestAverage: null,
				lowestAverage: null,
			},
			signatures: data.signatures.length
				? data.signatures
				: config.signatures.pv,
			watermark: config.watermark,
		};
	}

	async previewTemplate(input: {
		type:
			| "pv"
			| "evaluation"
			| "ec"
			| "ue"
			| "deliberation"
			| "diploma"
			| "transcript"
			| "attestation"
			| "student_list";
		templateBody: string;
	}) {
		// Diploma / transcript / attestation / student_list have their own data
		// shape and theme pipeline — delegate to the academic-documents service
		// which knows how to render them with sample data.
		if (
			input.type === "diploma" ||
			input.type === "transcript" ||
			input.type === "attestation" ||
			input.type === "student_list"
		) {
			const academic = await import(
				"../academic-documents/academic-documents.service"
			);
			return await academic.previewTemplateBody(this.institutionId, {
				kind: input.type,
				templateBody: input.templateBody,
				demoMode: true,
			});
		}

		const config = await this.getConfig();
		const baseConfig = await loadExportTemplate(this.institutionId, input.type);
		// Use the institution's real first active center so the editor preview
		// reflects the actual data the user will see in production. Falls back
		// to a stub center when the institution has none configured yet.
		const realCenter = await loadFirstCenterForInstitution(this.institutionId);
		const templateConfig: TemplateConfiguration & { center?: unknown } = {
			templateBody: input.templateBody,
			headerConfig: baseConfig.headerConfig,
			styleConfig: baseConfig.styleConfig,
			center: realCenter ?? buildSampleCenter(),
		};
		const sampleData = this.getSampleData(input.type, config);
		return await this.renderTemplate(input.type, sampleData, templateConfig);
	}

	/**
	 * Render a sample PDF for every (kind × variant) bundled template, using
	 * REAL institution + center data and a fictitious student. Bundled into a
	 * single ZIP and returned as a base64 string for tRPC transport.
	 *
	 * Used by the admin "Télécharger tous les modèles" button — same logic as
	 * the `export:templates` CLI script but accessible through the UI.
	 */
	async exportAllSampleTemplates(): Promise<{
		zipBase64: string;
		count: number;
		failures: Array<{ kind: string; variant: string; error: string }>;
	}> {
		const { default: JSZip } = await import("jszip");
		const academic = await import(
			"../academic-documents/academic-documents.service"
		);
		const { loadTemplate } = await import("./template-helper");

		const KINDS = [
			"pv",
			"evaluation",
			"ue",
			"deliberation",
			"diploma",
			"transcript",
			"attestation",
			"student_list",
		] as const;
		const VARIANTS = ["standard", "center"] as const;
		const PAGE_ORIENTATION: Record<string, "portrait" | "landscape"> = {
			pv: "landscape",
			deliberation: "landscape",
			diploma: "landscape",
			student_list: "landscape",
			evaluation: "portrait",
			ue: "portrait",
			transcript: "portrait",
			attestation: "portrait",
		};

		const zip = new JSZip();
		const failures: Array<{ kind: string; variant: string; error: string }> =
			[];
		let count = 0;

		for (const kind of KINDS) {
			for (const variant of VARIANTS) {
				try {
					const templateBody = loadTemplate(kind, variant);
					const html = await this.previewTemplate({ type: kind, templateBody });
					const theme = {
						page: { size: "A4", orientation: PAGE_ORIENTATION[kind] },
					};
					const pdf = await academic.renderPdf(
						html,
						theme as Record<string, unknown>,
					);
					zip.file(`${kind}-${variant}.pdf`, pdf);
					count++;
				} catch (err) {
					failures.push({
						kind,
						variant,
						error: err instanceof Error ? err.message : String(err),
					});
				}
			}
		}

		const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
		return {
			zipBase64: zipBuffer.toString("base64"),
			count,
			failures,
		};
	}

	/**
	 * Process raw data for PV template
	 * Handles retake exams by applying scoring policy (replace/best_of)
	 * @param includeRetakes - Whether to include retake grades in the calculation (default: true)
	 */
	private processPVData(
		data: any,
		config: ReturnType<typeof loadExportConfig>,
		_templateConfig: TemplateConfiguration,
		includeRetakes = true,
	) {
		// Group courses by teaching unit
		const ueMap = new Map();

		for (const cc of data.classCourses) {
			const ueId = cc.courseRef.teachingUnit.id;
			if (!ueMap.has(ueId)) {
				ueMap.set(ueId, {
					id: ueId,
					code: cc.courseRef.teachingUnit.code,
					name: cc.courseRef.teachingUnit.name,
					credits: cc.courseRef.teachingUnit.credits,
					courses: [],
				});
			}

			// Get exams for this course (including retakes)
			const exams = (cc.exams || []).map((exam: any) => ({
				id: exam.id,
				type: exam.type,
				percentage: exam.percentage,
				sessionType: exam.sessionType || "normal",
				parentExamId: exam.parentExamId || null,
				scoringPolicy: exam.scoringPolicy || "replace",
				grades: exam.grades || [],
			})) as ExamWithRetake[];

			ueMap.get(ueId).courses.push({
				id: cc.courseRef.id,
				code: cc.courseRef.code,
				name: cc.courseRef.name,
				coefficient: Number(cc.coefficient) || 1,
				exams,
			});
		}

		// Sort students alphabetically by last name, then first name
		const sortedStudents = [...data.students].sort(
			(a: any, b: any) =>
				(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
				(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
		);

		// Process students
		const students = sortedStudents.map((student: any, index: number) => {
			const ueGrades: any[] = [];

			// For each UE, calculate student's grades
			for (const ue of ueMap.values()) {
				const courseGrades = ue.courses.map((course: any) => {
					// Use the retake-aware grade resolution
					const resolvedGrades = resolveStudentGradesWithRetakes(
						course.exams,
						student.id,
						includeRetakes,
					);

					// Find CC and EXAMEN grades using normalized type
					const cc = resolvedGrades.find((rg) => rg.normalizedType === "CC");
					const ex = resolvedGrades.find(
						(rg) => rg.normalizedType === "EXAMEN",
					);

					let average = null;
					if (cc && ex && cc.score !== null && ex.score !== null) {
						average =
							(cc.score * cc.percentage + ex.score * ex.percentage) / 100;
					}

					return {
						cc: cc?.score ?? null,
						ex: ex?.score ?? null,
						average,
						coefficient: course.coefficient,
						// Include retake info for display if needed
						ccIsRetake: cc?.isRetake ?? false,
						exIsRetake: ex?.isRetake ?? false,
					};
				});

				// Calculate UE weighted average
				// IMPORTANT: ALL ECs must have a grade for the UE to be validated
				const totalCourses = courseGrades.length;
				const coursesWithGrades = courseGrades.filter(
					(cg: any) => cg.average !== null,
				);
				const allCoursesHaveGrades = coursesWithGrades.length === totalCourses;

				let ueAverage: number | null = null;
				if (allCoursesHaveGrades && coursesWithGrades.length > 0) {
					// Calculate weighted average: Σ(grade × coefficient) / Σ(coefficient)
					const sumWeightedGrades = coursesWithGrades.reduce(
						(sum: number, cg: any) => sum + cg.average * cg.coefficient,
						0,
					);
					const sumCoefficients = coursesWithGrades.reduce(
						(sum: number, cg: any) => sum + cg.coefficient,
						0,
					);
					ueAverage =
						sumCoefficients > 0 ? sumWeightedGrades / sumCoefficients : null;
				}

				// Credits are only awarded if ALL ECs have grades AND UE average >= passing grade
				const isPassed =
					allCoursesHaveGrades &&
					ueAverage !== null &&
					ueAverage >= config.grading.passing_grade;
				const creditsEarned = isPassed ? ue.credits : 0;

				// Determine decision based on completeness and grade
				let decision: string;
				if (!allCoursesHaveGrades) {
					decision = "Inc"; // Incomplete - missing grades
				} else if (isPassed) {
					decision = "Ac"; // Acquired
				} else {
					decision = "Nac"; // Not acquired
				}

				ueGrades.push({
					courseGrades,
					average: ueAverage,
					decision,
					credits: creditsEarned,
					ueCredits: Number(ue.credits) || 0,
					isComplete: allCoursesHaveGrades,
					missingCourses: totalCourses - coursesWithGrades.length,
					successRate:
						ueAverage !== null
							? calculateSuccessRate([ueAverage], config.grading.passing_grade)
							: 0,
				});
			}

			// Calculate total credits and credit-weighted general average
			const totalCredits = ueGrades.reduce((sum, ug) => sum + ug.credits, 0);
			const uesWithAverages = ueGrades.filter(
				(ug) => ug.average !== null,
			) as Array<(typeof ueGrades)[number] & { average: number }>;

			let generalAverage: number | null = null;
			if (uesWithAverages.length > 0) {
				const totalUeCredits = uesWithAverages.reduce(
					(sum, ug) => sum + ug.ueCredits,
					0,
				);
				if (totalUeCredits > 0) {
					generalAverage =
						uesWithAverages.reduce(
							(sum, ug) => sum + ug.average * ug.ueCredits,
							0,
						) / totalUeCredits;
				} else {
					// Fallback: simple average if no UE credits defined
					generalAverage =
						uesWithAverages.reduce((sum, ug) => sum + ug.average, 0) /
						uesWithAverages.length;
				}
			}

			const overallPassed =
				generalAverage !== null &&
				generalAverage >= config.grading.passing_grade;

			return {
				number: index + 1,
				lastName: student.profile.lastName,
				firstName: student.profile.firstName,
				registrationNumber: student.registrationNumber,
				ueGrades,
				totalCredits,
				generalAverage,
				overallDecision: overallPassed ? "ACQUIS" : "NON ACQUIS",
			};
		});

		// Calculate global success rate
		const passedCount = students.filter(
			(s: any) => s.overallDecision === "ACQUIS",
		).length;
		const globalSuccessRate =
			students.length > 0
				? Math.round((passedCount / students.length) * 100)
				: 0;

		return {
			...config.institution,
			program: {
				name: data.program.name,
				level: data.cycleLevel.name,
			},
			semester: data.semester.name,
			academicYear: data.academicYear.name,
			ues: Array.from(ueMap.values()),
			students,
			globalSuccessRate,
			signatures: config.signatures.pv,
			watermark: config.watermark,
		};
	}

	/**
	 * Process raw data for evaluation template
	 */
	private processEvaluationData(
		data: any,
		config: ReturnType<typeof loadExportConfig>,
		_templateConfig: TemplateConfiguration,
		observations?: string,
	) {
		// Iterate over EVERY student of the class (not just those with a grade)
		// so the publication shows the full roster — students without a grade
		// appear with score = null → rendered as "ABS" by the formatNumber
		// helper. This was historically broken: only graded students showed up.
		const gradeByStudentId = new Map<string, number | null>();
		for (const g of (data.grades ?? []) as Array<{
			student: string;
			score: string | number | null;
		}>) {
			gradeByStudentId.set(
				g.student,
				g.score !== null && g.score !== undefined ? Number(g.score) : null,
			);
		}

		const sortedStudents = [...(data.classStudents ?? [])].sort(
			(a: any, b: any) =>
				(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
				(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
		);

		const grades = sortedStudents.map((student: any, index: number) => {
			const score = gradeByStudentId.has(student.id)
				? (gradeByStudentId.get(student.id) ?? null)
				: null;

			return {
				number: index + 1,
				lastName: student.profile.lastName,
				firstName: student.profile.firstName,
				registrationNumber: student.registrationNumber,
				score,
				appreciation: score !== null ? getAppreciation(score, config) : "—",
				observation: getObservation(score, config),
			};
		});

		const scores = grades.map((g: any) => g.score);
		const stats = calculateStats(scores);
		const successRate = calculateSuccessRate(
			scores,
			config.grading.passing_grade,
		);

		const examTypeConfig = config.exam_settings.exam_types[data.type] || {};

		return {
			...config.institution,
			evaluationType: data.type,
			evaluationLabel: examTypeConfig.label || data.type,
			course: {
				code: data.classCourseRef.courseRef.code,
				name: data.classCourseRef.courseRef.name,
			},
			teachingUnit: {
				code: data.classCourseRef.courseRef.teachingUnit.code,
				name: data.classCourseRef.courseRef.teachingUnit.name,
			},
			program: {
				name: data.classCourseRef.classRef.program.name,
				level: data.classCourseRef.classRef.cycleLevel.name,
			},
			examDate: data.date
				? new Date(data.date).toLocaleDateString("fr-FR")
				: "",
			duration: config.exam_settings.default_duration_hours,
			// Real EC coefficient = weight of this EC inside its parent UE.
			// Falls back to the config default only if the class_course has no
			// coefficient set (shouldn't happen — the column has default 1.00).
			coefficient:
				Number(data.classCourseRef.coefficient) ||
				config.exam_settings.default_coefficient,
			// Percentage of THIS specific exam within the EC (e.g. 30% for a CC).
			// Useful on the publication header alongside the EC coefficient.
			examPercentage: Number(data.percentage),
			scale: config.grading.scale,
			// Prefer the class_course's own semester (set per EC) over the
			// class default which is frequently null on multi-semester programs.
			semester:
				data.classCourseRef.semester?.name ||
				data.classCourseRef.classRef.semester?.name ||
				"",
			academicYear: data.classCourseRef.classRef.academicYear.name,
			students: grades,
			stats: {
				...stats,
				successRate,
			},
			observations: observations || "",
			publicationDate: new Date().toLocaleDateString("fr-FR"),
			signatures: config.signatures.evaluation,
			watermark: config.watermark,
		};
	}

	/**
	 * Process raw data for UE template
	 * Handles retake exams by applying scoring policy (replace/best_of)
	 * @param includeRetakes - Whether to include retake grades in the calculation (default: true)
	 */
	private processUEData(
		data: any,
		config: ReturnType<typeof loadExportConfig>,
		_templateConfig: TemplateConfiguration,
		includeRetakes = true,
	) {
		const { teachingUnit, classCourses, students } = data;

		// Sort students alphabetically by last name, then first name
		const sortedStudents = [...students].sort(
			(a: any, b: any) =>
				(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
				(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
		);

		// Process students
		const studentGrades = sortedStudents.map((student: any, index: number) => {
			const courseGrades = classCourses.map((cc: any) => {
				// Convert exams to ExamWithRetake format
				const exams = (cc.exams || []).map((exam: any) => ({
					id: exam.id,
					type: exam.type,
					percentage: exam.percentage,
					sessionType: exam.sessionType || "normal",
					parentExamId: exam.parentExamId || null,
					scoringPolicy: exam.scoringPolicy || "replace",
					grades: exam.grades || [],
				})) as ExamWithRetake[];

				// Use the retake-aware grade resolution
				const resolvedGrades = resolveStudentGradesWithRetakes(
					exams,
					student.id,
					includeRetakes,
				);

				// Find CC and EXAMEN grades using normalized type
				const ccGrade = resolvedGrades.find((rg) => rg.normalizedType === "CC");
				const examGrade = resolvedGrades.find(
					(rg) => rg.normalizedType === "EXAMEN",
				);

				const ccScore = ccGrade?.score ?? null;
				const examScore = examGrade?.score ?? null;

				let average = null;
				if (ccGrade && examGrade && ccScore !== null && examScore !== null) {
					average =
						(ccScore * ccGrade.percentage + examScore * examGrade.percentage) /
						100;
				}

				return {
					courseCode: cc.courseRef.code,
					courseName: cc.courseRef.name,
					coefficient: Number(cc.coefficient) || 1,
					cc: ccScore,
					ex: examScore,
					average,
					// Include retake info for display if needed
					ccIsRetake: ccGrade?.isRetake ?? false,
					exIsRetake: examGrade?.isRetake ?? false,
				};
			});

			// Calculate UE weighted average
			// IMPORTANT: ALL ECs must have a grade for the UE to be validated
			const totalCourses = courseGrades.length;
			const coursesWithGrades = courseGrades.filter(
				(cg: any) => cg.average !== null,
			);
			const allCoursesHaveGrades = coursesWithGrades.length === totalCourses;

			let ueAverage: number | null = null;
			if (allCoursesHaveGrades && coursesWithGrades.length > 0) {
				// Calculate weighted average: Σ(grade × coefficient) / Σ(coefficient)
				const sumWeightedGrades = coursesWithGrades.reduce(
					(sum: number, cg: any) => sum + cg.average * cg.coefficient,
					0,
				);
				const sumCoefficients = coursesWithGrades.reduce(
					(sum: number, cg: any) => sum + cg.coefficient,
					0,
				);
				ueAverage =
					sumCoefficients > 0 ? sumWeightedGrades / sumCoefficients : null;
			}

			// Credits are only awarded if ALL ECs have grades AND UE average >= passing grade
			const isPassed =
				allCoursesHaveGrades &&
				ueAverage !== null &&
				ueAverage >= config.grading.passing_grade;

			// Determine decision based on completeness and grade
			let decision: string;
			if (!allCoursesHaveGrades) {
				decision = "Inc"; // Incomplete - missing grades
			} else if (isPassed) {
				decision = "Ac"; // Acquired
			} else {
				decision = "Nac"; // Not acquired
			}

			const successRate =
				ueAverage !== null
					? calculateSuccessRate([ueAverage], config.grading.passing_grade)
					: 0;

			return {
				number: index + 1,
				lastName: student.profile.lastName,
				firstName: student.profile.firstName,
				registrationNumber: student.registrationNumber,
				courseGrades,
				ueAverage,
				decision,
				credits: isPassed ? teachingUnit.credits : 0,
				isComplete: allCoursesHaveGrades,
				missingCourses: totalCourses - coursesWithGrades.length,
				successRate,
			};
		});

		// Calculate global success rate
		const passedCount = studentGrades.filter(
			(sg: any) => sg.decision === "Ac",
		).length;
		const globalSuccessRate =
			studentGrades.length > 0
				? Math.round((passedCount / studentGrades.length) * 100)
				: 0;

		const classData = classCourses[0]?.classRef;

		return {
			...config.institution,
			teachingUnit: {
				code: teachingUnit.code,
				name: teachingUnit.name,
				credits: teachingUnit.credits,
			},
			program: {
				name: classData?.program.name || "",
				level: classData?.cycleLevel.name || "",
			},
			semester: classData?.semester?.name || "",
			academicYear: classData?.academicYear.name || "",
			courses: classCourses.map((cc: any) => ({
				code: cc.courseRef.code,
				name: cc.courseRef.name,
			})),
			students: studentGrades,
			globalSuccessRate,
			signatures: config.signatures.ue,
			watermark: config.watermark,
		};
	}

	/**
	 * Build the bilingual tutelle header context (Pays → Ministère → Université
	 * → Faculté → Institut) consumed by every export template. Cached per
	 * service instance so we hit the DB only once per request.
	 */
	private headerContextCache: HeaderContext | null = null;
	private async buildHeaderContext(): Promise<HeaderContext> {
		if (this.headerContextCache) return this.headerContextCache;
		const institution = await this.repo.getInstitution();
		const chain = await loadTutelleChain(this.institutionId);
		const supervisingUniversity =
			chain.find((i) => i.type === "university") ?? null;
		const supervisingFaculty = chain.find((i) => i.type === "faculty") ?? null;
		this.headerContextCache = {
			country: {
				fr: "REPUBLIQUE DU CAMEROUN",
				en: "REPUBLIC OF CAMEROON",
				mottoFr: "Paix-Travail-Patrie",
				mottoEn: "Peace-Work-Fatherland",
			},
			ministry: {
				fr: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR",
				en: "MINISTRY OF HIGHER EDUCATION",
			},
			university: {
				fr: supervisingUniversity?.nameFr ?? "",
				en: supervisingUniversity?.nameEn ?? "",
				// No postal/email on the topmost parent (per spec).
			},
			faculty: {
				fr: supervisingFaculty?.nameFr ?? "",
				en: supervisingFaculty?.nameEn ?? "",
				postalBox: supervisingFaculty?.postalBox ?? "",
				contactEmail: supervisingFaculty?.contactEmail ?? "",
			},
			institutionHeader: {
				id: institution?.id,
				nameFr: institution?.nameFr ?? "",
				nameEn: institution?.nameEn ?? "",
				abbreviation: institution?.abbreviation ?? "",
				contactEmail: institution?.contactEmail ?? "",
				postalBox: institution?.postalBox ?? "",
				addressFr: institution?.addressFr ?? "",
				addressEn: institution?.addressEn ?? "",
				watermarkLogoUrl: institution?.logoUrl ?? null,
				watermarkLogoSvg: institution?.logoSvg ?? null,
			},
			logos: {
				institution: institution?.logoUrl ?? null,
				institutionSvg: institution?.logoSvg ?? null,
				faculty: supervisingFaculty?.logoUrl ?? null,
				facultySvg: supervisingFaculty?.logoSvg ?? null,
				university: supervisingUniversity?.logoUrl ?? null,
				universitySvg: supervisingUniversity?.logoSvg ?? null,
				ministry: null as string | null,
				ministrySvg: null as string | null,
			},
		};
		return this.headerContextCache;
	}

	/**
	 * Render template with data using Handlebars
	 */
	private async renderTemplate(
		templateName: "pv" | "evaluation" | "ec" | "ue" | "deliberation",
		data: any,
		templateConfig: TemplateConfiguration & { center?: unknown },
	): Promise<string> {
		// Use custom template if provided, otherwise use default
		const templateSource =
			templateConfig.templateBody || loadTemplate(templateName);

		const headerContext = await this.buildHeaderContext();

		// Add template configuration to data
		const enrichedData = {
			...headerContext,
			...data,
			headerConfig: templateConfig.headerConfig,
			styleConfig: templateConfig.styleConfig,
			center: (templateConfig as { center?: unknown }).center ?? null,
		};

		const template = Handlebars.compile(templateSource);
		return template(enrichedData);
	}

	/**
	 * Generate PDF from HTML using Puppeteer
	 */
	private async generatePDF(
		html: string,
		styleConfig: TemplateConfiguration["styleConfig"],
	): Promise<Buffer> {
		const browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
			protocolTimeout: 180_000,
		});

		try {
			const page = await browser.newPage();
			page.setDefaultTimeout(60_000);
			// Force the print stylesheet so any `@media print` rules (page
			// breaks, hidden classes, etc.) apply during the wait — otherwise
			// Chromium computes screen layout, decodes screen-sized rasters,
			// then has to redo the work for print → can hide a logo at PDF
			// time even though the screen render had it.
			await page.emulateMediaType("print");
			await page.setContent(html, { waitUntil: ["load", "networkidle0"] });

			// Robust image readiness: for each <img>, wait until it's complete
			// AND fully decoded AND has a non-zero naturalHeight. Some headless
			// Chromium versions resolve `decode()` while the image is still
			// being decoded on the compositor thread — adding the `complete &&
			// naturalHeight` guard prevents that race. We also try `decode()`
			// up to twice on transient failures (huge base64 URIs occasionally
			// throw EncodingError on first attempt under memory pressure).
			await Promise.race([
				page.evaluate(async () => {
					const tryDecode = async (img: HTMLImageElement) => {
						try {
							await img.decode();
						} catch {
							// Retry once
							try {
								await img.decode();
							} catch {
								/* give up — keep printing without this image */
							}
						}
					};
					const imgs = Array.from(document.images);
					await Promise.all(imgs.map((img) => tryDecode(img)));
					// Final assert: poll for naturalHeight to settle. Resolves
					// when every image either has a non-zero size OR has been
					// in error state for >2s (broken URL, etc.).
					const start = Date.now();
					while (
						Date.now() - start < 8000 &&
						imgs.some(
							(img) =>
								!img.complete ||
								(img.naturalHeight === 0 && img.naturalWidth === 0),
						)
					) {
						await new Promise((r) => setTimeout(r, 100));
					}
				}),
				new Promise<void>((resolve) => setTimeout(resolve, 25000)),
			]);

			// Footer with page numbering: "Page N / Total" centered, in small
			// print. Header is left empty so the document's own header drives
			// the layout. `displayHeaderFooter` requires the bottom margin to
			// reserve enough space — we widen the default 10mm to 18mm so the
			// footer doesn't overlap the table content.
			const footerTemplate = `
				<div style="font-size:8px; width:100%; text-align:center; color:#888; padding: 0 8mm; font-family: Arial, sans-serif;">
					Page <span class="pageNumber"></span> / <span class="totalPages"></span>
				</div>
			`;
			const headerTemplate = "<div></div>";

			const baseBottomMm = styleConfig.margins?.bottom ?? 10;
			const bottomWithFooter = Math.max(baseBottomMm, 18);

			const pdf = await page.pdf({
				format: styleConfig.pageSize || "A4",
				landscape: styleConfig.pageOrientation === "landscape",
				printBackground: true,
				displayHeaderFooter: true,
				headerTemplate,
				footerTemplate,
				margin: {
					top: `${styleConfig.margins?.top || 10}mm`,
					right: `${styleConfig.margins?.right || 10}mm`,
					bottom: `${bottomWithFooter}mm`,
					left: `${styleConfig.margins?.left || 10}mm`,
				},
			});

			return Buffer.from(pdf);
		} finally {
			await browser.close();
		}
	}

	private getSampleData(
		type: "pv" | "evaluation" | "ec" | "ue" | "deliberation",
		config: ReturnType<typeof loadExportConfig>,
	) {
		switch (type) {
			case "pv": {
				const ues = [
					{
						code: "UE101",
						name: "Mathématiques",
						credits: 6,
						courses: [
							{ code: "MAT101", name: "Analyse I" },
							{ code: "MAT102", name: "Algèbre" },
						],
					},
					{
						code: "UE202",
						name: "Informatique",
						credits: 6,
						courses: [{ code: "INF201", name: "Structures de données" }],
					},
				];
				const ueGrades = ues.map((ue) => ({
					courseGrades: ue.courses.map(() => ({
						cc: 14.0,
						ex: 13.0,
						average: 13.5,
					})),
					average: 13.5,
					decision: "Ac",
					credits: ue.credits,
					successRate: 90,
				}));
				return {
					...config.institution,
					program: { name: "Licence Informatique", level: "L3" },
					semester: "Semestre 1",
					academicYear: "2024/2025",
					ues,
					students: [
						{
							number: 1,
							lastName: "Doe",
							firstName: "Jane",
							registrationNumber: "INF23001",
							ueGrades,
							totalCredits: 12,
							generalAverage: 13.5,
							overallDecision: "ACQUIS",
						},
						{
							number: 2,
							lastName: "Smith",
							firstName: "John",
							registrationNumber: "INF23002",
							ueGrades,
							totalCredits: 12,
							generalAverage: 12.2,
							overallDecision: "ACQUIS",
						},
					],
					globalSuccessRate: 90,
					signatures: config.signatures.pv,
					watermark: config.watermark,
				};
			}
			case "evaluation": {
				const students = [
					{
						number: 1,
						lastName: "Doe",
						firstName: "Jane",
						registrationNumber: "INF23001",
						score: 15,
						appreciation: getAppreciation(15, config),
						observation: getObservation(15, config),
					},
					{
						number: 2,
						lastName: "Smith",
						firstName: "John",
						registrationNumber: "INF23002",
						score: 13,
						appreciation: getAppreciation(13, config),
						observation: getObservation(13, config),
					},
				];
				const scores = students.map((s) => s.score);
				return {
					...config.institution,
					evaluationType: "EXAMEN",
					evaluationLabel: "Examen",
					course: { code: "INF201", name: "Structures de données" },
					teachingUnit: {
						code: "UE202",
						name: "Informatique avancée",
					},
					program: { name: "Licence Informatique", level: "L3" },
					examDate: new Date().toLocaleDateString("fr-FR"),
					duration: config.exam_settings.default_duration_hours,
					coefficient: config.exam_settings.default_coefficient,
					scale: config.grading.scale,
					semester: "Semestre 1",
					academicYear: "2024/2025",
					students,
					stats: {
						count: students.length,
						present: students.length,
						absent: 0,
						average: 14.0,
						highest: 15,
						lowest: 13,
						successRate: calculateSuccessRate(
							scores,
							config.grading.passing_grade,
						),
					},
					observations: "",
					publicationDate: new Date().toLocaleDateString("fr-FR"),
					signatures: config.signatures.evaluation,
					watermark: config.watermark,
				};
			}
			case "ec": {
				// Sample shape mirrors what processEcData returns for a real
				// class_course preview — same field names so the editor preview
				// matches production layout.
				const exams = [
					{
						id: "exam-cc",
						label: "Contrôle Continu",
						type: "CC",
						percentage: 30,
						maxScore: 20,
					},
					{
						id: "exam-tp",
						label: "Travaux Pratiques",
						type: "TP",
						percentage: 20,
						maxScore: 20,
					},
					{
						id: "exam-final",
						label: "Examen",
						type: "EXAMEN",
						percentage: 50,
						maxScore: 20,
					},
				];
				const buildRow = (
					n: number,
					last: string,
					first: string,
					mat: string,
					scores: number[],
				) => {
					const examGrades = scores.map((s, i) => ({
						examId: exams[i].id,
						score: s,
					}));
					const average =
						scores.reduce((acc, s, i) => acc + s * exams[i].percentage, 0) /
						100;
					const passed = average >= config.grading.passing_grade;
					return {
						number: n,
						lastName: last,
						firstName: first,
						registrationNumber: mat,
						examGrades,
						average,
						decision: passed ? "Ac" : "Nac",
						credits: passed ? 6 : 0,
						isComplete: true,
					};
				};
				const students = [
					buildRow(1, "Doe", "Jane", "INF23001", [14, 15, 13]),
					buildRow(2, "Smith", "John", "INF23002", [12, 13, 11]),
					buildRow(3, "Martin", "Marie", "INF23003", [16, 14, 15]),
				];
				const finalScores = students
					.map((s) => s.average)
					.filter((a): a is number => a !== null);
				const stats = calculateStats(finalScores);
				return {
					program: { name: "Licence Informatique", level: "L3" },
					semester: "Semestre 1",
					academicYear: "2024/2025",
					classCode: "L3-INFO-A",
					className: "L3 Informatique A",
					classCourse: {
						code: "INF201",
						name: "Structures de données",
						courseCode: "INF201",
						courseName: "Structures de données",
						credits: 6,
						coefficient: 1,
					},
					teachingUnit: {
						code: "UE202",
						name: "Informatique avancée",
						credits: 6,
					},
					exams,
					students,
					globalAverage: stats.average,
					globalSuccessRate: calculateSuccessRate(
						finalScores,
						config.grading.passing_grade,
					),
					signatures: config.signatures.evaluation,
				};
			}
			case "ue": {
				const courseGrades = [
					{
						courseCode: "INF201",
						courseName: "Structures de données",
						cc: 14,
						ex: 13,
						average: 13.5,
					},
					{
						courseCode: "INF202",
						courseName: "Bases de données",
						cc: 15,
						ex: 14,
						average: 14.5,
					},
				];
				return {
					...config.institution,
					teachingUnit: {
						code: "UE202",
						name: "Informatique avancée",
						credits: 12,
					},
					program: { name: "Licence Informatique", level: "L3" },
					semester: "Semestre 1",
					academicYear: "2024/2025",
					courses: courseGrades.map((c) => ({
						code: c.courseCode,
						name: c.courseName,
					})),
					students: [
						{
							number: 1,
							lastName: "Doe",
							firstName: "Jane",
							registrationNumber: "INF23001",
							courseGrades,
							ueAverage: 14,
							decision: "Ac",
							credits: 12,
							successRate: 95,
						},
						{
							number: 2,
							lastName: "Smith",
							firstName: "John",
							registrationNumber: "INF23002",
							courseGrades,
							ueAverage: 12,
							decision: "Ac",
							credits: 12,
							successRate: 80,
						},
					],
					globalSuccessRate: 90,
					signatures: config.signatures.ue,
					watermark: config.watermark,
				};
			}
			case "deliberation": {
				const ues = [
					{ id: "ue1", code: "UE101", name: "Mathématiques", credits: 6 },
					{ id: "ue2", code: "UE202", name: "Informatique", credits: 6 },
				];
				return {
					...config.institution,
					deliberation: {
						programName: "Licence Informatique",
						className: "L3 Info",
						semesterName: "Semestre 1",
						academicYearName: "2024/2025",
						date: new Date().toLocaleDateString("fr-FR"),
					},
					jury: {
						president: { name: "Pr. Martin", role: "Président" },
						members: [{ name: "Dr. Dupont" }, { name: "Dr. Bernard" }],
					},
					ues,
					students: [
						{
							rank: 1,
							registrationNumber: "INF23001",
							lastName: "Doe",
							firstName: "Jane",
							ueResults: ues.map((ue) => ({
								ueAverage: 14.5,
								decision: "ADM",
								creditsEarned: ue.credits,
							})),
							generalAverage: 14.5,
							totalCreditsEarned: 12,
							totalCreditsPossible: 12,
							finalDecision: "admitted",
							finalDecisionLabel: "Admis en cl. supérieure",
							mention: "bien",
							mentionLabel: "Bien",
						},
						{
							rank: 2,
							registrationNumber: "INF23002",
							lastName: "Smith",
							firstName: "John",
							ueResults: ues.map((ue) => ({
								ueAverage: 11.0,
								decision: "CMP",
								creditsEarned: ue.credits,
							})),
							generalAverage: 11.0,
							totalCreditsEarned: 12,
							totalCreditsPossible: 12,
							finalDecision: "compensated",
							finalDecisionLabel: "Admis par compensation",
							mention: "passable",
							mentionLabel: "Passable",
						},
					],
					stats: {
						totalStudents: 2,
						admittedCount: 1,
						compensatedCount: 1,
						deferredCount: 0,
						repeatCount: 0,
						excludedCount: 0,
						pendingCount: 0,
						classAverage: 12.75,
						successRate: 100,
						highestAverage: 14.5,
						lowestAverage: 11.0,
					},
					signatures: config.signatures.pv,
					watermark: config.watermark,
				};
			}
		}
	}

	/** Generate a PDF catalogue of UEs and their ECs for the given classes */
	async generateCourseCatalog(input: GenerateCourseCatalogInput) {
		const data = await this.loadCourseCatalogData(
			input.classIds,
			input.academicYearId,
		);

		const template = Handlebars.compile(COURSE_CATALOG_TEMPLATE);
		const html = template({
			classes: data,
			totalClasses: data.length,
			generatedDate: new Date().toLocaleDateString("fr-FR"),
		});

		if (input.format === "html") {
			return { content: html, mimeType: "text/html" };
		}

		const pdf = await this.generatePDF(html, {
			pageSize: "A4",
			pageOrientation: "landscape",
			margins: { top: 10, right: 12, bottom: 10, left: 12 },
		} as TemplateConfiguration["styleConfig"]);
		return {
			content: Buffer.from(pdf).toString("base64"),
			mimeType: "application/pdf",
		};
	}

	private async loadCourseCatalogData(
		classIds: string[],
		academicYearId?: string,
	) {
		// Resolve class IDs from academic year if none provided
		let resolvedClassIds = classIds;
		if (classIds.length === 0 && academicYearId) {
			const yearClasses = await db
				.select({ id: schema.classes.id })
				.from(schema.classes)
				.where(
					and(
						eq(schema.classes.academicYear, academicYearId),
						eq(schema.classes.institutionId, this.institutionId),
					),
				);
			resolvedClassIds = yearClasses.map((c) => c.id);
		}
		if (resolvedClassIds.length === 0) return [];

		const { asc } = await import("drizzle-orm");
		const classRows = await db
			.select({
				id: schema.classes.id,
				name: schema.classes.name,
				code: schema.classes.code,
			})
			.from(schema.classes)
			.where(
				and(
					inArray(schema.classes.id, resolvedClassIds),
					eq(schema.classes.institutionId, this.institutionId),
				),
			)
			.orderBy(asc(schema.classes.name));

		const classCoursesRows = await db
			.select({
				id: schema.classCourses.id,
				class: schema.classCourses.class,
				coefficient: schema.classCourses.coefficient,
				courseId: schema.courses.id,
				courseName: schema.courses.name,
				courseCode: schema.courses.code,
				ueId: schema.teachingUnits.id,
				ueName: schema.teachingUnits.name,
				ueCode: schema.teachingUnits.code,
				ueSemester: schema.teachingUnits.semester,
				ueCredits: schema.teachingUnits.credits,
				teacherFirstName: schema.domainUsers.firstName,
				teacherLastName: schema.domainUsers.lastName,
			})
			.from(schema.classCourses)
			.innerJoin(
				schema.courses,
				eq(schema.courses.id, schema.classCourses.course),
			)
			.innerJoin(
				schema.teachingUnits,
				eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
			)
			.leftJoin(
				schema.domainUsers,
				eq(schema.domainUsers.id, schema.classCourses.teacher),
			)
			.where(
				and(
					inArray(schema.classCourses.class, resolvedClassIds),
					eq(schema.classCourses.institutionId, this.institutionId),
				),
			)
			.orderBy(asc(schema.teachingUnits.code), asc(schema.courses.code));

		type UEEntry = {
			id: string;
			name: string;
			code: string;
			semester: string;
			credits: number;
			courses: Array<{
				name: string;
				code: string;
				coefficient: string | number;
				teacher: string;
			}>;
		};
		type ClassEntry = {
			id: string;
			name: string;
			code: string;
			ues: UEEntry[];
		};

		const classMap = new Map<string, ClassEntry>(
			classRows.map((c) => [c.id, { ...c, ues: [] }]),
		);
		const ueMap = new Map<string, UEEntry>();

		for (const cc of classCoursesRows) {
			const classEntry = classMap.get(cc.class);
			if (!classEntry) continue;

			const ueKey = `${cc.class}::${cc.ueId}`;
			if (!ueMap.has(ueKey)) {
				const ueEntry: UEEntry = {
					id: cc.ueId,
					name: cc.ueName,
					code: cc.ueCode,
					semester: cc.ueSemester,
					credits: cc.ueCredits ?? 0,
					courses: [],
				};
				ueMap.set(ueKey, ueEntry);
				classEntry.ues.push(ueEntry);
			}
			ueMap.get(ueKey)!.courses.push({
				name: cc.courseName,
				code: cc.courseCode,
				coefficient: Number.parseFloat(String(cc.coefficient ?? 1)),
				teacher:
					[cc.teacherFirstName, cc.teacherLastName].filter(Boolean).join(" ") ||
					"—",
			});
		}

		for (const cls of classMap.values()) {
			cls.ues.sort(
				(a, b) =>
					a.semester.localeCompare(b.semester) || a.code.localeCompare(b.code),
			);
			for (const ue of cls.ues) {
				ue.courses.sort((a, b) => a.code.localeCompare(b.code));
			}
		}

		return [...classMap.values()].filter((c) => c.ues.length > 0);
	}
}
