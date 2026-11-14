import { useWatch } from "react-hook-form";
import {
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
import { BAC_SERIES_CMR, GCE_COMBOS } from "../services/cameroon-data";
import type { ApplicationWizardForm } from "../types";
import { OptionalBadge } from "./optional-badge";

/** Step 3 — entry diploma (baccalauréat / GCE). */
export function ApplicationStepBac({
	form,
	t,
}: {
	form: ApplicationWizardForm;
	t: (k: string) => string;
}) {
	const diplomaType = useWatch({
		control: form.control,
		name: "entryDiplomaType",
	});
	const isCmrBac = diplomaType === "bac_camerounais";
	const isGce = diplomaType === "gce_alevel";
	const seriesOptions = isCmrBac ? BAC_SERIES_CMR : isGce ? GCE_COMBOS : [];

	return (
		<div className="grid gap-5 md:grid-cols-2">
			<div className="md:col-span-2">
				<FormField
					control={form.control}
					name="entryDiplomaType"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.entryDiplomaType")}
							</FormLabel>
							<Select
								onValueChange={(v) => {
									field.onChange(v);
									form.setValue("bacSeries", "");
								}}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{[
										"bac_camerounais",
										"gce_alevel",
										"equivalent_etranger",
										"autre",
									].map((v) => (
										<SelectItem key={v} value={v}>
											{t(`admissions.options.diplomaType.${v}`)}
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
				name="bacSeries"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacSeries")}</FormLabel>
						{seriesOptions.length > 0 ? (
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{seriesOptions.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<FormControl>
								<Input {...field} placeholder="Ex : C, D, A-Level..." />
							</FormControl>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacYear"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacYear")}</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={1990}
								max={new Date().getFullYear()}
								{...field}
								placeholder="Ex : 2023"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacMention"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacMention")}</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{["tres_bien", "bien", "assez_bien", "passable", "admis"].map(
									(v) => (
										<SelectItem key={v} value={v}>
											{t(`admissions.options.bacMention.${v}`)}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacAverage"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.bacAverage")} <OptionalBadge label="opt." />
						</FormLabel>
						<FormControl>
							<Input
								type="number"
								step="0.01"
								min={0}
								max={20}
								{...field}
								placeholder="Ex : 12.50"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacInstitution"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.bacInstitution")}
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : Lycée Général Leclerc" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacCountry"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacCountry")}</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacMatricule"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.bacMatricule")}{" "}
							<OptionalBadge label="opt." />
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="N° matricule OBC" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
