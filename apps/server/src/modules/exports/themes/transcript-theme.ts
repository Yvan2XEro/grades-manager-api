import { z } from "zod";
import {
	fontEnum,
	hexColor,
	pageSchema,
	type ThemePresetMap,
	watermarkSchema,
} from "./common";

export const transcriptThemeSchema = z.object({
	page: pageSchema,
	watermark: watermarkSchema,

	fonts: z.object({
		main: fontEnum,
		header: fontEnum,
		title: fontEnum,
		studentInfo: fontEnum,
		table: fontEnum,
		footer: fontEnum,
	}),

	sizes: z.object({
		header: z.number().min(7).max(14),
		title: z.number().min(12).max(28),
		studentInfo: z.number().min(8).max(14),
		tableHeader: z.number().min(7).max(13),
		tableBody: z.number().min(7).max(13),
		summary: z.number().min(8).max(14),
		footer: z.number().min(6).max(12),
	}),

	colors: z.object({
		primary: hexColor,
		secondary: hexColor,
		accent: hexColor,
		tableHeaderBg: hexColor,
		tableHeaderText: hexColor,
		tableBorder: hexColor,
		alternateRow: hexColor,
		passingGrade: hexColor,
		failingGrade: hexColor,
	}),

	table: z.object({
		borderWidth: z.number().min(0).max(3),
		rowHeight: z.number().min(4).max(12),
		alternateRows: z.boolean(),
		showCoefficient: z.boolean(),
		showCredits: z.boolean(),
		showAppreciation: z.boolean(),
		highlightFailures: z.boolean(),
	}),

	logos: z.object({
		institutionLogoSize: z.number().min(40).max(160),
		ministryLogoSize: z.number().min(40).max(120),
		coatOfArmsSize: z.number().min(40).max(120),
	}),

	display: z.object({
		bilingual: z.boolean(),
		primaryLanguage: z.enum(["french", "english"]),
		showQRCode: z.boolean(),
		qrCodeSize: z.number().min(40).max(120),
		showSemesterBreakdown: z.boolean(),
		showRanking: z.boolean(),
	}),
});

export type TranscriptTheme = z.infer<typeof transcriptThemeSchema>;

// Default values aligned with DIPLOMATION's `defaultTheme` (transcript) — see
// `docs/integration-diplomation.md`. Granular per-field overrides we add (e.g.
// passingGrade/failingGrade colours, alternateRow background) are not in
// DIPLOMATION's payload but kept here as sensible internal defaults.
export const transcriptClassicTheme: TranscriptTheme = {
	page: {
		size: "A4",
		orientation: "portrait",
		margins: { top: 12, right: 12, bottom: 12, left: 12 },
	},
	watermark: {
		enabled: true,
		text: "ORIGINAL",
		color: "#000000",
		textOpacity: 0.05,
		logoOpacity: 0.1,
		logoSize: 400,
		textSize: 80,
	},
	fonts: {
		main: "Times New Roman, serif",
		header: "Times New Roman, serif",
		title: "Times New Roman, serif",
		studentInfo: "Times New Roman, serif",
		table: "Times New Roman, serif",
		footer: "Times New Roman, serif",
	},
	sizes: {
		header: 10,
		title: 18,
		studentInfo: 10,
		tableHeader: 10,
		tableBody: 10,
		summary: 10,
		footer: 8,
	},
	colors: {
		primary: "#000000",
		secondary: "#505050",
		accent: "#000080",
		tableHeaderBg: "#F0F0F0",
		tableHeaderText: "#000000",
		tableBorder: "#000000",
		alternateRow: "#F5F5F5",
		passingGrade: "#0a7a2f",
		failingGrade: "#a00000",
	},
	table: {
		borderWidth: 1,
		rowHeight: 6,
		alternateRows: true,
		showCoefficient: true,
		showCredits: true,
		showAppreciation: true,
		highlightFailures: true,
	},
	logos: {
		institutionLogoSize: 80,
		ministryLogoSize: 70,
		coatOfArmsSize: 70,
	},
	display: {
		bilingual: true,
		primaryLanguage: "french",
		showQRCode: true,
		qrCodeSize: 60,
		showSemesterBreakdown: true,
		showRanking: false,
	},
};

export const transcriptThemePresets: ThemePresetMap<TranscriptTheme> = {
	classic: transcriptClassicTheme,
	elegant: {
		...transcriptClassicTheme,
		fonts: {
			main: "Garamond, serif",
			header: "Garamond, serif",
			title: "Didot, serif",
			studentInfo: "Garamond, serif",
			table: "Garamond, serif",
			footer: "Garamond, serif",
		},
		colors: {
			...transcriptClassicTheme.colors,
			primary: "#1a1a4d",
			accent: "#1a1a4d",
			tableHeaderBg: "#1a1a4d",
		},
	},
	modern: {
		...transcriptClassicTheme,
		fonts: {
			main: "Calibri, sans-serif",
			header: "Calibri, sans-serif",
			title: "Montserrat, sans-serif",
			studentInfo: "Calibri, sans-serif",
			table: "Calibri, sans-serif",
			footer: "Calibri, sans-serif",
		},
		colors: {
			...transcriptClassicTheme.colors,
			primary: "#004d99",
			accent: "#004d99",
			tableHeaderBg: "#004d99",
		},
	},
	compact: {
		...transcriptClassicTheme,
		sizes: {
			header: 8,
			title: 14,
			studentInfo: 9,
			tableHeader: 8,
			tableBody: 8,
			summary: 9,
			footer: 7,
		},
		table: { ...transcriptClassicTheme.table, rowHeight: 4.5 },
	},
	large: {
		...transcriptClassicTheme,
		sizes: {
			header: 11,
			title: 20,
			studentInfo: 12,
			tableHeader: 11,
			tableBody: 11,
			summary: 12,
			footer: 10,
		},
		table: { ...transcriptClassicTheme.table, rowHeight: 8 },
	},
};
