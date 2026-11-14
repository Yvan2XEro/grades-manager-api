import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { QuickCreate } from "@/components/callable/quick-create";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { AcademicYearFormDialog } from "@/modules/academic-years/components/academic-year-form-dialog";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

const NO_SELECTION = "__NONE__";

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
	logoSvg: z.string().optional().or(z.literal("")),
	coverImageUrl: z.string().url().optional().or(z.literal("")),
	parentInstitutionId: z.string().optional(),
	institutionId: z.string().optional(),
	timezone: z.string().optional(),
	defaultAcademicYearId: z.string().optional(),
	registrationFormatId: z.string().optional(),
});

type FormValues = z.infer<typeof institutionSchema>;

const defaultValues: FormValues = {
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

export type Institution = {
	id: string;
	code: string;
	nameFr: string;
	nameEn: string;
	shortName: string | null;
	abbreviation: string | null;
	type: string;
	legalNameFr: string | null;
	legalNameEn: string | null;
	sloganFr: string | null;
	sloganEn: string | null;
	descriptionFr: string | null;
	descriptionEn: string | null;
	addressFr: string | null;
	addressEn: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	fax: string | null;
	postalBox: string | null;
	website: string | null;
	logoUrl: string | null;
	logoSvg: string | null;
	coverImageUrl: string | null;
	parentInstitutionId: string | null;
	institutionId: string | null;
	timezone: string | null;
	defaultAcademicYearId?: string | null;
	registrationFormatId?: string | null;
};

export type InstitutionFormResult = RouterOutputs["institutions"]["create"];

/**
 * Creates or edits an institution (university, institution or faculty). The
 * parent institution and default academic year can be created in place from
 * the "+" next to their select — the parent with this same form, nested.
 */
export const InstitutionFormDialog = createCallable<
	{ institution?: Institution; defaults?: Partial<FormValues> },
	InstitutionFormResult | undefined
>(({ call, institution, defaults }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const editingInstitution = institution ?? null;

	const form = useForm<FormValues>({
		resolver: zodResolver(institutionSchema),
		defaultValues: institution
			? {
					code: institution.code,
					type: institution.type as "university" | "institution" | "faculty",
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
				}
			: { ...defaultValues, ...defaults },
	});

	const { data: allInstitutions } = useQuery(
		trpc.institutions.list.queryOptions(),
	);
	const yearsQuery = useQuery(
		trpc.academicYears.list.queryOptions({ limit: 100 }),
	);
	const formatsQuery = useQuery(
		trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
	);

	const institutions = useMemo(
		() => (allInstitutions ?? []) as Institution[],
		[allInstitutions],
	);
	const years = useMemo(
		() => (yearsQuery.data?.items ?? []) as Array<{ id: string; name: string }>,
		[yearsQuery.data],
	);
	const formats = useMemo(
		() =>
			(formatsQuery.data ?? []) as Array<{
				id: string;
				name: string;
				isActive: boolean;
			}>,
		[formatsQuery.data],
	);

	const watchedParentId = form.watch("parentInstitutionId");

	useEffect(() => {
		if (!watchedParentId) return;
		const parent = institutions.find((i) => i.id === watchedParentId);
		if (!parent) return;

		// Fields to inherit from the parent (only contact / location / config)
		const inherited: Partial<FormValues> = {
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
			form.setValue(key as keyof FormValues, value as never, {
				shouldDirty: true,
			});
		}
	}, [watchedParentId, institutions, form]);

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: trpc.institutions.list.queryKey(),
		});

	const createParentInstitution = async () => {
		const parent = await InstitutionFormDialog.call({
			defaults: { type: "university" },
		});
		if (!parent) return;
		queryClient.setQueryData<Institution[]>(
			trpc.institutions.list.queryKey() as readonly unknown[],
			(old) => upsertInList(old ?? [], parent as Institution),
		);
		form.setValue("parentInstitutionId", parent.id, { shouldValidate: true });
	};

	const createAcademicYear = async () => {
		const year = await AcademicYearFormDialog.call({});
		if (!year) return;
		await queryClient.invalidateQueries({
			queryKey: trpc.academicYears.list.queryKey(),
		});
		form.setValue(
			"defaultAcademicYearId" as keyof FormValues,
			year.id as never,
		);
	};

	const submit = useMutationFlow(call, async (call, values: FormValues) => {
		try {
			const shared = {
				...values,
				contactEmail: values.contactEmail || undefined,
				website: values.website || undefined,
				logoUrl: values.logoUrl || undefined,
				logoSvg: values.logoSvg || undefined,
				coverImageUrl: values.coverImageUrl || undefined,
				parentInstitutionId: values.parentInstitutionId || undefined,
				institutionId: values.institutionId || undefined,
			};
			const saved = editingInstitution
				? await trpcClient.institutions.update.mutate({
						id: editingInstitution.id,
						data: {
							...shared,
							defaultAcademicYearId: values.defaultAcademicYearId || undefined,
							registrationFormatId: values.registrationFormatId || undefined,
						},
					})
				: await trpcClient.institutions.create.mutate(shared);
			toast.success(
				editingInstitution
					? t("admin.institutions.toast.updateSuccess", {
							defaultValue: "Institution updated",
						})
					: t("admin.institutions.toast.createSuccess", {
							defaultValue: "Institution created",
						}),
			);
			invalidate();
			call.end(saved as InstitutionFormResult);
		} catch (error) {
			toast.error((error as Error).message);
		}
	});
	const isSaving = submit.pending;

	const typeLabel = (type: string) => {
		switch (type) {
			case "university":
				return t("admin.institution.form.typeUniversity", {
					defaultValue: "University",
				});
			case "faculty":
				return t("admin.institution.form.typeFaculty", {
					defaultValue: "Faculty/School",
				});
			case "institution":
				return t("admin.institution.form.typeInstitution", {
					defaultValue: "Institution",
				});
			default:
				return type;
		}
	};

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={isSaving}
			className="sm:max-w-5xl"
			contentClassName="max-h-[calc(90vh-8rem)]"
			title={
				editingInstitution
					? t("admin.institutions.form.editTitle", {
							defaultValue: "Edit institution",
						})
					: t("admin.institutions.form.createTitle", {
							defaultValue: "Create institution",
						})
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-6 pt-2">
					{/* Identity */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">
								{t("admin.institution.form.identity", {
									defaultValue: "Identity",
								})}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-4">
								<FormField
									control={form.control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												{t("admin.institution.form.code", {
													defaultValue: "Code",
												})}
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
												{t("admin.institution.form.shortName", {
													defaultValue: "Short name",
												})}
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
														<SelectValue />
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
											<QuickCreate
												onCreate={createParentInstitution}
												label={t("admin.institutions.actions.add", {
													defaultValue: "Add institution",
												})}
											>
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
															<SelectValue />
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
																(inst) => inst.id !== editingInstitution?.id,
															)
															.map((inst) => (
																<SelectItem key={inst.id} value={inst.id}>
																	{inst.nameFr} ({typeLabel(inst.type)})
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</QuickCreate>
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
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={NO_SELECTION}>
														{t("admin.institution.form.noSupervisingFaculty", {
															defaultValue: "None",
														})}
													</SelectItem>
													{institutions
														.filter(
															(inst) =>
																inst.type === "faculty" &&
																inst.id !== editingInstitution?.id,
														)
														.map((inst) => (
															<SelectItem key={inst.id} value={inst.id}>
																{inst.nameFr}
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

					{/* Names */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">
								{t("admin.institution.sections.names", {
									defaultValue: "Names & Legal Identity",
								})}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="nameFr"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												{t("admin.institution.form.nameFr", {
													defaultValue: "Name (French)",
												})}
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
												{t("admin.institution.form.nameEn", {
													defaultValue: "Name (English)",
												})}
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
												{t("admin.institution.form.legalNameFr", {
													defaultValue: "Legal name (French)",
												})}
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
												{t("admin.institution.form.legalNameEn", {
													defaultValue: "Legal name (English)",
												})}
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
												{t("admin.institution.form.sloganFr", {
													defaultValue: "Slogan (French)",
												})}
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
												{t("admin.institution.form.sloganEn", {
													defaultValue: "Slogan (English)",
												})}
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
												{t("admin.institution.form.descriptionFr", {
													defaultValue: "Description (French)",
												})}
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
												{t("admin.institution.form.descriptionEn", {
													defaultValue: "Description (English)",
												})}
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

					{/* Contact */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">
								{t("admin.institution.sections.contact", {
									defaultValue: "Contact & Location",
								})}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="addressFr"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.institution.form.addressFr", {
													defaultValue: "Address (French)",
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
												{t("admin.institution.form.addressEn", {
													defaultValue: "Address (English)",
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
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								<FormField
									control={form.control}
									name="contactEmail"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.institution.form.contactEmail", {
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
								<FormField
									control={form.control}
									name="contactPhone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.institution.form.contactPhone", {
													defaultValue: "Phone",
												})}
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
											<FormLabel>
												{t("admin.institution.form.fax", {
													defaultValue: "Fax",
												})}
											</FormLabel>
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
												{t("admin.institution.form.postalBox", {
													defaultValue: "Postal box",
												})}
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
												{t("admin.institution.form.website", {
													defaultValue: "Website",
												})}
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
												{t("admin.institution.form.timezone", {
													defaultValue: "Timezone",
												})}
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

					{/* Media */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">
								{t("admin.institution.sections.media", {
									defaultValue: "Media & Branding",
								})}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="logoUrl"
								render={({ field }) => (
									<FormItem>
										<ImageUploadField
											label={t("admin.institution.form.logoUploadLabel", {
												defaultValue: "Logo",
											})}
											description={t(
												"admin.institution.form.logoUploadDescription",
												{
													defaultValue:
														"Used on document headers and diplomas.",
												},
											)}
											value={field.value}
											onChange={field.onChange}
											onClear={() => field.onChange("")}
											placeholder={t(
												"admin.institution.form.logoUrlPlaceholder",
												{
													defaultValue: "https://...",
												},
											)}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="logoSvg"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">
											{t("admin.institution.form.logoSvg", {
												defaultValue:
													"…ou code SVG (utilisé en priorité sur les exports)",
											})}
										</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												value={field.value ?? ""}
												rows={4}
												placeholder="<svg ...>...</svg>"
												className="font-mono text-xs"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="coverImageUrl"
								render={({ field }) => (
									<FormItem>
										<ImageUploadField
											label={t("admin.institution.form.coverUploadLabel", {
												defaultValue: "Cover image",
											})}
											description={t(
												"admin.institution.form.coverUploadDescription",
												{
													defaultValue:
														"Background image used on the platform.",
												},
											)}
											value={field.value}
											onChange={field.onChange}
											onClear={() => field.onChange("")}
											placeholder={t(
												"admin.institution.form.coverImageUrlPlaceholder",
												{
													defaultValue: "https://...",
												},
											)}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* System Configuration */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">
								{t("admin.institution.sections.system", {
									defaultValue: "System Configuration",
								})}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="defaultAcademicYearId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.institution.form.defaultAcademicYear", {
													defaultValue: "Default academic year",
												})}
											</FormLabel>
											<QuickCreate
												onCreate={createAcademicYear}
												label={t("admin.academicYears.actions.add")}
											>
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
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t("admin.institution.form.noDefaultYear", {
																defaultValue: "None",
															})}
														</SelectItem>
														{years.map((year) => (
															<SelectItem key={year.id} value={year.id}>
																{year.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</QuickCreate>
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
												{t("admin.institution.form.registrationFormat", {
													defaultValue: "Registration format",
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
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={NO_SELECTION}>
														{t("admin.institution.form.noRegistrationFormat", {
															defaultValue: "None",
														})}
													</SelectItem>
													{formats.map((fmt) => (
														<SelectItem key={fmt.id} value={fmt.id}>
															{fmt.name}
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

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="ghost"
							type="button"
							disabled={isSaving}
							onClick={() => call.end(undefined)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={isSaving}>
							{isSaving
								? t("common.actions.saving")
								: editingInstitution
									? t("common.actions.save")
									: t("admin.institutions.form.submit", {
											defaultValue: "Create",
										})}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
