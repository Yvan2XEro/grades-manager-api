import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import type { Institution, InstitutionType } from "../types";

export const NO_SELECTION = "__NONE__";

export const institutionSchema = z.object({
	code: z.string().min(1),
	type: z.enum(["university", "institution", "faculty"]),
	shortName: z.string().optional(),
	abbreviation: z.string().optional(),
	nameFr: z.string().min(1),
	nameEn: z.string().min(1),
	legalNameFr: z.string().optional(),
	legalNameEn: z.string().optional(),
	sloganFr: z.string().optional(),
	sloganEn: z.string().optional(),
	descriptionFr: z.string().optional(),
	descriptionEn: z.string().optional(),
	addressFr: z.string().optional(),
	addressEn: z.string().optional(),
	contactEmail: z.string().email().optional().or(z.literal("")),
	contactPhone: z.string().optional(),
	fax: z.string().optional(),
	postalBox: z.string().optional(),
	website: z.string().url().optional().or(z.literal("")),
	logoUrl: z.string().url().optional().or(z.literal("")),
	logoSvg: z.string().optional().or(z.literal("")),
	coverImageUrl: z.string().url().optional().or(z.literal("")),
	parentInstitutionId: z.string().optional(),
	institutionId: z.string().optional(),
	timezone: z.string().optional(),
	defaultAcademicYearId: z.string().optional(),
	registrationFormatId: z.string().optional(),
});

export type InstitutionFormValues = z.infer<typeof institutionSchema>;
export type InstitutionForm = UseFormReturn<InstitutionFormValues>;

export const institutionDefaultValues: InstitutionFormValues = {
	code: "",
	type: "faculty",
	shortName: "",
	abbreviation: "",
	nameFr: "",
	nameEn: "",
	legalNameFr: "",
	legalNameEn: "",
	sloganFr: "",
	sloganEn: "",
	descriptionFr: "",
	descriptionEn: "",
	addressFr: "",
	addressEn: "",
	contactEmail: "",
	contactPhone: "",
	fax: "",
	postalBox: "",
	website: "",
	logoUrl: "",
	logoSvg: "",
	coverImageUrl: "",
	parentInstitutionId: undefined,
	institutionId: undefined,
	timezone: "UTC",
	defaultAcademicYearId: undefined,
	registrationFormatId: undefined,
};

/** Form values of a saved institution (nulls become empty strings / undefined). */
export function institutionToFormValues(
	institution: Institution,
): InstitutionFormValues {
	return {
		code: institution.code,
		type: institution.type as InstitutionType,
		shortName: institution.shortName ?? "",
		abbreviation: institution.abbreviation ?? "",
		nameFr: institution.nameFr,
		nameEn: institution.nameEn,
		legalNameFr: institution.legalNameFr ?? "",
		legalNameEn: institution.legalNameEn ?? "",
		sloganFr: institution.sloganFr ?? "",
		sloganEn: institution.sloganEn ?? "",
		descriptionFr: institution.descriptionFr ?? "",
		descriptionEn: institution.descriptionEn ?? "",
		addressFr: institution.addressFr ?? "",
		addressEn: institution.addressEn ?? "",
		contactEmail: institution.contactEmail ?? "",
		contactPhone: institution.contactPhone ?? "",
		fax: institution.fax ?? "",
		postalBox: institution.postalBox ?? "",
		website: institution.website ?? "",
		logoUrl: institution.logoUrl ?? "",
		logoSvg: institution.logoSvg ?? "",
		coverImageUrl: institution.coverImageUrl ?? "",
		parentInstitutionId: institution.parentInstitutionId ?? undefined,
		institutionId: institution.institutionId ?? undefined,
		timezone: institution.timezone ?? "UTC",
		defaultAcademicYearId: institution.defaultAcademicYearId ?? undefined,
		registrationFormatId: institution.registrationFormatId ?? undefined,
	};
}

/** API payload: empty optional strings are sent as `undefined`. */
export const toInstitutionPayload = (values: InstitutionFormValues) => ({
	...values,
	contactEmail: values.contactEmail || undefined,
	website: values.website || undefined,
	logoUrl: values.logoUrl || undefined,
	logoSvg: values.logoSvg || undefined,
	coverImageUrl: values.coverImageUrl || undefined,
	parentInstitutionId: values.parentInstitutionId || undefined,
	institutionId: values.institutionId || undefined,
});

/** Every institution, feeding the parent / supervising faculty selects. */
export function useInstitutionsList() {
	const { data } = useQuery(trpc.institutions.list.queryOptions());
	return useMemo(() => (data ?? []) as Institution[], [data]);
}

interface Options {
	defaultValues: InstitutionFormValues;
	/** Copies contact / location fields of the parent when it is picked. */
	inheritFromParent?: boolean;
}

/** Form state of an institution, shared by the create/edit dialog and the settings page. */
export function useInstitutionForm({
	defaultValues,
	inheritFromParent,
}: Options) {
	const form = useForm<InstitutionFormValues>({
		resolver: zodResolver(institutionSchema),
		defaultValues,
	});
	const institutions = useInstitutionsList();

	const watchedParentId = form.watch("parentInstitutionId");

	useEffect(() => {
		if (!inheritFromParent || !watchedParentId) return;
		const parent = institutions.find((i) => i.id === watchedParentId);
		if (!parent) return;

		// Fields to inherit from the parent (only contact / location / config)
		const inherited: Partial<InstitutionFormValues> = {
			addressFr: parent.addressFr ?? "",
			addressEn: parent.addressEn ?? "",
			contactEmail: parent.contactEmail ?? "",
			contactPhone: parent.contactPhone ?? "",
			fax: parent.fax ?? "",
			postalBox: parent.postalBox ?? "",
			website: parent.website ?? "",
			timezone: parent.timezone ?? "UTC",
		};

		for (const [key, value] of Object.entries(inherited)) {
			form.setValue(key as keyof InstitutionFormValues, value as never, {
				shouldDirty: true,
			});
		}
	}, [inheritFromParent, watchedParentId, institutions, form]);

	return { form, institutions };
}

/** Academic years and registration formats of the "System configuration" section. */
export function useInstitutionSystemOptions() {
	const yearsQuery = useQuery(
		trpc.academicYears.list.queryOptions({ limit: 100 }),
	);
	const formatsQuery = useQuery(
		trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
	);
	const years = yearsQuery.data?.items ?? [];
	const formats = formatsQuery.data ?? [];
	return {
		years,
		formats,
		activeYear: years.find((year) => year.isActive) ?? null,
		activeFormat: formats.find((format) => format.isActive) ?? null,
	};
}
