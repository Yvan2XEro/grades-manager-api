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
				title={t("admin.institution.form.identity")}
				hint={t("admin.institution.form.identityHint")}
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
				title={t("admin.institution.sections.names")}
				hint={t("admin.institution.sections.namesHint")}
			>
				<InstitutionNamesFields form={form} />
			</InstitutionFormSection>

			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.sections.contact")}
				hint={t("admin.institution.sections.contactHint")}
			>
				<InstitutionContactFields form={form} />
			</InstitutionFormSection>

			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.sections.media")}
				hint={t("admin.institution.sections.mediaHint")}
			>
				<InstitutionMediaFields form={form} variant={variant} />
			</InstitutionFormSection>

			<InstitutionFormSection
				variant={variant}
				title={t("admin.institution.sections.system")}
				hint={t("admin.institution.sections.systemHint")}
			>
				{system}
			</InstitutionFormSection>
		</>
	);
}
