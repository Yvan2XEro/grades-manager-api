import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

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
type CenterRecord = CenterForm & { id: string };

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

/** Form values of a saved center (nulls become empty strings). */
export const centerToFormValues = (data: CenterRecord): CenterForm => ({
	code: data.code,
	shortName: data.shortName ?? "",
	name: data.name,
	nameEn: data.nameEn ?? "",
	description: data.description ?? "",
	addressFr: data.addressFr ?? "",
	addressEn: data.addressEn ?? "",
	city: data.city ?? "",
	country: data.country ?? "",
	postalBox: data.postalBox ?? "",
	contactEmail: data.contactEmail ?? "",
	contactPhone: data.contactPhone ?? "",
	logoUrl: data.logoUrl ?? "",
	logoSvg: data.logoSvg ?? "",
	adminInstanceLogoUrl: data.adminInstanceLogoUrl ?? "",
	adminInstanceLogoSvg: data.adminInstanceLogoSvg ?? "",
	watermarkLogoUrl: data.watermarkLogoUrl ?? "",
	watermarkLogoSvg: data.watermarkLogoSvg ?? "",
	authorizationOrderFr: data.authorizationOrderFr ?? "",
	authorizationOrderEn: data.authorizationOrderEn ?? "",
	isActive: data.isActive,
	administrativeInstances: (data.administrativeInstances ?? []).map((inst) => ({
		id: inst.id,
		nameFr: inst.nameFr,
		nameEn: inst.nameEn,
		acronymFr: inst.acronymFr ?? "",
		acronymEn: inst.acronymEn ?? "",
		logoUrl: inst.logoUrl ?? "",
		logoSvg: (inst as { logoSvg?: string | null }).logoSvg ?? "",
		showOnTranscripts: inst.showOnTranscripts,
		showOnCertificates: inst.showOnCertificates,
	})),
	legalTexts: (data.legalTexts ?? []).map((lt) => ({
		id: lt.id,
		textFr: lt.textFr,
		textEn: lt.textEn,
	})),
});

/** API payload: empty optional values are sent as `undefined` / `null`. */
export const toCenterPayload = (values: CenterForm) => ({
	...values,
	contactEmail: values.contactEmail || undefined,
	administrativeInstances: values.administrativeInstances.map((i) => ({
		...i,
		acronymFr: i.acronymFr || null,
		acronymEn: i.acronymEn || null,
		logoUrl: i.logoUrl || null,
		logoSvg: i.logoSvg || null,
	})),
	legalTexts: values.legalTexts,
});

/**
 * Form state of a center: empty when creating (`centerId` undefined), loaded
 * from the API otherwise. Saving a new center opens its detail page.
 */
export function useCenterForm(centerId?: string) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const isCreating = !centerId;

	const form = useForm<CenterForm>({
		resolver: zodResolver(centerSchema),
		defaultValues: emptyValues,
	});

	const centerQuery = useQuery({
		queryKey: ["center", centerId],
		enabled: !isCreating,
		queryFn: () =>
			trpcClient.centers.getById.query({
				id: centerId!,
			}) as Promise<CenterRecord>,
	});

	useEffect(() => {
		if (centerQuery.data) form.reset(centerToFormValues(centerQuery.data));
	}, [centerQuery.data, form]);

	const saveMutation = useMutation({
		mutationFn: async (values: CenterForm) => {
			const payload = toCenterPayload(values);
			if (isCreating) {
				return trpcClient.centers.create.mutate(payload);
			}
			return trpcClient.centers.update.mutate({ id: centerId!, ...payload });
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["centers"] });
			if (isCreating) {
				toast.success(
					t("admin.centers.toast.createSuccess", {
						defaultValue: "Centre créé",
					}),
				);
				navigate(`/centers/${(data as { id: string }).id}/identity`);
			} else {
				toast.success(
					t("admin.centers.toast.updateSuccess", {
						defaultValue: "Centre mis à jour",
					}),
				);
				queryClient.invalidateQueries({ queryKey: ["center", centerId] });
			}
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return {
		form,
		centerQuery,
		isSaving: saveMutation.isPending,
		onSubmit: (values: CenterForm) => saveMutation.mutate(values),
	};
}
