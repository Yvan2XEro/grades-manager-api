import { z } from "zod";

export const fontList = [
	"Times New Roman, serif",
	"Georgia, serif",
	"Garamond, serif",
	"Palatino, serif",
	"Cambria, serif",
	"Baskerville, serif",
	"Book Antiqua, serif",
	"Didot, serif",
	"Bodoni MT, serif",
	"Constantia, serif",
	"Arial, sans-serif",
	"Helvetica, sans-serif",
	"Calibri, sans-serif",
	"Verdana, sans-serif",
	"Tahoma, sans-serif",
	"Trebuchet MS, sans-serif",
	"Segoe UI, sans-serif",
	"Open Sans, sans-serif",
	"Roboto, sans-serif",
	"Lato, sans-serif",
	"Montserrat, sans-serif",
	"Source Sans Pro, sans-serif",
] as const;

export const fontEnum = z.enum(fontList);
export const hexColor = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, "Must be a #RRGGBB hex color");

export const marginsSchema = z.object({
	top: z.number().min(0).max(40),
	right: z.number().min(0).max(40),
	bottom: z.number().min(0).max(40),
	left: z.number().min(0).max(40),
});
export type Margins = z.infer<typeof marginsSchema>;

export const watermarkSchema = z.object({
	enabled: z.boolean(),
	text: z.string().max(60),
	color: hexColor,
	textOpacity: z.number().min(0).max(0.4),
	logoOpacity: z.number().min(0).max(0.4),
	logoSize: z.number().min(100).max(800),
	// Up to 120pt — large transcripts/attestations need bigger diagonal stamps.
	textSize: z.number().min(10).max(120),
});
export type Watermark = z.infer<typeof watermarkSchema>;

export const pageSchema = z.object({
	size: z.enum(["A4", "A3", "Letter"]).default("A4"),
	orientation: z.enum(["portrait", "landscape"]).default("portrait"),
	margins: marginsSchema,
});
export type Page = z.infer<typeof pageSchema>;

export type ThemePresetMap<T> = Record<
	"classic" | "elegant" | "modern" | "compact" | "large",
	T
>;
