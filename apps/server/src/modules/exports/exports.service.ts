import Handlebars from "handlebars";
import puppeteer from "puppeteer";
import { db } from "../../db";
import { ExportsRepo } from "./exports.repo";
import type {
	GenerateEvaluationInput,
	GeneratePVInput,
	GenerateUEInput,
} from "./exports.zod";
import {
	calculateStats,
	calculateSuccessRate,
	formatNumber,
	getAppreciation,
	getObservation,
	loadExportConfig,
	loadTemplate,
} from "./template-helper";
import {
	loadExportTemplate,
	type TemplateConfiguration,
} from "./template-loader";

/**
 * Service for generating grade exports (PDFs and HTML previews)
 */
export class ExportsService {
	private repo: ExportsRepo;
	private config: ReturnType<typeof loadExportConfig> | null = null;

	constructor(private readonly institutionId: string) {
		this.repo = new ExportsRepo(this.institutionId);

		// Register Handlebars helpers
		this.registerHelpers();
	}

	/**
	 * Get export config from institution or fallback to JSON file
	 */
	private async getConfig(): Promise<ReturnType<typeof loadExportConfig>> {
		if (this.config) {
			return this.config;
		}

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
		const templateData = this.processPVData(data, config, templateConfig);

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
		const html = this.renderTemplate("evaluation", templateData, templateConfig);

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
		const templateData = this.processUEData(data, config, templateConfig);

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

	async previewTemplate(input: {
		type: "pv" | "evaluation" | "ue";
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
	 */
	private processPVData(
		data: any,
		config: ReturnType<typeof loadExportConfig>,
		templateConfig: TemplateConfiguration,
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

			// Get exams for this course
			const exams = cc.exams || [];
			ueMap.get(ueId).courses.push({
				id: cc.courseRef.id,
				code: cc.courseRef.code,
				name: cc.courseRef.name,
				exams,
			});
		}

		// Process students
		const students = data.students.map((student: any, index: number) => {
			const ueGrades: any[] = [];

			// For each UE, calculate student's grades
			for (const ue of ueMap.values()) {
				const courseGrades = ue.courses.map((course: any) => {
					const examGrades = course.exams.map((exam: any) => {
						const grade = exam.grades.find(
							(g: any) => g.studentRef.id === student.id,
						);
						return {
							type: exam.type,
							score: grade ? Number(grade.score) : null,
							percentage: Number(exam.percentage),
						};
					});

					// Calculate course average (CC + EX)
					const cc = examGrades.find((eg: any) => eg.type === "CC");
					const ex = examGrades.find((eg: any) => eg.type === "EXAMEN");

					let average = null;
					if (cc && ex && cc.score !== null && ex.score !== null) {
						average =
							(cc.score * cc.percentage + ex.score * ex.percentage) / 100;
					}

					return {
						cc: cc?.score ?? null,
						ex: ex?.score ?? null,
						average,
					};
				});

				// Calculate UE average
				const validAverages = courseGrades
					.map((cg: any) => cg.average)
					.filter((a: any): a is number => a !== null);

				const ueAverage =
					validAverages.length > 0
						? validAverages.reduce((sum, avg) => sum + avg, 0) /
							validAverages.length
						: null;

				const isPassed =
					ueAverage !== null && ueAverage >= config.grading.passing_grade;
				const creditsEarned = isPassed ? ue.credits : 0;

				ueGrades.push({
					courseGrades,
					average: ueAverage,
					decision: isPassed ? "Ac" : "Nac",
					credits: creditsEarned,
					successRate:
						validAverages.length > 0
							? calculateSuccessRate([ueAverage], config.grading.passing_grade)
							: 0,
				});
			}

			// Calculate total credits and general average
			const totalCredits = ueGrades.reduce((sum, ug) => sum + ug.credits, 0);
			const validUEAverages = ueGrades
				.map((ug) => ug.average)
				.filter((a): a is number => a !== null);

			const generalAverage =
				validUEAverages.length > 0
					? validUEAverages.reduce((sum, avg) => sum + avg, 0) /
						validUEAverages.length
					: null;

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
		templateConfig: TemplateConfiguration,
		observations?: string,
	) {
		const grades = data.grades.map((grade: any, index: number) => {
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
	 */
	private processUEData(
		data: any,
		config: ReturnType<typeof loadExportConfig>,
		templateConfig: TemplateConfiguration,
	) {
		const { teachingUnit, classCourses, students } = data;

		// Process students
		const studentGrades = students.map((student: any, index: number) => {
			const courseGrades = classCourses.map((cc: any) => {
				const exams = cc.exams || [];
				const ccExam = exams.find((e: any) => e.type === "CC");
				const examExam = exams.find((e: any) => e.type === "EXAMEN");

				const ccGrade = ccExam?.grades.find(
					(g: any) => g.studentRef.id === student.id,
				);
				const examGrade = examExam?.grades.find(
					(g: any) => g.studentRef.id === student.id,
				);

				const ccScore = ccGrade ? Number(ccGrade.score) : null;
				const examScore = examGrade ? Number(examGrade.score) : null;

				let average = null;
				if (ccExam && examExam && ccScore !== null && examScore !== null) {
					average =
						(ccScore * Number(ccExam.percentage) +
							examScore * Number(examExam.percentage)) /
						100;
				}

				return {
					courseCode: cc.courseRef.code,
					courseName: cc.courseRef.name,
					cc: ccScore,
					ex: examScore,
					average,
				};
			});

			// Calculate UE average
			const validAverages = courseGrades
				.map((cg: any) => cg.average)
				.filter((a: any): a is number => a !== null);

			const ueAverage =
				validAverages.length > 0
					? validAverages.reduce((sum, avg) => sum + avg, 0) /
						validAverages.length
					: null;

			const isPassed =
				ueAverage !== null && ueAverage >= config.grading.passing_grade;
			const successRate =
				validAverages.length > 0
					? calculateSuccessRate([ueAverage], config.grading.passing_grade)
					: 0;

			return {
				number: index + 1,
				lastName: student.profile.lastName,
				firstName: student.profile.firstName,
				registrationNumber: student.registrationNumber,
				courseGrades,
				ueAverage,
				decision: isPassed ? "Ac" : "Nac",
				credits: isPassed ? teachingUnit.credits : 0,
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
		templateName: "pv" | "evaluation" | "ue",
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

			return pdf;
		} finally {
			await browser.close();
		}
	}

	private getSampleData(
		type: "pv" | "evaluation" | "ue",
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
		}
	}
}
