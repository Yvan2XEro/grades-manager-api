import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ImageUploadField } from "@/components/inputs/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCenterContext } from "./CenterContext";

export default function CenterLogosTab() {
	const { t } = useTranslation();
	const { form, isSaving, onSubmit } = useCenterContext();

	return (
		<div className="space-y-6 pt-6 pb-12">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">
						{t("admin.centers.sections.logos", { defaultValue: "Logos" })}
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<div className="space-y-3">
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
							name="logoSvg"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("admin.centers.form.logoSvg", {
											defaultValue: "…ou code SVG (prioritaire)",
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
					</div>
					<div className="space-y-3">
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
							name="adminInstanceLogoSvg"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("admin.centers.form.adminInstanceLogoSvg", {
											defaultValue: "…ou code SVG (prioritaire)",
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
					</div>
					<div className="space-y-3">
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
						<FormField
							control={form.control}
							name="watermarkLogoSvg"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("admin.centers.form.watermarkLogoSvg", {
											defaultValue: "…ou code SVG (prioritaire)",
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
					</div>
				</CardContent>
			</Card>
			<div className="flex justify-end">
				<Button
					type="button"
					disabled={isSaving}
					onClick={form.handleSubmit(onSubmit)}
				>
					<Save className="mr-2 h-4 w-4" />
					{t("common.actions.save", { defaultValue: "Enregistrer" })}
				</Button>
			</div>
		</div>
	);
}
