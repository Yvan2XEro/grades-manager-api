import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSignature, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ImageUploadField } from "@/components/inputs/ImageUploadField";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const institutionSchema = z.object({
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
	coverImageUrl: z.string().url().optional().or(z.literal("")),
	parentInstitutionId: z.string().optional(),
	institutionId: z.string().optional(),
	defaultAcademicYearId: z.string().optional(),
	registrationFormatId: z.string().optional(),
	timezone: z.string().optional(),
});

type InstitutionFormValues = z.infer<typeof institutionSchema>;

const NO_SELECTION = "__NONE__";

const defaultValues: InstitutionFormValues = {
	code: "",
	type: "institution",
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
	coverImageUrl: "",
	parentInstitutionId: undefined,
	institutionId: undefined,
	defaultAcademicYearId: undefined,
	registrationFormatId: undefined,
	timezone: "UTC",
};

export default function InstitutionSettings() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const institutionQuery = useQuery(trpc.institutions.get.queryOptions());
	const institutionsQuery = useQuery(trpc.institutions.list.queryOptions());
	const yearsQuery = useQuery(
		trpc.academicYears.list.queryOptions({ limit: 100 }),
	);
	const registrationFormatsQuery = useQuery(
		trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
	);

	const form = useForm<InstitutionFormValues>({
		resolver: zodResolver(institutionSchema),
		defaultValues,
	});

	useEffect(() => {
		if (institutionQuery.data) {
			const {
				defaultAcademicYearId,
				registrationFormatId,
				parentInstitutionId,
				institutionId,
				...rest
			} = institutionQuery.data;
			const normalized: InstitutionFormValues = {
				...defaultValues,
				...rest,
				defaultAcademicYearId: defaultAcademicYearId ?? undefined,
				registrationFormatId: registrationFormatId ?? undefined,
				parentInstitutionId: parentInstitutionId ?? undefined,
				institutionId: institutionId ?? undefined,
				contactEmail: rest.contactEmail ?? "",
				contactPhone: rest.contactPhone ?? "",
				fax: rest.fax ?? "",
				postalBox: rest.postalBox ?? "",
				website: rest.website ?? "",
				logoUrl: rest.logoUrl ?? "",
				coverImageUrl: rest.coverImageUrl ?? "",
				shortName: rest.shortName ?? "",
				abbreviation: (rest as any).abbreviation ?? "",
				legalNameFr: rest.legalNameFr ?? "",
				legalNameEn: rest.legalNameEn ?? "",
				sloganFr: rest.sloganFr ?? "",
				sloganEn: rest.sloganEn ?? "",
				descriptionFr: rest.descriptionFr ?? "",
				descriptionEn: rest.descriptionEn ?? "",
				addressFr: rest.addressFr ?? "",
				addressEn: rest.addressEn ?? "",
			};
			form.reset(normalized);
		}
	}, [institutionQuery.data, form]);

	const upsertMutation = useMutation({
		mutationFn: (values: InstitutionFormValues) =>
			trpcClient.institutions.upsert.mutate({
				...values,
				id: institutionQuery.data?.id,
				contactEmail: values.contactEmail || undefined,
				website: values.website || undefined,
				logoUrl: values.logoUrl || undefined,
				coverImageUrl: values.coverImageUrl || undefined,
				parentInstitutionId: values.parentInstitutionId || undefined,
				institutionId: values.institutionId || undefined,
				registrationFormatId: values.registrationFormatId || undefined,
				defaultAcademicYearId: values.defaultAcademicYearId || undefined,
			}),
		onSuccess: (savedInstitution) => {
			toast.success(
				t("admin.institution.toast.saved", {
					defaultValue: "Institution saved",
				}),
			);
			// Update the cache directly with the saved institution instead of
			// refetching — getFirst() could return the parent institution if it
			// was created earlier, overwriting the form with the wrong data.
			if (savedInstitution) {
				queryClient.setQueryData(
					trpc.institutions.get.queryKey(),
					savedInstitution,
				);
			}
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const onSubmit = (values: InstitutionFormValues) => {
		upsertMutation.mutate(values);
	};

	const registrationFormats = registrationFormatsQuery.data ?? [];
	const academicYears = yearsQuery.data?.items ?? [];
	const institutions = institutionsQuery.data ?? [];
	const faculties = institutions.filter((i) => i.type === "faculty");

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/8">
					<Landmark className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-foreground">
						{t("admin.institution.title", {
							defaultValue: "Institution settings",
						})}
					</h1>
					<p className="text-muted-foreground text-xs">
						{t("admin.institution.subtitle", {
							defaultValue:
								"Configure the bilingual identity, branding, and official contacts for generated documents.",
						})}
					</p>
				</div>
			</div>

			{institutionQuery.isLoading ? (
				<div className="flex h-40 items-center justify-center">
					<Spinner className="h-8 w-8" />
				</div>
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Section 1: General Information */}
						<Card>
							<CardHeader>
								<CardTitle>{t("admin.institution.form.identity")}</CardTitle>
								<CardDescription>
									{t("admin.institution.form.identityHint", {
										defaultValue:
											"These values appear on document headers and diplomas in French and English.",
									})}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-4">
									<FormField
										control={form.control}
										name="code"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>
													{t("admin.institution.form.code")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
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
													{t("admin.institution.form.shortName")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="abbreviation"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.abbreviation", {
														defaultValue: "Abbreviation",
													})}
												</FormLabel>
												<FormControl>
													<Input {...field} placeholder="ex: UYI" />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.type", {
														defaultValue: "Type",
													})}
												</FormLabel>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"admin.institution.form.typePlaceholder",
																	{ defaultValue: "Select type" },
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="university">
															{t("admin.institution.form.typeUniversity", {
																defaultValue: "University",
															})}
														</SelectItem>
														<SelectItem value="faculty">
															{t("admin.institution.form.typeFaculty", {
																defaultValue: "Faculty/School",
															})}
														</SelectItem>
														<SelectItem value="institution">
															{t("admin.institution.form.typeInstitution", {
																defaultValue: "Institution/Institute",
															})}
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="parentInstitutionId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.parentInstitution", {
														defaultValue: "Parent Institution (University)",
													})}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(
															value === NO_SELECTION ? undefined : value,
														)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"admin.institution.form.parentInstitutionPlaceholder",
																	{ defaultValue: "Select parent institution" },
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t("admin.institution.form.noParentInstitution", {
																defaultValue: "None (Top-level)",
															})}
														</SelectItem>
														{institutions
															.filter(
																(inst) => inst.id !== institutionQuery.data?.id,
															)
															.map((inst) => (
																<SelectItem key={inst.id} value={inst.id}>
																	{inst.nameFr} ({inst.type})
																</SelectItem>
															))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="institutionId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.supervisingFaculty", {
														defaultValue: "Supervising Faculty/School",
													})}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(
															value === NO_SELECTION ? undefined : value,
														)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"admin.institution.form.supervisingFacultyPlaceholder",
																	{
																		defaultValue: "Select supervising faculty",
																	},
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t(
																"admin.institution.form.noSupervisingFaculty",
																{
																	defaultValue: "None",
																},
															)}
														</SelectItem>
														{faculties.map((faculty) => (
															<SelectItem key={faculty.id} value={faculty.id}>
																{faculty.nameFr}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Section 2: Bilingual Names */}
						<Card>
							<CardHeader>
								<CardTitle>
									{t("admin.institution.sections.names", {
										defaultValue: "Names & Legal Identity",
									})}
								</CardTitle>
								<CardDescription>
									{t("admin.institution.sections.namesHint", {
										defaultValue:
											"Official names as they appear on documents, diplomas, and legal paperwork.",
									})}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="nameFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>
													{t("admin.institution.form.nameFr")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
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
												<FormLabel required>
													{t("admin.institution.form.nameEn")}
												</FormLabel>
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
										name="legalNameFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.legalNameFr")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="legalNameEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.legalNameEn")}
												</FormLabel>
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
										name="sloganFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.sloganFr")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="sloganEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.sloganEn")}
												</FormLabel>
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
										name="descriptionFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.descriptionFr")}
												</FormLabel>
												<FormControl>
													<Textarea rows={3} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="descriptionEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.descriptionEn")}
												</FormLabel>
												<FormControl>
													<Textarea rows={3} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Section 3: Contact & Location */}
						<Card>
							<CardHeader>
								<CardTitle>
									{t("admin.institution.sections.contact", {
										defaultValue: "Contact & Location",
									})}
								</CardTitle>
								<CardDescription>
									{t("admin.institution.sections.contactHint", {
										defaultValue:
											"Address, phone, email, and other contact details.",
									})}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="addressFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.addressFr")}
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
													{t("admin.institution.form.addressEn")}
												</FormLabel>
												<FormControl>
													<Textarea rows={2} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<FormField
										control={form.control}
										name="contactEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.contactEmail")}
												</FormLabel>
												<FormControl>
													<Input type="email" {...field} />
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
													{t("admin.institution.form.contactPhone")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="fax"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.institution.form.fax")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid gap-4 sm:grid-cols-3">
									<FormField
										control={form.control}
										name="postalBox"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.postalBox")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="website"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.website")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="timezone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.timezone")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Section 4: Media / Branding */}
						<Card>
							<CardHeader>
								<CardTitle>
									{t("admin.institution.sections.media", {
										defaultValue: "Media & Branding",
									})}
								</CardTitle>
								<CardDescription>
									{t("admin.institution.sections.mediaHint", {
										defaultValue:
											"Logo and cover image used on documents and the platform.",
									})}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="logoUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.institution.form.logoUrl")}
											</FormLabel>
											<ImageUploadField
												label={t("admin.institution.form.logoUploadLabel")}
												description={t(
													"admin.institution.form.logoUploadDescription",
												)}
												value={field.value}
												onChange={field.onChange}
												onClear={() => field.onChange("")}
												placeholder={t(
													"admin.institution.form.logoUrlPlaceholder",
													{ defaultValue: "https://..." },
												)}
											/>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="coverImageUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.institution.form.coverImageUrl")}
											</FormLabel>
											<ImageUploadField
												label={t("admin.institution.form.coverUploadLabel")}
												description={t(
													"admin.institution.form.coverUploadDescription",
												)}
												value={field.value}
												onChange={field.onChange}
												onClear={() => field.onChange("")}
												placeholder={t(
													"admin.institution.form.coverImageUrlPlaceholder",
													{ defaultValue: "https://..." },
												)}
											/>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Section 5: System Settings */}
						<Card>
							<CardHeader>
								<CardTitle>
									{t("admin.institution.sections.system", {
										defaultValue: "System Configuration",
									})}
								</CardTitle>
								<CardDescription>
									{t("admin.institution.sections.systemHint", {
										defaultValue:
											"Default academic year and registration number format.",
									})}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="defaultAcademicYearId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.defaultAcademicYear")}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(
															value === NO_SELECTION ? undefined : value,
														)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"admin.institution.form.defaultAcademicYearPlaceholder",
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t(
																"admin.institution.form.defaultAcademicYearPlaceholder",
															)}
														</SelectItem>
														{academicYears.map((year) => (
															<SelectItem key={year.id} value={year.id}>
																{year.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="registrationFormatId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.registrationFormat")}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(
															value === NO_SELECTION ? undefined : value,
														)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"admin.institution.form.registrationFormatPlaceholder",
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t(
																"admin.institution.form.registrationFormatPlaceholder",
															)}
														</SelectItem>
														{registrationFormats.map((format) => (
															<SelectItem key={format.id} value={format.id}>
																{format.name}
																{format.isActive
																	? ` (${t(
																			"admin.registrationNumbers.list.active",
																			{ defaultValue: "Active" },
																		)})`
																	: ""}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Save Bar */}
						<div className="sticky bottom-4 z-10 flex justify-end gap-3 rounded-lg border bg-card/95 px-6 py-4 shadow-lg backdrop-blur-sm">
							<Button
								type="button"
								variant="outline"
								onClick={() => form.reset(defaultValues)}
							>
								{t("common.actions.reset")}
							</Button>
							<Button type="submit" disabled={upsertMutation.isPending}>
								{upsertMutation.isPending && (
									<Spinner className="mr-2 h-4 w-4" />
								)}
								{t("admin.institution.actions.save")}
							</Button>
						</div>
					</form>
				</Form>
			)}

			{/* Document generation params — separate form saved to metadata */}
			{!institutionQuery.isLoading && institutionQuery.data && (
				<DocumentParamsCard
					institutionId={institutionQuery.data.id}
					initialParams={
						(institutionQuery.data.metadata as any)?.document_params ?? {}
					}
				/>
			)}
		</div>
	);
}

type DocParams = {
	signatoryName?: string;
	signatoryTitle?: string;
	city?: string;
};

function DocumentParamsCard({
	institutionId,
	initialParams,
}: {
	institutionId: string;
	initialParams: DocParams;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [params, setParams] = useState<DocParams>(initialParams);

	const update = (key: keyof DocParams, value: string) =>
		setParams((prev) => ({ ...prev, [key]: value }));

	const saveMutation = useMutation({
		mutationFn: async () => {
			await trpcClient.institutions.update.mutate({
				id: institutionId,
				data: {
					metadata: {
						document_params: {
							signatoryName: params.signatoryName || undefined,
							signatoryTitle: params.signatoryTitle || undefined,
							city: params.city || undefined,
						},
					},
				},
			});
		},
		onSuccess: () => {
			toast.success(
				t("admin.institution.toast.saved", {
					defaultValue: "Institution saved",
				}),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.institutions.get.queryKey(),
			});
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileSignature className="h-5 w-5" />
					{t("admin.institution.sections.documentParams", {
						defaultValue: "Document Generation",
					})}
				</CardTitle>
				<CardDescription>
					{t("admin.institution.sections.documentParamsHint", {
						defaultValue:
							"Signatory and city used on generated diplomas, attestations and transcripts. Automatically synced to Diplomation.",
					})}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-1.5">
						<label className="font-medium text-sm">
							{t("admin.institution.form.signatoryName", {
								defaultValue: "Signatory name",
							})}
						</label>
						<Input
							value={params.signatoryName ?? ""}
							onChange={(e) => update("signatoryName", e.target.value)}
							placeholder="Dr. Jean DUPONT"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="font-medium text-sm">
							{t("admin.institution.form.signatoryTitle", {
								defaultValue: "Signatory title",
							})}
						</label>
						<Input
							value={params.signatoryTitle ?? ""}
							onChange={(e) => update("signatoryTitle", e.target.value)}
							placeholder="Directeur Général"
						/>
					</div>
				</div>
				<div className="max-w-sm space-y-1.5">
					<label className="font-medium text-sm">
						{t("admin.institution.form.city", {
							defaultValue: "City (for document date line)",
						})}
					</label>
					<Input
						value={params.city ?? ""}
						onChange={(e) => update("city", e.target.value)}
						placeholder="Yaoundé"
					/>
				</div>
				<div className="flex justify-end">
					<Button
						type="button"
						disabled={saveMutation.isPending}
						onClick={() => saveMutation.mutate()}
					>
						{saveMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
						{t("common.actions.save")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
