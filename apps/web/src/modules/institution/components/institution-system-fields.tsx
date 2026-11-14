import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type InstitutionForm,
	NO_SELECTION,
	useInstitutionSystemOptions,
} from "../hooks/use-institution-form";

/** Default academic year and registration format selects (dialog). */
export function InstitutionSystemFields({
	form,
	onCreateAcademicYear,
}: {
	form: InstitutionForm;
	onCreateAcademicYear: () => Promise<void>;
}) {
	const { t } = useTranslation();
	const { years, formats } = useInstitutionSystemOptions();

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<FormField
				control={form.control}
				name="defaultAcademicYearId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admin.institution.form.defaultAcademicYear", {
								defaultValue: "Default academic year",
							})}
						</FormLabel>
						<QuickCreate
							onCreate={onCreateAcademicYear}
							label={t("admin.academicYears.actions.add")}
						>
							<Select
								value={field.value ?? NO_SELECTION}
								onValueChange={(value) =>
									field.onChange(value === NO_SELECTION ? undefined : value)
								}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={NO_SELECTION}>
										{t("admin.institution.form.noDefaultYear", {
											defaultValue: "None",
										})}
									</SelectItem>
									{years.map((year) => (
										<SelectItem key={year.id} value={year.id}>
											{year.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</QuickCreate>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="registrationFormatId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admin.institution.form.registrationFormat", {
								defaultValue: "Registration format",
							})}
						</FormLabel>
						<Select
							value={field.value ?? NO_SELECTION}
							onValueChange={(value) =>
								field.onChange(value === NO_SELECTION ? undefined : value)
							}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value={NO_SELECTION}>
									{t("admin.institution.form.noRegistrationFormat", {
										defaultValue: "None",
									})}
								</SelectItem>
								{formats.map((fmt) => (
									<SelectItem key={fmt.id} value={fmt.id}>
										{fmt.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}

/** Read-only active academic year and registration format (settings page). */
export function InstitutionSystemSummary() {
	const { t } = useTranslation();
	const { activeYear, activeFormat } = useInstitutionSystemOptions();

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<div className="space-y-2 rounded-lg border p-4">
				<p className="font-medium text-sm">
					{t("admin.institution.form.defaultAcademicYear")}
				</p>
				<p className="text-sm">
					{activeYear?.name ??
						t("admin.institution.form.defaultAcademicYearPlaceholder")}
				</p>
				<p className="text-muted-foreground text-xs">
					{t("admin.institution.form.defaultAcademicYearManagedHint", {
						defaultValue:
							"Manage the active academic year from Academic Years.",
					})}
				</p>
			</div>
			<div className="space-y-2 rounded-lg border p-4">
				<p className="font-medium text-sm">
					{t("admin.institution.form.registrationFormat")}
				</p>
				<p className="text-sm">
					{activeFormat?.name ??
						t("admin.institution.form.registrationFormatPlaceholder")}
				</p>
				<p className="text-muted-foreground text-xs">
					{t("admin.institution.form.registrationFormatManagedHint", {
						defaultValue:
							"Manage the active registration format from Registration Formats.",
					})}
				</p>
			</div>
		</div>
	);
}
