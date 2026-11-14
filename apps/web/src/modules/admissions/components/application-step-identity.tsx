import { Checkbox } from "@/components/ui/checkbox";
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
import type { ApplicationWizardForm } from "../types";

import { OptionalBadge } from "./optional-badge";

/** Step 1 — civil status of the applicant. */
export function ApplicationStepIdentity({
	form,
	t,
}: {
	form: ApplicationWizardForm;
	t: (k: string) => string;
}) {
	return (
		<div className="grid gap-5 md:grid-cols-2">
			<FormField
				control={form.control}
				name="lastName"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.lastName")}</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : MBALLA" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="firstName"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.firstName")}</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : Jean-Paul" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="gender"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.gender")}</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="masculin">
									{t("admissions.options.gender.masculin")}
								</SelectItem>
								<SelectItem value="feminin">
									{t("admissions.options.gender.feminin")}
								</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="maritalStatus"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.maritalStatus")}
						</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{["celibataire", "marie", "divorce", "veuf"].map((v) => (
									<SelectItem key={v} value={v}>
										{t(`admissions.options.maritalStatus.${v}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="space-y-2 md:col-span-2">
				<FormField
					control={form.control}
					name="dateOfBirth"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.dateOfBirth")}
							</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="exactDateOfBirth"
					render={({ field }) => (
						<FormItem className="flex items-center gap-2 space-y-0">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormLabel className="font-normal text-muted-foreground">
								{t("admissions.fields.exactDateOfBirth")}
							</FormLabel>
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="placeOfBirth"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.placeOfBirth")}
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : Yaoundé" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="countryOfBirth"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.countryOfBirth")}{" "}
							<OptionalBadge label="opt." />
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
				name="idCardNumber"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.idCardNumber")}
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : 123456789" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="primaryLanguage"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.primaryLanguage")}{" "}
							<OptionalBadge label="opt." />
						</FormLabel>
						<Select onValueChange={field.onChange} value={field.value ?? ""}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="francais">
									{t("admissions.options.language.francais")}
								</SelectItem>
								<SelectItem value="anglais">
									{t("admissions.options.language.anglais")}
								</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="employmentStatus"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.employmentStatus")}{" "}
							<OptionalBadge label="opt." />
						</FormLabel>
						<Select onValueChange={field.onChange} value={field.value ?? ""}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{[
									"sans_emploi",
									"employe",
									"fonctionnaire",
									"commercant",
									"autre",
								].map((v) => (
									<SelectItem key={v} value={v}>
										{t(`admissions.options.employmentStatus.${v}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="hasDisability"
				render={({ field }) => (
					<FormItem className="flex items-center gap-2 space-y-0 self-end pb-1">
						<FormControl>
							<Checkbox
								checked={field.value}
								onCheckedChange={field.onChange}
							/>
						</FormControl>
						<FormLabel className="font-normal">
							{t("admissions.fields.hasDisability")}
						</FormLabel>
					</FormItem>
				)}
			/>
		</div>
	);
}
