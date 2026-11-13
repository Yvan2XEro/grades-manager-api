import { Plus, Save, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCenterContext } from "./CenterContext";

export default function CenterInstancesTab() {
	const { t } = useTranslation();
	const { form, isSaving, onSubmit } = useCenterContext();

	const instances = useFieldArray({
		control: form.control,
		name: "administrativeInstances",
	});

	return (
		<div className="space-y-6 pt-6 pb-12">
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
								logoSvg: "",
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
								<FormField
									control={form.control}
									name={`administrativeInstances.${index}.logoSvg`}
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
								<div className="grid gap-3 md:grid-cols-2">
									<FormField
										control={form.control}
										name={`administrativeInstances.${index}.showOnTranscripts`}
										render={({ field }) => (
											<FormItem className="flex items-center justify-between rounded-md border bg-background p-3">
												<div className="space-y-0.5">
													<FormLabel className="text-sm">
														{t("admin.centers.form.showOnTranscripts", {
															defaultValue: "Afficher le logo sur les relevés",
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
