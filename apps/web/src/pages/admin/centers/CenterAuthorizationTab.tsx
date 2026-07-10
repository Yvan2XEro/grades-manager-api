import { Plus, Save, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
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

export default function CenterAuthorizationTab() {
	const { t } = useTranslation();
	const { form, isSaving, onSubmit } = useCenterContext();

	const legalTexts = useFieldArray({
		control: form.control,
		name: "legalTexts",
	});

	return (
		<div className="space-y-6 pt-6 pb-12">
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
