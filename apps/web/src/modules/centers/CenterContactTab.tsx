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
import { Textarea } from "@/components/ui/textarea";
import { useCenterContext } from "./CenterContext";

export default function CenterContactTab() {
	const { t } = useTranslation();
	const { form, isSaving, onSubmit } = useCenterContext();

	return (
		<div className="space-y-6 pt-6 pb-12">
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
