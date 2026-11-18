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
import { CenterLogoField } from "./center-logo-field";

/** Fields of one administrative instance (names, acronyms, logo, visibility). */
export function CenterInstanceFields({
	form,
	index,
}: {
	form: UseFormReturn<CenterForm>;
	index: number;
}) {
	const { t } = useTranslation();
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name={`administrativeInstances.${index}.nameFr`}
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admin.centers.adminInstances.nameFr")}
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
					name={`administrativeInstances.${index}.nameEn`}
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admin.centers.adminInstances.nameEn")}
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
					name={`administrativeInstances.${index}.acronymFr`}
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("admin.centers.adminInstances.acronymFr")}
							</FormLabel>
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
							<FormLabel>
								{t("admin.centers.adminInstances.acronymEn")}
							</FormLabel>
							<FormControl>
								<Input {...field} placeholder="MINEFOP" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<CenterLogoField
				form={form}
				className="space-y-4"
				urlName={`administrativeInstances.${index}.logoUrl`}
				svgName={`administrativeInstances.${index}.logoSvg`}
				label={t("admin.centers.form.adminInstanceLogo")}
				description=""
				svgLabel={t("admin.centers.form.adminInstanceLogoSvg")}
			/>
			<div className="grid gap-3 md:grid-cols-2">
				<FormField
					control={form.control}
					name={`administrativeInstances.${index}.showOnTranscripts`}
					render={({ field }) => (
						<FormItem className="flex items-center justify-between rounded-md border bg-background p-3">
							<div className="space-y-0.5">
								<FormLabel className="text-sm">
									{t("admin.centers.form.showOnTranscripts")}
								</FormLabel>
								<p className="text-muted-foreground text-xs">
									{t("admin.centers.form.showOnTranscriptsHint")}
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
									{t("admin.centers.form.showOnCertificates")}
								</FormLabel>
								<p className="text-muted-foreground text-xs">
									{t("admin.centers.form.showOnCertificatesHint")}
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
		</>
	);
}
