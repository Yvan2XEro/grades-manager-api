import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Landmark, UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
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
import { cn } from "@/lib/utils";
import { trpc, trpcClient } from "@/utils/trpc";

const institutionSchema = z.object({
	code: z.string().min(1),
	shortName: z.string().optional(),
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
	defaultAcademicYearId: z.string().optional(),
	registrationFormatId: z.string().optional(),
	timezone: z.string().optional(),
});

type InstitutionFormValues = z.infer<typeof institutionSchema>;

const NO_SELECTION = "__NONE__";

const defaultValues: InstitutionFormValues = {
	code: "",
	shortName: "",
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
	defaultAcademicYearId: undefined,
	registrationFormatId: undefined,
	timezone: "UTC",
};

const fileToBase64 = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			const base64 = result.includes(",")
				? (result.split(",").pop() ?? "")
				: result;
			resolve(base64);
		};
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});

type ImageUploadProps = {
	label: string;
	description: string;
	value?: string;
	onChange: (url: string) => void;
	onClear: () => void;
	placeholder: string;
};

function ImageUploadField({
	label,
	description,
	value,
	onChange,
	onClear,
	placeholder,
}: ImageUploadProps) {
	const { t } = useTranslation();
	const [preview, setPreview] = useState(value ?? "");
	const [isUploading, setIsUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setPreview(value ?? "");
	}, [value]);

	const handleUpload = async (file?: File) => {
		if (!file) return;
		setIsUploading(true);
		try {
			const base64 = await fileToBase64(file);
			const upload = await trpcClient.files.upload.mutate({
				filename: file.name,
				mimeType: file.type || "application/octet-stream",
				base64,
			});
			onChange(upload.url);
			setPreview(upload.url);
			toast.success(
				t("admin.institution.form.uploadSuccess", {
					defaultValue: "Image uploaded",
				}),
			);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: t("admin.institution.form.uploadError", {
							defaultValue: "Upload failed",
						});
			toast.error(message);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		const file = event.dataTransfer.files?.[0];
		void handleUpload(file);
	};

	return (
		<div className="space-y-3 rounded-lg border bg-card p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="font-medium text-foreground">{label}</p>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
				{preview && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => {
							onClear();
							setPreview("");
						}}
					>
						{t("admin.institution.form.clearImage", {
							defaultValue: "Remove image",
						})}
					</Button>
				)}
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="flex h-48 items-center justify-center rounded-md border bg-muted/30">
					{preview ? (
						<img
							src={preview}
							alt={label}
							className="h-full w-full rounded-md object-contain"
						/>
					) : (
						<p className="text-muted-foreground text-sm">
							{t("admin.institution.form.previewPlaceholder", {
								defaultValue: "No image yet",
							})}
						</p>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<div
						onClick={() => inputRef.current?.click()}
						onDragOver={(event) => {
							event.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={(event) => {
							event.preventDefault();
							setIsDragging(false);
						}}
						onDrop={handleDrop}
						className={cn(
							"flex flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center font-medium text-foreground text-sm transition hover:border-primary focus:outline-none",
							isDragging && "border-primary bg-primary/5",
						)}
					>
						<UploadIcon className="h-6 w-6 text-primary" />
						<p>
							{t("admin.institution.form.uploadCta", {
								defaultValue: "Select or drop an image",
							})}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("admin.institution.form.uploadHint", {
								defaultValue: "PNG/JPG up to 5 MB",
							})}
						</p>
						{isUploading && (
							<p className="text-primary text-xs">
								{t("admin.institution.form.uploading", {
									defaultValue: "Uploading…",
								})}
							</p>
						)}
					</div>
					<p className="text-muted-foreground text-xs">
						{t("admin.institution.form.uploadDescription", {
							defaultValue:
								"You can still paste a public URL below if you host assets elsewhere.",
						})}
					</p>
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(event) => {
							const file = event.target.files?.[0];
							void handleUpload(file);
							event.target.value = "";
						}}
					/>
				</div>
			</div>
			<Input
				value={value ?? ""}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
			/>
		</div>
	);
}

export default function InstitutionSettings() {
	const { t } = useTranslation();
	const institutionQuery = useQuery(trpc.institutions.get.queryOptions());
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
			const { defaultAcademicYearId, registrationFormatId, ...rest } =
				institutionQuery.data;
			const normalized: InstitutionFormValues = {
				...defaultValues,
				...rest,
				defaultAcademicYearId: defaultAcademicYearId ?? undefined,
				registrationFormatId: registrationFormatId ?? undefined,
				contactEmail: rest.contactEmail ?? "",
				contactPhone: rest.contactPhone ?? "",
				fax: rest.fax ?? "",
				postalBox: rest.postalBox ?? "",
				website: rest.website ?? "",
				logoUrl: rest.logoUrl ?? "",
				coverImageUrl: rest.coverImageUrl ?? "",
				shortName: rest.shortName ?? "",
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
				contactEmail: values.contactEmail || undefined,
				website: values.website || undefined,
				logoUrl: values.logoUrl || undefined,
				coverImageUrl: values.coverImageUrl || undefined,
				registrationFormatId: values.registrationFormatId || undefined,
				defaultAcademicYearId: values.defaultAcademicYearId || undefined,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.institution.toast.saved", {
					defaultValue: "Institution saved",
				}),
			);
			institutionQuery.refetch();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const onSubmit = (values: InstitutionFormValues) => {
		upsertMutation.mutate(values);
	};

	const registrationFormats = registrationFormatsQuery.data ?? [];
	const academicYears = yearsQuery.data?.items ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Landmark className="h-10 w-10 text-primary-600" />
				<div>
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("admin.institution.title", {
							defaultValue: "Institution settings",
						})}
					</h1>
					<p className="text-gray-600">
						{t("admin.institution.subtitle", {
							defaultValue:
								"Configure the bilingual identity, branding, and official contacts for generated documents.",
						})}
					</p>
				</div>
			</div>

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
				<CardContent>
					{institutionQuery.isLoading ? (
						<div className="flex h-40 items-center justify-center">
							<Spinner className="h-8 w-8" />
						</div>
					) : (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="code"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
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
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="nameFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
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
												<FormLabel>
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

								<div className="grid gap-4 md:grid-cols-2">
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
								</div>

								<div className="grid gap-4 md:grid-cols-3">
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

								<div className="grid gap-4 md:grid-cols-2">
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
								</div>

								<div className="grid gap-4 md:grid-cols-2">
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
								</div>

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

								<div className="flex justify-end gap-3">
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
				</CardContent>
			</Card>
		</div>
	);
}
