import { z } from "zod";
import {
	fontEnum,
	hexColor,
	pageSchema,
	type ThemePresetMap,
	watermarkSchema,
} from "./common";

export const attestationThemeSchema = z.object({
	page: pageSchema,
	watermark: watermarkSchema,

	fonts: z.object({
		main: fontEnum,
		header: fontEnum,
		title: fontEnum,
		studentName: fontEnum,
		body: fontEnum,
		signature: fontEnum,
		footer: fontEnum,
	}),

	sizes: z.object({
		header: z.number().min(7).max(14),
		title: z.number().min(14).max(36),
		subtitle: z.number().min(10).max(24),
		studentName: z.number().min(12).max(24),
		body: z.number().min(9).max(16),
		signature: z.number().min(8).max(14),
		footer: z.number().min(7).max(12),
	}),

	colors: z.object({
		primary: hexColor,
		secondary: hexColor,
		accent: hexColor,
		title: hexColor,
		studentName: hexColor,
		border: hexColor,
	}),

	borders: z.object({
		outerWidth: z.number().min(0).max(15),
		innerWidth: z.number().min(0).max(5),
		decorative: z.boolean(),
	}),

	logos: z.object({
		institutionLogoSize: z.number().min(40).max(160),
		ministryLogoSize: z.number().min(40).max(120),
		coatOfArmsSize: z.number().min(40).max(120),
	}),

	qrCode: z.object({
		enabled: z.boolean(),
		size: z.number().min(40).max(120),
	}),

	display: z.object({
		bilingual: z.boolean(),
		primaryLanguage: z.enum(["french", "english"]),
		showRefNumber: z.boolean(),
		showStamp: z.boolean(),
	}),

	spacing: z.object({
		titleBlockMarginTop: z.number().min(0).max(30),
		titleBlockMarginBottom: z.number().min(0).max(30),
		bodyLineHeight: z.number().min(1).max(2.5),
		signatureBlockMarginTop: z.number().min(0).max(30),
		paragraphSpacing: z.number().min(2).max(15),
	}),
});

export type AttestationTheme = z.infer<typeof attestationThemeSchema>;

// Default values aligned with DIPLOMATION's `defaultAttestationTheme` — see
// `docs/integration-diplomation.md`. DIPLOMATION uses a single
// `watermarkOpacity` (0.3); we split it into logo/text opacities for finer
// control, keeping the logo at 0.3 to match DIPLOMATION's visual prominence.
export const attestationClassicTheme: AttestationTheme = {
	page: {
		size: "A4",
		orientation: "portrait",
		margins: { top: 15, right: 15, bottom: 15, left: 15 },
	},
	watermark: {
		enabled: true,
		text: "ORIGINAL",
		color: "#000000",
		textOpacity: 0.1,
		logoOpacity: 0.3,
		logoSize: 380,
		textSize: 70,
	},
	fonts: {
		main: "Times New Roman, serif",
		header: "Times New Roman, serif",
		title: "Times New Roman, serif",
		studentName: "Times New Roman, serif",
		body: "Times New Roman, serif",
		signature: "Times New Roman, serif",
		footer: "Times New Roman, serif",
	},
	sizes: {
		header: 10,
		title: 24,
		subtitle: 22,
		studentName: 16,
		body: 12,
		signature: 10,
		footer: 8,
	},
	colors: {
		primary: "#000000",
		secondary: "#333333",
		accent: "#000000",
		title: "#000000",
		studentName: "#000000",
		border: "#000000",
	},
	borders: { outerWidth: 1, innerWidth: 0, decorative: false },
	logos: {
		institutionLogoSize: 90,
		ministryLogoSize: 70,
		coatOfArmsSize: 80,
	},
	qrCode: { enabled: true, size: 60 },
	display: {
		bilingual: true,
		primaryLanguage: "french",
		showRefNumber: true,
		showStamp: true,
	},
	spacing: {
		titleBlockMarginTop: 10,
		titleBlockMarginBottom: 12,
		bodyLineHeight: 1.6,
		signatureBlockMarginTop: 18,
		paragraphSpacing: 6,
	},
};

export const attestationThemePresets: ThemePresetMap<AttestationTheme> = {
	classic: attestationClassicTheme,
	elegant: {
		...attestationClassicTheme,
		fonts: {
			main: "Garamond, serif",
			header: "Garamond, serif",
			title: "Didot, serif",
			studentName: "Didot, serif",
			body: "Garamond, serif",
			signature: "Garamond, serif",
			footer: "Garamond, serif",
		},
		colors: {
			...attestationClassicTheme.colors,
			primary: "#1a1a4d",
			accent: "#1a1a4d",
			title: "#1a1a4d",
			studentName: "#1a1a4d",
			border: "#1a1a4d",
		},
		borders: { outerWidth: 6, innerWidth: 1, decorative: true },
	},
	modern: {
		...attestationClassicTheme,
		fonts: {
			main: "Calibri, sans-serif",
			header: "Calibri, sans-serif",
			title: "Montserrat, sans-serif",
			studentName: "Montserrat, sans-serif",
			body: "Calibri, sans-serif",
			signature: "Calibri, sans-serif",
			footer: "Calibri, sans-serif",
		},
		colors: {
			...attestationClassicTheme.colors,
			primary: "#004d99",
			accent: "#004d99",
			title: "#004d99",
			studentName: "#004d99",
			border: "#004d99",
		},
		borders: { outerWidth: 3, innerWidth: 0, decorative: false },
	},
	compact: {
		...attestationClassicTheme,
		sizes: {
			header: 8,
			title: 18,
			subtitle: 12,
			studentName: 13,
			body: 10,
			signature: 9,
			footer: 7,
		},
		spacing: {
			...attestationClassicTheme.spacing,
			bodyLineHeight: 1.4,
			paragraphSpacing: 4,
		},
	},
	large: {
		...attestationClassicTheme,
		sizes: {
			header: 11,
			title: 26,
			subtitle: 16,
			studentName: 19,
			body: 13,
			signature: 11,
			footer: 9,
		},
		spacing: {
			...attestationClassicTheme.spacing,
			bodyLineHeight: 1.8,
			paragraphSpacing: 8,
		},
	},
};
