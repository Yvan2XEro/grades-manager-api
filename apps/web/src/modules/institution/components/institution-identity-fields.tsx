import type { ReactNode } from "react";
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
} from "../hooks/use-institution-form";
import { institutionTypeLabel } from "../services/institution-type";
import type { Institution } from "../types";
import { InstitutionTextField } from "./institution-form-section";

interface Props {
	form: InstitutionForm;
	/** Candidates of the parent select. */
	institutions: Institution[];
	/** The institution being edited, left out of its own parent candidates. */
	currentId?: string;
	/** Shows a "+" next to the parent select that creates one in place. */
	onCreateParent?: () => Promise<void>;
}

/** Code, names, type and hierarchy (parent institution). */
export function InstitutionIdentityFields({
	form,
	institutions,
	currentId,
	onCreateParent,
}: Props) {
	const { t } = useTranslation();
	const others = institutions.filter((inst) => inst.id !== currentId);

	const withQuickCreate = (select: ReactNode) =>
		onCreateParent ? (
			<QuickCreate
				onCreate={onCreateParent}
				label={t("admin.institutions.actions.add")}
			>
				{select}
			</QuickCreate>
		) : (
			select
		);

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-4">
				<InstitutionTextField
					form={form}
					name="code"
					required
					label={t("admin.institution.form.code")}
				/>
				<InstitutionTextField
					form={form}
					name="shortName"
					label={t("admin.institution.form.shortName")}
				/>
				<InstitutionTextField
					form={form}
					name="abbreviation"
					placeholder="ex: UYI"
					label={t("admin.institution.form.abbreviation")}
				/>
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("admin.institution.form.type")}</FormLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t("admin.institution.form.typePlaceholder")}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="university">
										{t("admin.institution.form.typeUniversity")}
									</SelectItem>
									<SelectItem value="faculty">
										{t("admin.institution.form.typeFaculty")}
									</SelectItem>
									<SelectItem value="institution">
										{t("admin.institution.form.typeInstitution")}
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="parentInstitutionId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("admin.institution.form.parentInstitution")}
							</FormLabel>
							{withQuickCreate(
								<Select
									value={field.value ?? NO_SELECTION}
									onValueChange={(value) =>
										field.onChange(value === NO_SELECTION ? undefined : value)
									}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"admin.institution.form.parentInstitutionPlaceholder",
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={NO_SELECTION}>
											{t("admin.institution.form.noParentInstitution")}
										</SelectItem>
										{others.map((inst) => (
											<SelectItem key={inst.id} value={inst.id}>
												{inst.nameFr} ({institutionTypeLabel(t, inst.type)})
											</SelectItem>
										))}
									</SelectContent>
								</Select>,
							)}
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</>
	);
}

/** Bilingual names, legal names, slogans and descriptions. */
export function InstitutionNamesFields({ form }: { form: InstitutionForm }) {
	const { t } = useTranslation();
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<InstitutionTextField
					form={form}
					name="nameFr"
					required
					label={t("admin.institution.form.nameFr")}
				/>
				<InstitutionTextField
					form={form}
					name="nameEn"
					required
					label={t("admin.institution.form.nameEn")}
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<InstitutionTextField
					form={form}
					name="legalNameFr"
					label={t("admin.institution.form.legalNameFr")}
				/>
				<InstitutionTextField
					form={form}
					name="legalNameEn"
					label={t("admin.institution.form.legalNameEn")}
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<InstitutionTextField
					form={form}
					name="sloganFr"
					label={t("admin.institution.form.sloganFr")}
				/>
				<InstitutionTextField
					form={form}
					name="sloganEn"
					label={t("admin.institution.form.sloganEn")}
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<InstitutionTextField
					form={form}
					name="descriptionFr"
					rows={3}
					label={t("admin.institution.form.descriptionFr")}
				/>
				<InstitutionTextField
					form={form}
					name="descriptionEn"
					rows={3}
					label={t("admin.institution.form.descriptionEn")}
				/>
			</div>
		</>
	);
}
