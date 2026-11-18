import { useTranslation } from "react-i18next";
import { useInstitutionSystemOptions } from "../hooks/use-institution-form";

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
					{t("admin.institution.form.defaultAcademicYearManagedHint")}
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
					{t("admin.institution.form.registrationFormatManagedHint")}
				</p>
			</div>
		</div>
	);
}
