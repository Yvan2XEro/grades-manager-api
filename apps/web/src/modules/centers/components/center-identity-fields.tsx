import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { CenterForm } from "../hooks/use-center-form";

/** Code, names, city and status of a center (create page and identity tab). */
export function CenterIdentityFields({
	form,
}: {
	form: UseFormReturn<CenterForm>;
}) {
	const { t } = useTranslation();
	return (
		<>
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
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>
		</>
	);
}
