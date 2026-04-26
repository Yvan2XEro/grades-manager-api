import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { ImageUploadField } from "@/components/inputs/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

const adminInstanceSchema = z.object({
	id: z.string().optional(),
	nameFr: z.string().trim().min(1, "Requis"),
	nameEn: z.string().trim().min(1, "Required"),
	acronymFr: z.string().optional(),
	acronymEn: z.string().optional(),
	logoUrl: z.string().optional(),
	showOnTranscripts: z.boolean(),
	showOnCertificates: z.boolean(),
});

const legalTextSchema = z.object({
	id: z.string().optional(),
	textFr: z.string().trim().min(1, "Requis"),
	textEn: z.string().trim().min(1, "Required"),
});

const centerSchema = z.object({
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
	adminInstanceLogoUrl: z.string().optional(),
	watermarkLogoUrl: z.string().optional(),
	authorizationOrderFr: z.string().optional(),
	authorizationOrderEn: z.string().optional(),
	isActive: z.boolean(),
	administrativeInstances: z.array(adminInstanceSchema),
	legalTexts: z.array(legalTextSchema),
});

type CenterForm = z.infer<typeof centerSchema>;

const emptyValues: CenterForm = {
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
	adminInstanceLogoUrl: "",
	watermarkLogoUrl: "",
	authorizationOrderFr: "",
	authorizationOrderEn: "",
	isActive: true,
	administrativeInstances: [],
	legalTexts: [],
};

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

	const instances = useFieldArray({
		control: form.control,
		name: "administrativeInstances",
	});

	const legalTexts = useFieldArray({
		control: form.control,
		name: "legalTexts",
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
			adminInstanceLogoUrl: data.adminInstanceLogoUrl ?? "",
			watermarkLogoUrl: data.watermarkLogoUrl ?? "",
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
				})),
				legalTexts: values.legalTexts,
			};
			if (isCreating) {
				return trpcClient.centers.create.mutate(payload);
			}
			return trpcClient.centers.update.mutate({ id: centerId!, ...payload });
		},
		onSuccess: () => {
			toast.success(
				t(
					isCreating
						? "admin.centers.toast.createSuccess"
						: "admin.centers.toast.updateSuccess",
					{
						defaultValue: isCreating ? "Centre créé" : "Centre mis à jour",
					},
				),
			);
			queryClient.invalidateQueries({ queryKey: ["centers"] });
			queryClient.invalidateQueries({ queryKey: ["center", centerId] });
			navigate("/admin/centers");
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

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-foreground">
							{t("admin.centers.detail.title", {
								defaultValue: "Gestion des Centres",
							})}
						</h1>
						<p className="mt-0.5 text-muted-foreground text-xs">
							{t("admin.centers.detail.subtitle", {
								defaultValue:
									"Configurez les centres de formation professionnelle",
							})}
						</p>
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

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							{t("admin.centers.sections.identity", {
								defaultValue: "Informations Générales",
							})}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							{t("admin.centers.sections.logos", { defaultValue: "Logos" })}
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-3">
						<FormField
							control={form.control}
							name="logoUrl"
							render={({ field }) => (
								<FormItem>
									<ImageUploadField
										label={t("admin.centers.form.logoUrl", {
											defaultValue: "Logo du centre",
										})}
										description={t("admin.centers.form.logoUrlHint", {
											defaultValue: "Affiché dans les en-têtes.",
										})}
										value={field.value}
										onChange={field.onChange}
										onClear={() => field.onChange("")}
										placeholder="https://..."
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="adminInstanceLogoUrl"
							render={({ field }) => (
								<FormItem>
									<ImageUploadField
										label={t("admin.centers.form.adminInstanceLogoUrl", {
											defaultValue:
												"Logo de l'instance administrative (ex: MINEFOP)",
										})}
										description={t(
											"admin.centers.form.adminInstanceLogoUrlHint",
											{
												defaultValue:
													"Logo principal de l'autorité de tutelle.",
											},
										)}
										value={field.value}
										onChange={field.onChange}
										onClear={() => field.onChange("")}
										placeholder="https://..."
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="watermarkLogoUrl"
							render={({ field }) => (
								<FormItem>
									<ImageUploadField
										label={t("admin.centers.form.watermarkLogoUrl", {
											defaultValue: "Logo de fond (watermark)",
										})}
										description={t("admin.centers.form.watermarkLogoUrlHint", {
											defaultValue:
												"Logo affiché en filigrane sur les documents.",
										})}
										value={field.value}
										onChange={field.onChange}
										onClear={() => field.onChange("")}
										placeholder="https://..."
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex-row items-center justify-between">
						<CardTitle className="text-sm">
							{t("admin.centers.sections.adminInstances", {
								defaultValue: "Instances Administratives",
							})}
						</CardTitle>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								instances.append({
									nameFr: "",
									nameEn: "",
									acronymFr: "",
									acronymEn: "",
									logoUrl: "",
									showOnTranscripts: true,
									showOnCertificates: true,
								})
							}
						>
							<Plus className="mr-1.5 h-3.5 w-3.5" />
							{t("admin.centers.actions.addInstance", {
								defaultValue: "Ajouter une instance",
							})}
						</Button>
					</CardHeader>
					<CardContent className="space-y-4">
						{instances.fields.length === 0 ? (
							<p className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
								{t("admin.centers.adminInstances.empty", {
									defaultValue:
										"Aucune instance administrative — cliquez sur Ajouter pour en créer.",
								})}
							</p>
						) : (
							instances.fields.map((field, index) => (
								<div
									key={field.id}
									className="space-y-4 rounded-md border bg-muted/20 p-4"
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-sm">
											{t("admin.centers.adminInstances.itemTitle", {
												defaultValue: "Instance #{{n}}",
												n: index + 1,
											})}
										</p>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => instances.remove(index)}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={form.control}
											name={`administrativeInstances.${index}.nameFr`}
											render={({ field }) => (
												<FormItem>
													<FormLabel required>Nom (Français) *</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`administrativeInstances.${index}.nameEn`}
											render={({ field }) => (
												<FormItem>
													<FormLabel required>Nom (Anglais) *</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={form.control}
											name={`administrativeInstances.${index}.acronymFr`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Acronyme (Français)</FormLabel>
													<FormControl>
														<Input {...field} placeholder="MINEFOP" />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`administrativeInstances.${index}.acronymEn`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Acronyme (Anglais)</FormLabel>
													<FormControl>
														<Input {...field} placeholder="MINEFOP" />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<FormField
										control={form.control}
										name={`administrativeInstances.${index}.logoUrl`}
										render={({ field }) => (
											<FormItem>
												<ImageUploadField
													label={t("admin.centers.form.adminInstanceLogo", {
														defaultValue: "Logo de l'instance",
													})}
													description=""
													value={field.value}
													onChange={field.onChange}
													onClear={() => field.onChange("")}
													placeholder="https://..."
												/>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="grid gap-3 md:grid-cols-2">
										<FormField
											control={form.control}
											name={`administrativeInstances.${index}.showOnTranscripts`}
											render={({ field }) => (
												<FormItem className="flex items-center justify-between rounded-md border bg-background p-3">
													<div className="space-y-0.5">
														<FormLabel className="text-sm">
															{t("admin.centers.form.showOnTranscripts", {
																defaultValue:
																	"Afficher le logo sur les relevés",
															})}
														</FormLabel>
														<p className="text-muted-foreground text-xs">
															{t("admin.centers.form.showOnTranscriptsHint", {
																defaultValue:
																	"Le logo apparaîtra dans l'en-tête des relevés de notes",
															})}
														</p>
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
										<FormField
											control={form.control}
											name={`administrativeInstances.${index}.showOnCertificates`}
											render={({ field }) => (
												<FormItem className="flex items-center justify-between rounded-md border bg-background p-3">
													<div className="space-y-0.5">
														<FormLabel className="text-sm">
															{t("admin.centers.form.showOnCertificates", {
																defaultValue:
																	"Afficher le logo sur les attestations",
															})}
														</FormLabel>
														<p className="text-muted-foreground text-xs">
															{t("admin.centers.form.showOnCertificatesHint", {
																defaultValue:
																	"Le logo apparaîtra dans l'en-tête des attestations",
															})}
														</p>
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
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							{t("admin.centers.sections.authorization", {
								defaultValue: "Textes d'Autorisation",
							})}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="authorizationOrderFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.centers.form.authorizationOrderFr", {
												defaultValue: "Arrêté d'autorisation (Français)",
											})}
										</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="authorizationOrderEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.centers.form.authorizationOrderEn", {
												defaultValue: "Arrêté d'autorisation (Anglais)",
											})}
										</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-3 rounded-md border bg-muted/20 p-4">
							<div className="flex items-center justify-between">
								<p className="font-medium text-sm">
									{t("admin.centers.legalTexts.title", {
										defaultValue: "Textes Légaux (Vu les lois...)",
									})}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => legalTexts.append({ textFr: "", textEn: "" })}
								>
									<Plus className="mr-1.5 h-3.5 w-3.5" />
									{t("admin.centers.actions.addLegalText", {
										defaultValue: "Ajouter",
									})}
								</Button>
							</div>
							{legalTexts.fields.length === 0 ? (
								<p className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-xs">
									{t("admin.centers.legalTexts.empty", {
										defaultValue: "Aucun texte légal",
									})}
								</p>
							) : (
								legalTexts.fields.map((field, index) => (
									<div
										key={field.id}
										className="space-y-3 rounded-md border bg-background p-3"
									>
										<div className="flex items-center justify-between">
											<p className="text-muted-foreground text-xs">
												{t("admin.centers.legalTexts.itemTitle", {
													defaultValue: "Texte légal #{{n}}",
													n: index + 1,
												})}
											</p>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => legalTexts.remove(index)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
										<div className="grid gap-3 md:grid-cols-2">
											<FormField
												control={form.control}
												name={`legalTexts.${index}.textFr`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Texte (Français) *
														</FormLabel>
														<FormControl>
															<Textarea rows={2} {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`legalTexts.${index}.textEn`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Texte (Anglais) *
														</FormLabel>
														<FormControl>
															<Textarea rows={2} {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							{t("admin.centers.sections.contact", {
								defaultValue: "Coordonnées",
							})}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-3">
							<FormField
								control={form.control}
								name="postalBox"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.centers.form.postalBox", {
												defaultValue: "Boîte postale",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} placeholder="9293 Douala" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="contactPhone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.centers.form.contactPhone", {
												defaultValue: "Téléphone",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} placeholder="+237 ..." />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="contactEmail"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.centers.form.contactEmail", {
												defaultValue: "Email",
											})}
										</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="country"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.centers.form.country", {
											defaultValue: "Pays",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Cameroun" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="addressFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.centers.form.addressFr", {
												defaultValue: "Adresse (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="addressEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.centers.form.addressEn", {
												defaultValue: "Adresse (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end">
					<Button type="submit" disabled={saveMutation.isPending}>
						<Save className="mr-2 h-4 w-4" />
						{t("common.actions.save", { defaultValue: "Enregistrer" })}
					</Button>
				</div>
			</form>
		</Form>
	);
}
