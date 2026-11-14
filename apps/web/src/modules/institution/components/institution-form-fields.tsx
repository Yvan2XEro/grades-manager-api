import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { InstitutionForm } from "../hooks/use-institution-form";
import type { Institution } from "../types";
import {
	InstitutionContactFields,
	InstitutionMediaFields,
} from "./institution-contact-fields";
import {
	InstitutionFormSection,
	type InstitutionFormVariant,
} from "./institution-form-section";
import {
	InstitutionIdentityFields,
	InstitutionNamesFields,
} from "./institution-identity-fields";

interface Props {
	form: InstitutionForm;
	variant: InstitutionFormVariant;
	institutions: Institution[];
	currentId?: string;
	onCreateParent?: () => Promise<void>;
	/** Content of the "System configuration" card. */
	system: ReactNode;
}

/**
 * Every section of the institution form (identity, names, contact, media,
 * system), used by the create/edit dialog and by the settings page.
 */
export function InstitutionFormFields({
	form,
	variant,
	institutions,
	currentId,
	onCreateParent,
	system,
}: Props) {
	const { t } = useTranslation();
	return (
		<>
			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.form.identity", {
					defaultValue: "Identity",
				})}
				hint={t("admin.institution.form.identityHint", {
					defaultValue:
						"These values appear on document headers and diplomas in French and English.",
				})}
			>
				<InstitutionIdentityFields
					form={form}
					institutions={institutions}
					currentId={currentId}
					onCreateParent={onCreateParent}
				/>
			</InstitutionFormSection>

			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.sections.names", {
					defaultValue: "Names & Legal Identity",
				})}
				hint={t("admin.institution.sections.namesHint", {
					defaultValue:
						"Official names as they appear on documents, diplomas, and legal paperwork.",
				})}
			>
				<InstitutionNamesFields form={form} />
			</InstitutionFormSection>

			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.sections.contact", {
					defaultValue: "Contact & Location",
				})}
				hint={t("admin.institution.sections.contactHint", {
					defaultValue: "Address, phone, email, and other contact details.",
				})}
			>
				<InstitutionContactFields form={form} />
			</InstitutionFormSection>

			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.sections.media", {
					defaultValue: "Media & Branding",
				})}
				hint={t("admin.institution.sections.mediaHint", {
					defaultValue:
						"Logo and cover image used on documents and the platform.",
				})}
			>
				<InstitutionMediaFields form={form} variant={variant} />
			</InstitutionFormSection>

			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.sections.system", {
					defaultValue: "System Configuration",
				})}
				hint={t("admin.institution.sections.systemHint", {
					defaultValue:
						"Active academic year and registration number format are managed in their dedicated modules.",
				})}
			>
				{system}
			</InstitutionFormSection>
		</>
	);
}
