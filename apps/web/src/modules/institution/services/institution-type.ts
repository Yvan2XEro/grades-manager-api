import type { TFunction } from "i18next";

/** Translated label of an institution type (university, faculty, institution). */
export function institutionTypeLabel(t: TFunction, type: string) {
	switch (type) {
		case "university":
			return t("admin.institution.form.typeUniversity");
		case "faculty":
			return t("admin.institution.form.typeFaculty");
		case "institution":
			return t("admin.institution.form.typeInstitution");
		default:
			return type;
	}
}
