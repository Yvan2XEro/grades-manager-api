import { createContext, type UseFormReturn, useContext } from "react";
import { z } from "zod";

export const adminInstanceSchema = z.object({
	id: z.string().optional(),
	nameFr: z.string().trim().min(1, "Requis"),
	nameEn: z.string().trim().min(1, "Required"),
	acronymFr: z.string().optional(),
	acronymEn: z.string().optional(),
	logoUrl: z.string().optional(),
	logoSvg: z.string().optional(),
	showOnTranscripts: z.boolean(),
	showOnCertificates: z.boolean(),
});

export const legalTextSchema = z.object({
	id: z.string().optional(),
	textFr: z.string().trim().min(1, "Requis"),
	textEn: z.string().trim().min(1, "Required"),
});

export const centerSchema = z.object({
	code: z.string().trim().min(1),
	shortName: z.string().optional(),
	name: z.string().trim().min(1),
	nameEn: z.string().optional(),
	description: z.string().optional(),
	addressFr: z.string().optional(),
	addressEn: z.string().optional(),
	city: z.string().optional(),
	country: z.string().optional(),
	postalBox: z.string().optional(),
	contactEmail: z.string().email().optional().or(z.literal("")),
	contactPhone: z.string().optional(),
	logoUrl: z.string().optional(),
	logoSvg: z.string().optional(),
	adminInstanceLogoUrl: z.string().optional(),
	adminInstanceLogoSvg: z.string().optional(),
	watermarkLogoUrl: z.string().optional(),
	watermarkLogoSvg: z.string().optional(),
	authorizationOrderFr: z.string().optional(),
	authorizationOrderEn: z.string().optional(),
	isActive: z.boolean(),
	administrativeInstances: z.array(adminInstanceSchema),
	legalTexts: z.array(legalTextSchema),
});

export type CenterForm = z.infer<typeof centerSchema>;

export const emptyValues: CenterForm = {
	code: "",
	shortName: "",
	name: "",
	nameEn: "",
	description: "",
	addressFr: "",
	addressEn: "",
	city: "",
	country: "",
	postalBox: "",
	contactEmail: "",
	contactPhone: "",
	logoUrl: "",
	logoSvg: "",
	adminInstanceLogoUrl: "",
	adminInstanceLogoSvg: "",
	watermarkLogoUrl: "",
	watermarkLogoSvg: "",
	authorizationOrderFr: "",
	authorizationOrderEn: "",
	isActive: true,
	administrativeInstances: [],
	legalTexts: [],
};

export interface CenterContextValue {
	form: UseFormReturn<CenterForm>;
	isSaving: boolean;
	onSubmit: (values: CenterForm) => void;
}

export const CenterContext = createContext<CenterContextValue | null>(null);

export function useCenterContext(): CenterContextValue {
	const ctx = useContext(CenterContext);
	if (!ctx)
		throw new Error("useCenterContext must be used within CenterDetail");
	return ctx;
}
