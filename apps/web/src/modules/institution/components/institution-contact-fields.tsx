import { useTranslation } from "react-i18next";
import { ImageUploadField } from "@/components/inputs/ImageUploadField";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { InstitutionForm } from "../hooks/use-institution-form";
import {
	type InstitutionFormVariant,
	InstitutionTextField,
} from "./institution-form-section";

/** Addresses, email, phone, fax, postal box, website and timezone. */
export function InstitutionContactFields({ form }: { form: InstitutionForm }) {
	const { t } = useTranslation();
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<InstitutionTextField
					form={form}
					name="addressFr"
					rows={2}
					label={t("admin.institution.form.addressFr", {
						defaultValue: "Address (French)",
					})}
				/>
				<InstitutionTextField
					form={form}
					name="addressEn"
					rows={2}
					label={t("admin.institution.form.addressEn", {
						defaultValue: "Address (English)",
					})}
				/>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<InstitutionTextField
					form={form}
					name="contactEmail"
					type="email"
					label={t("admin.institution.form.contactEmail", {
						defaultValue: "Email",
					})}
				/>
				<InstitutionTextField
					form={form}
					name="contactPhone"
					label={t("admin.institution.form.contactPhone", {
						defaultValue: "Phone",
					})}
				/>
				<InstitutionTextField
					form={form}
					name="fax"
					label={t("admin.institution.form.fax", { defaultValue: "Fax" })}
				/>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<InstitutionTextField
					form={form}
					name="postalBox"
					label={t("admin.institution.form.postalBox", {
						defaultValue: "Postal box",
					})}
				/>
				<InstitutionTextField
					form={form}
					name="website"
					label={t("admin.institution.form.website", {
						defaultValue: "Website",
					})}
				/>
				<InstitutionTextField
					form={form}
					name="timezone"
					label={t("admin.institution.form.timezone", {
						defaultValue: "Timezone",
					})}
				/>
			</div>
		</>
	);
}

/** Logo (image or SVG code) and cover image. */
export function InstitutionMediaFields({
	form,
	variant,
}: {
	form: InstitutionForm;
	variant: InstitutionFormVariant;
}) {
	const { t } = useTranslation();
	const isPage = variant === "page";
	return (
		<>
			<FormField
				control={form.control}
				name="logoUrl"
				render={({ field }) => (
					<FormItem>
						{isPage && (
							<FormLabel>{t("admin.institution.form.logoUrl")}</FormLabel>
						)}
						<ImageUploadField
							label={t("admin.institution.form.logoUploadLabel", {
								defaultValue: "Logo",
							})}
							description={t("admin.institution.form.logoUploadDescription", {
								defaultValue: "Used on document headers and diplomas.",
							})}
							value={field.value}
							onChange={field.onChange}
							onClear={() => field.onChange("")}
							placeholder={t("admin.institution.form.logoUrlPlaceholder", {
								defaultValue: "https://...",
							})}
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
						<FormLabel className={isPage ? undefined : "text-xs"}>
							{t("admin.institution.form.logoSvg", {
								defaultValue: isPage
									? "Logo SVG (code source)"
									: "…ou code SVG (utilisé en priorité sur les exports)",
							})}
						</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								value={field.value ?? ""}
								rows={isPage ? 5 : 4}
								placeholder={
									isPage
										? '<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>'
										: "<svg ...>...</svg>"
								}
								className="font-mono text-xs"
							/>
						</FormControl>
						{isPage && (
							<FormDescription>
								{t("admin.institution.form.logoSvgHint", {
									defaultValue:
										"Si renseigné, le SVG est utilisé en priorité sur les exports (en place du logo PNG/URL).",
								})}
							</FormDescription>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="coverImageUrl"
				render={({ field }) => (
					<FormItem>
						{isPage && (
							<FormLabel>{t("admin.institution.form.coverImageUrl")}</FormLabel>
						)}
						<ImageUploadField
							label={t("admin.institution.form.coverUploadLabel", {
								defaultValue: "Cover image",
							})}
							description={t("admin.institution.form.coverUploadDescription", {
								defaultValue: "Background image used on the platform.",
							})}
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
		</>
	);
}
