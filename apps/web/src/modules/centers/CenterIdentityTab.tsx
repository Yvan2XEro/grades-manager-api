import { Save } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCenterContext } from "./CenterContext";

export default function CenterIdentityTab() {
	const { t } = useTranslation();
	const { form, isSaving, onSubmit } = useCenterContext();

	return (
		<div className="space-y-6 pt-6 pb-12">
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
