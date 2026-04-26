import { and, eq, inArray } from "drizzle-orm";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import type { DiplomationExportData } from "../deliberations/deliberations.types";
import { ExportsRepo } from "./exports.repo";
import type {
	GenerateCourseCatalogInput,
	GenerateDeliberationInput,
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
	resolveStudentGradesWithRetakes,
} from "./template-helper";
import {
	loadExportTemplate,
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
		Handlebars.registerHelper("gt", (a, b) => a > b);
		Handlebars.registerHelper("add", (a, b) => a + b);
		Handlebars.registerHelper("multiply", (a, b) => a * b);
	}

	/** Return structured PV data (JSON) for frontend Excel export */
	async getPVDataStructured(
		input: Omit<GeneratePVInput, "format" | "templateId">,
	) {
		const config = await this.getConfig();
		const templateConfig = await loadExportTemplate(this.institutionId, "pv");

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

		// Load export template configuration
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"pv",
			input.templateId,
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
		const html = this.renderTemplate("pv", templateData, templateConfig);

		// Return HTML or PDF based on format
		if (input.format === "html") {
			return { content: html, mimeType: "text/html" };
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		// Convert to Buffer if it isn't already (Bun's Puppeteer returns Uint8Array)
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
		};
	}

	/**
	 * Generate evaluation publication export
	 */
	async generateEvaluation(input: GenerateEvaluationInput) {
		const config = await this.getConfig();

		// Load export template configuration
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"evaluation",
			input.templateId,
		);

		const data = await this.repo.getEvaluationData(input.examId);

		// Process data for template with template configuration
		const templateData = this.processEvaluationData(
			data,
			config,
			templateConfig,
			input.observations,
		);

		// Generate HTML
		const html = this.renderTemplate(
			"evaluation",
			templateData,
			templateConfig,
		);

		// Return HTML or PDF based on format
		if (input.format === "html") {
			return { content: html, mimeType: "text/html" };
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		// Convert to Buffer if it isn't already (Bun's Puppeteer returns Uint8Array)
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
		};
	}

	/**
	 * Generate UE (Teaching Unit) publication export
	 */
	async generateUE(input: GenerateUEInput) {
		const config = await this.getConfig();

		// Load export template configuration
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"ue",
			input.templateId,
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
		const html = this.renderTemplate("ue", templateData, templateConfig);

		// Return HTML or PDF based on format
		if (input.format === "html") {
			return { content: html, mimeType: "text/html" };
		}

		const pdf = await this.generatePDF(html, templateConfig.styleConfig);
		// Convert to Buffer if it isn't already (Bun's Puppeteer returns Uint8Array)
		const pdfBuffer = Buffer.from(pdf);
		return {
			content: pdfBuffer.toString("base64"),
			mimeType: "application/pdf",
		};
	}

	/** Generate deliberation export (PDF or HTML) */
	async generateDeliberation(
		input: GenerateDeliberationInput,
		diplomationData: DiplomationExportData,
	) {
		const config = await this.getConfig();
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"deliberation",
			input.templateId,
		);

		const templateData = this.processDeliberationData(
			diplomationData,
			config,
			templateConfig,
		);

		const html = this.renderTemplate(
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
	async getDeliberationDataStructured(diplomationData: DiplomationExportData) {
		const config = await this.getConfig();
		const templateConfig = await loadExportTemplate(
			this.institutionId,
			"deliberation",
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
		type: "pv" | "evaluation" | "ue" | "deliberation";
		templateBody: string;
	}) {
		const config = await this.getConfig();
		const baseConfig = await loadExportTemplate(this.institutionId, input.type);
		const templateConfig: TemplateConfiguration = {
			templateBody: input.templateBody,
			headerConfig: baseConfig.headerConfig,
			styleConfig: baseConfig.styleConfig,
		};
		const sampleData = this.getSampleData(input.type, config);
		return this.renderTemplate(input.type, sampleData, templateConfig);
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
		// Sort grades alphabetically by student last name, then first name
		const sortedGrades = [...data.grades].sort(
			(a: any, b: any) =>
				(a.studentRef.profile.lastName ?? "").localeCompare(
					b.studentRef.profile.lastName ?? "",
				) ||
				(a.studentRef.profile.firstName ?? "").localeCompare(
					b.studentRef.profile.firstName ?? "",
				),
		);

		const grades = sortedGrades.map((grade: any, index: number) => {
			const score = grade.score ? Number(grade.score) : null;

			return {
				number: index + 1,
				lastName: grade.studentRef.profile.lastName,
				firstName: grade.studentRef.profile.firstName,
				registrationNumber: grade.studentRef.registrationNumber,
				score,
				appreciation: score !== null ? getAppreciation(score, config) : "",
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
			coefficient:
				examTypeConfig.coefficient || config.exam_settings.default_coefficient,
			scale: config.grading.scale,
			semester: data.classCourseRef.classRef.semester?.name || "",
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
	 * Render template with data using Handlebars
	 */
	private renderTemplate(
		templateName: "pv" | "evaluation" | "ue" | "deliberation",
		data: any,
		templateConfig: TemplateConfiguration,
	): string {
		// Use custom template if provided, otherwise use default
		const templateSource =
			templateConfig.templateBody || loadTemplate(templateName);

		// Add template configuration to data
		const enrichedData = {
			...data,
			headerConfig: templateConfig.headerConfig,
			styleConfig: templateConfig.styleConfig,
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
		});

		try {
			const page = await browser.newPage();
			await page.setContent(html, { waitUntil: "networkidle0" });

			// Use style config for PDF options
			const pdf = await page.pdf({
				format: styleConfig.pageSize || "A4",
				landscape: styleConfig.pageOrientation === "landscape",
				printBackground: true,
				margin: {
					top: `${styleConfig.margins?.top || 10}mm`,
					right: `${styleConfig.margins?.right || 10}mm`,
					bottom: `${styleConfig.margins?.bottom || 10}mm`,
					left: `${styleConfig.margins?.left || 10}mm`,
				},
			});

			return Buffer.from(pdf);
		} finally {
			await browser.close();
		}
	}

	private getSampleData(
		type: "pv" | "evaluation" | "ue" | "deliberation",
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
