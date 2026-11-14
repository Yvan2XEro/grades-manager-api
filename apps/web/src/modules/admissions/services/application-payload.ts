import type { WizardValues } from "./application-schema";

/** Maps the wizard values to the `admissions.submit` input (trimmed, empty → undefined). */
export const toSubmitApplicationInput = (values: WizardValues) => ({
	applicant: {
		firstName: values.firstName.trim(),
		lastName: values.lastName.trim(),
		email: values.email.trim(),
		phone: values.phone.trim() || undefined,
		dateOfBirth: values.dateOfBirth || undefined,
		nationality: values.nationality.trim() || undefined,
		gender: values.gender || undefined,
		placeOfBirth: values.placeOfBirth.trim() || undefined,
		countryOfBirth: values.countryOfBirth?.trim() || undefined,
		exactDateOfBirth: values.exactDateOfBirth,
		idCardNumber: values.idCardNumber.trim() || undefined,
		maritalStatus: values.maritalStatus || undefined,
		employmentStatus: values.employmentStatus || undefined,
		primaryLanguage: values.primaryLanguage || undefined,
		hasDisability: values.hasDisability,
		whatsapp: values.whatsapp?.trim() || undefined,
		address: values.address?.trim() || undefined,
		city: values.city?.trim() || undefined,
		postalBox: values.postalBox?.trim() || undefined,
		originCountry: values.originCountry?.trim() || undefined,
		originRegion: values.originRegion || undefined,
		originDepartment: values.originDepartment || undefined,
		studentStatus: values.studentStatus || undefined,
		entryDiplomaType: values.entryDiplomaType || undefined,
		bacSeries: values.bacSeries?.trim() || undefined,
		bacYear: values.bacYear?.trim() || undefined,
		bacMention: values.bacMention || undefined,
		bacAverage: values.bacAverage?.trim() || undefined,
		bacInstitution: values.bacInstitution?.trim() || undefined,
		bacCountry: values.bacCountry?.trim() || undefined,
		bacMatricule: values.bacMatricule?.trim() || undefined,
		hasPriorHigherEd: values.hasPriorHigherEd,
		priorInstitution: values.hasPriorHigherEd
			? values.priorInstitution?.trim() || undefined
			: undefined,
		priorField: values.hasPriorHigherEd
			? values.priorField?.trim() || undefined
			: undefined,
		priorLevel: values.hasPriorHigherEd
			? values.priorLevel || undefined
			: undefined,
		priorStartYear: values.hasPriorHigherEd
			? values.priorStartYear?.trim() || undefined
			: undefined,
		priorEndYear: values.hasPriorHigherEd
			? values.priorEndYear?.trim() || undefined
			: undefined,
		priorResult: values.hasPriorHigherEd
			? values.priorResult || undefined
			: undefined,
		fatherName: values.fatherName.trim() || undefined,
		fatherProfession: values.fatherProfession.trim() || undefined,
		fatherPhone: values.fatherPhone?.trim() || undefined,
		fatherAlive: values.fatherAlive,
		motherName: values.motherName.trim() || undefined,
		motherProfession: values.motherProfession.trim() || undefined,
		motherPhone: values.motherPhone?.trim() || undefined,
		motherAlive: values.motherAlive,
		guardianName: values.guardianName?.trim() || undefined,
		guardianRelation: values.guardianRelation?.trim() || undefined,
		guardianPhone: values.guardianPhone?.trim() || undefined,
		emergencyContactName: values.emergencyContactName.trim() || undefined,
		emergencyContactPhone: values.emergencyContactPhone.trim() || undefined,
		emergencyContactCity: values.emergencyContactCity.trim() || undefined,
	},
	programId: values.programId,
	secondChoiceProgramId: values.secondChoiceProgramId || undefined,
	thirdChoiceProgramId: values.thirdChoiceProgramId || undefined,
	academicYearId: values.academicYearId,
	academicLevel: values.academicLevel || undefined,
	trainingType: values.trainingType || undefined,
	personalStatement: values.personalStatement?.trim() || undefined,
});
