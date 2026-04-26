import { z } from "zod";
import {
	fontEnum,
	hexColor,
	pageSchema,
	type ThemePresetMap,
	watermarkSchema,
} from "./common";

export const studentListThemeSchema = z.object({
	page: pageSchema,
	watermark: watermarkSchema,

	fonts: z.object({
		main: fontEnum,
		header: fontEnum,
		title: fontEnum,
		table: fontEnum,
		footer: fontEnum,
	}),

	sizes: z.object({
		header: z.number().min(7).max(14),
		title: z.number().min(12).max(28),
		subtitle: z.number().min(8).max(16),
		tableHeader: z.number().min(7).max(13),
		tableBody: z.number().min(7).max(13),
		footer: z.number().min(6).max(12),
	}),

	colors: z.object({
		primary: hexColor,
		secondary: hexColor,
		tableHeaderBg: hexColor,
		tableHeaderText: hexColor,
		tableBorder: hexColor,
		alternateRow: hexColor,
	}),

	table: z.object({
		borderWidth: z.number().min(0).max(3),
		rowHeight: z.number().min(3).max(10),
		alternateRows: z.boolean(),
		showRowNumber: z.boolean(),
		showRegistration: z.boolean(),
		showGender: z.boolean(),
		showBirthDate: z.boolean(),
		showBirthPlace: z.boolean(),
		showEmail: z.boolean(),
		showPhone: z.boolean(),
		showClass: z.boolean(),
		showProgram: z.boolean(),
	}),

	logos: z.object({
		institutionLogoSize: z.number().min(40).max(160),
		ministryLogoSize: z.number().min(40).max(120),
		coatOfArmsSize: z.number().min(40).max(120),
	}),

	display: z.object({
		bilingual: z.boolean(),
		primaryLanguage: z.enum(["french", "english"]),
		showSummary: z.boolean(),
		showSignatures: z.boolean(),
		titleOverride: z.string().max(200).optional(),
	}),
});

export type StudentListTheme = z.infer<typeof studentListThemeSchema>;

export const studentListClassicTheme: StudentListTheme = {
	page: {
		size: "A4",
		orientation: "portrait",
		margins: { top: 12, right: 12, bottom: 12, left: 12 },
	},
	watermark: {
		enabled: false,
		text: "ORIGINAL",
		color: "#003366",
		textOpacity: 0.04,
		logoOpacity: 0.06,
		logoSize: 400,
		textSize: 70,
	},
	fonts: {
		main: "Times New Roman, serif",
		header: "Times New Roman, serif",
		title: "Georgia, serif",
		table: "Arial, sans-serif",
		footer: "Times New Roman, serif",
	},
	sizes: {
		header: 9,
		title: 16,
		subtitle: 11,
		tableHeader: 9,
		tableBody: 9,
		footer: 8,
	},
	colors: {
		primary: "#003366",
		secondary: "#666666",
		tableHeaderBg: "#003366",
		tableHeaderText: "#FFFFFF",
		tableBorder: "#000000",
		alternateRow: "#F5F5F5",
	},
	table: {
		borderWidth: 1,
		rowHeight: 5,
		alternateRows: true,
		showRowNumber: true,
		showRegistration: true,
		showGender: true,
		showBirthDate: true,
		showBirthPlace: false,
		showEmail: false,
		showPhone: false,
		showClass: true,
		showProgram: false,
	},
	logos: {
		institutionLogoSize: 80,
		ministryLogoSize: 70,
		coatOfArmsSize: 70,
	},
	display: {
		bilingual: false,
		primaryLanguage: "french",
		showSummary: true,
		showSignatures: true,
	},
};

export const studentListThemePresets: ThemePresetMap<StudentListTheme> = {
	classic: studentListClassicTheme,
	elegant: {
		...studentListClassicTheme,
		fonts: {
			main: "Garamond, serif",
			header: "Garamond, serif",
			title: "Didot, serif",
			table: "Garamond, serif",
			footer: "Garamond, serif",
		},
		colors: {
			...studentListClassicTheme.colors,
			primary: "#1a1a4d",
			tableHeaderBg: "#1a1a4d",
		},
	},
	modern: {
		...studentListClassicTheme,
		fonts: {
			main: "Calibri, sans-serif",
			header: "Calibri, sans-serif",
			title: "Montserrat, sans-serif",
			table: "Calibri, sans-serif",
			footer: "Calibri, sans-serif",
		},
		colors: {
			...studentListClassicTheme.colors,
			primary: "#004d99",
			tableHeaderBg: "#004d99",
		},
	},
	compact: {
		...studentListClassicTheme,
		page: {
			...studentListClassicTheme.page,
			margins: { top: 8, right: 8, bottom: 8, left: 8 },
		},
		sizes: {
			header: 8,
			title: 13,
			subtitle: 9,
			tableHeader: 8,
			tableBody: 8,
			footer: 7,
		},
		table: { ...studentListClassicTheme.table, rowHeight: 3.5 },
	},
	large: {
		...studentListClassicTheme,
		sizes: {
			header: 11,
			title: 20,
			subtitle: 13,
			tableHeader: 11,
			tableBody: 11,
			footer: 10,
		},
		table: { ...studentListClassicTheme.table, rowHeight: 7 },
	},
};
