import type { TFunction } from "i18next";
import type { ApplicationDetail, ProgramOption } from "../types";

export interface DossierField {
	label: string;
	value?: string | null;
	/** Spans both columns in the drawer. */
	wide?: boolean;
	/** Hidden in the drawer when empty (other fields show "—"). */
	optional?: boolean;
}

export interface DossierGroup {
	fields: DossierField[];
	/** Shows the group in the drawer (default true). */
	when?: boolean;
	/** Shows the group on the full page (default true). */
	whenOnPage?: boolean;
}

export interface DossierSection {
	key: string;
	title: string;
	groups: DossierGroup[];
	/** Text shown instead of the groups (no prior higher education). */
	emptyText?: string;
	personalStatement?: string | null;
}

/**
 * The applicant's file, section by section (one per wizard step), shared by
 * the review drawer and the full application page.
 */
export function getDossierSections(
	app: ApplicationDetail,
	programs: ProgramOption[],
	t: TFunction,
): DossierSection[] {
	const ap = app.applicant;
	const option = (prefix: string, value?: string | null) =>
		value ? t(`admissions.options.${prefix}.${value}`) : undefined;
	const field = (
		key: string,
		value?: string | null,
		extra?: Partial<DossierField>,
	): DossierField => ({
		label: t(`admissions.fields.${key}`),
		value,
		...extra,
	});
	const programName = (id?: string | null) =>
		programs.find((p) => p.id === id)?.name;

	return [
		{
			key: "identity",
			title: t("admissions.steps.1.title"),
			groups: [
				{
					fields: [
						field("gender", option("gender", ap.gender)),
						field("dateOfBirth", ap.dateOfBirth),
						field("placeOfBirth", ap.placeOfBirth),
						field("countryOfBirth", ap.countryOfBirth),
						field("nationality", ap.nationality),
						field("idCardNumber", ap.idCardNumber),
						field("maritalStatus", option("maritalStatus", ap.maritalStatus)),
						field("primaryLanguage", option("language", ap.primaryLanguage)),
					],
				},
			],
		},
		{
			key: "contact",
			title: t("admissions.steps.2.title"),
			groups: [
				{
					fields: [
						field("email", ap.email),
						field("phone", ap.phone),
						field("whatsapp", ap.whatsapp, { optional: true }),
						field("address", ap.address, { optional: true, wide: true }),
						field("city", ap.city),
						field("postalBox", ap.postalBox, { optional: true }),
						field("originCountry", ap.originCountry),
						field("originRegion", ap.originRegion),
						field("originDepartment", ap.originDepartment),
						field("studentStatus", option("studentStatus", ap.studentStatus)),
						field(
							"employmentStatus",
							option("employmentStatus", ap.employmentStatus),
						),
					],
				},
			],
		},
		{
			key: "bac",
			title: t("admissions.steps.3.title"),
			groups: [
				{
					fields: [
						field(
							"entryDiplomaType",
							option("diplomaType", ap.entryDiplomaType),
						),
						field("bacSeries", ap.bacSeries),
						field("bacYear", ap.bacYear),
						field("bacMention", option("bacMention", ap.bacMention)),
						field("bacAverage", ap.bacAverage),
						field("bacInstitution", ap.bacInstitution),
						field("bacCountry", ap.bacCountry),
						field("bacMatricule", ap.bacMatricule, { optional: true }),
					],
				},
			],
		},
		{
			key: "priorHigherEd",
			title: t("admissions.steps.4.title"),
			emptyText: ap.hasPriorHigherEd
				? undefined
				: t("admissions.wizard.priorHigherEdNo"),
			groups: [
				{
					fields: [
						field("priorInstitution", ap.priorInstitution),
						field("priorField", ap.priorField),
						field("priorLevel", ap.priorLevel),
						field("priorStartYear", ap.priorStartYear),
						field("priorEndYear", ap.priorEndYear),
						field("priorResult", option("priorResult", ap.priorResult)),
					],
				},
			],
		},
		{
			key: "programs",
			title: t("admissions.steps.5.title"),
			personalStatement: app.personalStatement,
			groups: [
				{
					fields: [
						field("program", app.program.name, { wide: true }),
						...(app.secondChoiceProgramId
							? [
									{
										label: t("admissions.admin.secondChoice"),
										value:
											programName(app.secondChoiceProgramId) ??
											app.secondChoiceProgramId,
										wide: true,
									},
								]
							: []),
						...(app.thirdChoiceProgramId
							? [
									{
										label: t("admissions.admin.thirdChoice"),
										value:
											programName(app.thirdChoiceProgramId) ??
											app.thirdChoiceProgramId,
										wide: true,
									},
								]
							: []),
						field("academicYear", app.academicYear.name),
						field("academicLevel", app.academicLevel, { optional: true }),
						field("trainingType", option("trainingType", app.trainingType), {
							optional: true,
						}),
					],
				},
			],
		},
		{
			key: "family",
			title: t("admissions.steps.6.title"),
			groups: [
				{
					when: Boolean(ap.fatherName || ap.motherName),
					fields: [
						field("fatherName", ap.fatherName, { optional: true }),
						field("fatherProfession", ap.fatherProfession, { optional: true }),
						field("fatherPhone", ap.fatherPhone, { optional: true }),
						field("motherName", ap.motherName, { optional: true }),
						field("motherProfession", ap.motherProfession, { optional: true }),
						field("motherPhone", ap.motherPhone, { optional: true }),
					],
				},
				{
					when: Boolean(ap.guardianName),
					whenOnPage: Boolean(ap.guardianName),
					fields: [
						field("guardianName", ap.guardianName),
						field("guardianRelation", ap.guardianRelation, { optional: true }),
						field("guardianPhone", ap.guardianPhone, { optional: true }),
					],
				},
				{
					when: Boolean(ap.emergencyContactName),
					fields: [
						field("emergencyContactName", ap.emergencyContactName),
						field("emergencyContactPhone", ap.emergencyContactPhone, {
							optional: true,
						}),
						field("emergencyContactCity", ap.emergencyContactCity, {
							optional: true,
						}),
					],
				},
			],
		},
	];
}
