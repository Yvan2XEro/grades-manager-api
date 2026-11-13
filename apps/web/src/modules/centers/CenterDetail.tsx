import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import {
	CenterContext,
	type CenterForm,
	centerSchema,
	emptyValues,
} from "./CenterContext";

const TABS = [
	{ path: "identity", labelKey: "admin.centers.tabs.identity" },
	{ path: "logos", labelKey: "admin.centers.tabs.logos" },
	{ path: "instances", labelKey: "admin.centers.tabs.instances" },
	{ path: "authorization", labelKey: "admin.centers.tabs.authorization" },
	{ path: "contact", labelKey: "admin.centers.tabs.contact" },
] as const;

export default function CenterDetail() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { centerId } = useParams<{ centerId: string }>();
	const isCreating = !centerId || centerId === "new";

	const form = useForm<CenterForm>({
		resolver: zodResolver(centerSchema),
		defaultValues: emptyValues,
	});

	const centerQuery = useQuery({
		queryKey: ["center", centerId],
		enabled: !isCreating,
		queryFn: () =>
			trpcClient.centers.getById.query({ id: centerId! }) as Promise<
				CenterForm & { id: string }
			>,
	});

	useEffect(() => {
		const data = centerQuery.data;
		if (!data) return;
		form.reset({
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
			administrativeInstances: (data.administrativeInstances ?? []).map(
				(inst) => ({
					id: inst.id,
					nameFr: inst.nameFr,
					nameEn: inst.nameEn,
					acronymFr: inst.acronymFr ?? "",
					acronymEn: inst.acronymEn ?? "",
					logoUrl: inst.logoUrl ?? "",
					logoSvg: (inst as { logoSvg?: string | null }).logoSvg ?? "",
					showOnTranscripts: inst.showOnTranscripts,
					showOnCertificates: inst.showOnCertificates,
				}),
			),
			legalTexts: (data.legalTexts ?? []).map((lt) => ({
				id: lt.id,
				textFr: lt.textFr,
				textEn: lt.textEn,
			})),
		});
	}, [centerQuery.data, form]);

	const saveMutation = useMutation({
		mutationFn: async (values: CenterForm) => {
			const payload = {
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
			};
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
				navigate(`/admin/centers/${(data as { id: string }).id}/identity`);
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

	if (!isCreating && centerQuery.isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const onSubmit = (values: CenterForm) => saveMutation.mutate(values);

	// ── Create mode: simple inline form ──────────────────────────────────────
	if (isCreating) {
		return (
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6 pb-12"
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-foreground">
								{t("admin.centers.detail.title", {
									defaultValue: "Gestion des Centres",
								})}
							</h1>
						</div>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="ghost"
								onClick={() => navigate("/admin/centers")}
							>
								<ArrowLeft className="mr-2 h-4 w-4" />
								{t("admin.centers.detail.backToList", {
									defaultValue: "Retour à la liste",
								})}
							</Button>
							<Button type="submit" disabled={saveMutation.isPending}>
								<Save className="mr-2 h-4 w-4" />
								{t("common.actions.save", { defaultValue: "Enregistrer" })}
							</Button>
						</div>
					</div>
					<div className="grid gap-4 md:grid-cols-3">
						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>Code *</FormLabel>
									<FormControl>
										<Input {...field} placeholder="CEPRES" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="shortName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.centers.form.shortName", {
											defaultValue: "Nom du centre (court)",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="CEPRES" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="city"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.centers.form.city", {
											defaultValue: "Localisation",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Douala" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.centers.form.name", {
											defaultValue: "Nom complet (Français)",
										})}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="CENTRE DE FORMATION PROFESSIONNELLE DE L'ESPOIR"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="nameEn"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.centers.form.nameEn", {
											defaultValue: "Nom complet (Anglais)",
										})}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="HOPE VOCATIONAL TRAINING CENTER"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={form.control}
						name="isActive"
						render={({ field }) => (
							<FormItem className="flex items-center justify-between rounded-md border p-3">
								<div className="space-y-0.5">
									<FormLabel className="text-sm">
										{t("admin.centers.form.isActive", {
											defaultValue: "Centre actif",
										})}
									</FormLabel>
								</div>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</form>
			</Form>
		);
	}

	// ── Edit mode: tabbed hub ─────────────────────────────────────────────────
	const basePath = `/admin/centers/${centerId}`;
	const centerName = centerQuery.data?.name ?? "";

	return (
		<CenterContext.Provider
			value={{ form, isSaving: saveMutation.isPending, onSubmit }}
		>
			<Form {...form}>
				<div className="space-y-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-foreground">{centerName}</h1>
							<p className="mt-0.5 text-muted-foreground text-xs">
								{t("admin.centers.detail.subtitle", {
									defaultValue:
										"Configurez les centres de formation professionnelle",
								})}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							onClick={() => navigate("/admin/centers")}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							{t("admin.centers.detail.backToList", {
								defaultValue: "Retour à la liste",
							})}
						</Button>
					</div>
					<HubNav tabs={TABS} basePath={basePath} />
				</div>
			</Form>
		</CenterContext.Provider>
	);
}
