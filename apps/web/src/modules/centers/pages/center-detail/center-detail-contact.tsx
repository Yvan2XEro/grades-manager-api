import { useTranslation } from "react-i18next";
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
import { CenterSaveButton } from "../../components/center-save-button";
import { useCenterContext } from "../../hooks/use-center-context";

export default function CenterDetailContact() {
	const { t } = useTranslation();
	const { form } = useCenterContext();

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
			<CenterSaveButton />
		</div>
	);
}
