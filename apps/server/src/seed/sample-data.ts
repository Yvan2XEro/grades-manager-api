import { constants } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";
import type { AcademicsSeed, FoundationSeed, UsersSeed } from "./runner";

type ScaffoldOptions = {
	force?: boolean;
	logger?: Pick<Console, "log" | "error">;
};

const sampleFoundation: FoundationSeed = {
	meta: {
		version: "2024.12",
		generatedAt: "2024-12-22T00:00:00Z",
		dataset: "inses",
	},
	organizations: [
		{
			slug: "inses-institution",
			name: "INSES - Institut Supérieur de l'Espoir",
		},
	],
	examTypes: [
		{ name: "CC", description: "Contrôle continu" },
		{ name: "TP", description: "Travaux pratiques" },
		{ name: "TPE", description: "Travaux pratiques encadrés" },
		{ name: "FINAL", description: "Examen final" },
	],
	studyCycles: [
		// Cycles Santé
		{
			code: "BTS-SANTE",
			name: "BTS Sciences de la Santé",
			facultyCode: "INSES",
			description: "Cycle de formation professionnelle en sciences de la santé",
			totalCreditsRequired: 120,
			durationYears: 2,
		},
		{
			code: "LP-SANTE",
			name: "Licence Professionnelle Santé",
			facultyCode: "INSES",
			description: "Cycle de licence professionnelle en sciences de la santé",
			totalCreditsRequired: 180,
			durationYears: 3,
		},
		{
			code: "MP-SANTE",
			name: "Master Professionnel Santé",
			facultyCode: "INSES",
			description: "Cycle de master professionnel en sciences de la santé",
			totalCreditsRequired: 120,
			durationYears: 2,
		},
		// Cycles Commerce et Gestion
		{
			code: "BTS-COMMERCE",
			name: "BTS Commerce et Gestion",
			facultyCode: "INSES",
			description: "Cycle de formation professionnelle en commerce et gestion",
			totalCreditsRequired: 120,
			durationYears: 2,
		},
		// Cycles Paramédical
		{
			code: "CQP-PARAM",
			name: "CQP/AQP Paramédical",
			facultyCode: "INSES",
			description: "Certificat de Qualification Professionnelle Paramédical",
			totalCreditsRequired: 60,
			durationYears: 1,
		},
		{
			code: "DQP-PARAM",
			name: "DQP/AQP Paramédical",
			facultyCode: "INSES",
			description: "Diplôme de Qualification Professionnelle Paramédical",
			totalCreditsRequired: 60,
			durationYears: 1,
		},
		{
			code: "BTS-PARAM",
			name: "BTS Paramédical",
			facultyCode: "INSES",
			description: "Cycle BTS en filières paramédicales",
			totalCreditsRequired: 120,
			durationYears: 2,
		},
	],
	cycleLevels: [
		// Niveaux BTS (2 ans)
		{ code: "BTS1", name: "BTS 1ère année", orderIndex: 1, minCredits: 60, studyCycleCode: "BTS-SANTE", facultyCode: "INSES" },
		{ code: "BTS2", name: "BTS 2ème année", orderIndex: 2, minCredits: 120, studyCycleCode: "BTS-SANTE", facultyCode: "INSES" },
		{ code: "BTS1-COM", name: "BTS 1ère année", orderIndex: 1, minCredits: 60, studyCycleCode: "BTS-COMMERCE", facultyCode: "INSES" },
		{ code: "BTS2-COM", name: "BTS 2ème année", orderIndex: 2, minCredits: 120, studyCycleCode: "BTS-COMMERCE", facultyCode: "INSES" },
		{ code: "BTS1-PAR", name: "BTS 1ère année", orderIndex: 1, minCredits: 60, studyCycleCode: "BTS-PARAM", facultyCode: "INSES" },
		{ code: "BTS2-PAR", name: "BTS 2ème année", orderIndex: 2, minCredits: 120, studyCycleCode: "BTS-PARAM", facultyCode: "INSES" },

		// Niveaux Licence Pro (3 ans)
		{ code: "LP1", name: "Licence Pro 1ère année", orderIndex: 1, minCredits: 60, studyCycleCode: "LP-SANTE", facultyCode: "INSES" },
		{ code: "LP2", name: "Licence Pro 2ème année", orderIndex: 2, minCredits: 120, studyCycleCode: "LP-SANTE", facultyCode: "INSES" },
		{ code: "LP3", name: "Licence Pro 3ème année", orderIndex: 3, minCredits: 180, studyCycleCode: "LP-SANTE", facultyCode: "INSES" },

		// Niveaux Master Pro (2 ans)
		{ code: "MP1", name: "Master Pro 1ère année", orderIndex: 1, minCredits: 60, studyCycleCode: "MP-SANTE", facultyCode: "INSES" },
		{ code: "MP2", name: "Master Pro 2ème année", orderIndex: 2, minCredits: 120, studyCycleCode: "MP-SANTE", facultyCode: "INSES" },

		// Niveaux CQP/DQP (1 an)
		{ code: "CQP", name: "CQP/AQP", orderIndex: 1, minCredits: 60, studyCycleCode: "CQP-PARAM", facultyCode: "INSES" },
		{ code: "DQP", name: "DQP/AQP", orderIndex: 1, minCredits: 60, studyCycleCode: "DQP-PARAM", facultyCode: "INSES" },
	],
	semesters: [
		{ code: "S1", name: "Semestre 1", orderIndex: 1 },
		{ code: "S2", name: "Semestre 2", orderIndex: 2 },
	],
	academicYears: [
		{
			code: "AY-2025",
			name: "2025-2026",
			startDate: "2025-09-01",
			endDate: "2026-06-30",
			isActive: true,
		},
		{
			code: "AY-2024",
			name: "2024-2025",
			startDate: "2024-09-02",
			endDate: "2025-06-30",
			isActive: false,
		},
	],
	registrationNumberFormats: [
		{
			name: "INSES default format",
			description: "INSES-{year}-XXXX (per program/year)",
			isActive: true,
			definition: {
				segments: [
					{ kind: "literal", value: "INSES" },
					{ kind: "literal", value: "-" },
					{ kind: "field", field: "academicYearStartShort" },
					{ kind: "literal", value: "-" },
					{
						kind: "counter",
						width: 4,
						scope: ["program", "academicYear"],
						start: 1,
					},
				],
			},
		},
	],
	institutions: [
		{
			code: "INSES",
			type: "main",
			shortName: "INSES",
			nameFr: "Institut Supérieur de l'Espoir",
			nameEn: "Hope Higher Institute",
			legalNameFr: "Institut Supérieur de l'Espoir",
			legalNameEn: "Hope Higher Institute",
			sloganFr: "Excellence, Innovation et Engagement",
			sloganEn: "Excellence, Innovation and Commitment",
			descriptionFr: "Établissement privé d'enseignement supérieur spécialisé dans la formation des professionnels de santé et de commerce.",
			descriptionEn: "Private higher education institution specialized in training health and business professionals.",
			addressFr: "Douala-Bonabéri, BP 12345 Douala, Cameroun",
			addressEn: "Douala-Bonaberi, PO Box 12345 Douala, Cameroon",
			contactEmail: "contact@inses.cm",
			contactPhone: "+237 674 93 66 04",
			fax: "+237 9293 2000",
			postalBox: "BP 12345",
			website: "https://univ-inses.com",
			logoUrl: "https://univ-inses.com/images/logo/logo-inses.png",
			coverImageUrl: "https://placehold.co/1200x400.png",
			defaultAcademicYearCode: "AY-2025",
			registrationFormatName: "INSES default format",
			timezone: "Africa/Douala",
			organizationSlug: "inses-institution",
		},
	],
};

const sampleAcademics: AcademicsSeed = {
	meta: {
		version: "2024.12",
		generatedAt: "2024-12-22T00:05:00Z",
		dataset: "inses",
	},
	programs: [
		// Programmes BTS Santé
		{
			code: "BTS-INFIRMIER",
			name: "BTS Sciences Infirmières",
			slug: "bts-sciences-infirmieres",
			description: "Formation BTS en sciences infirmières / Nursing Sciences",
			facultyCode: "INSES",
		},
		{
			code: "BTS-SAGEFEMME",
			name: "BTS Sage-Femme",
			slug: "bts-sage-femme",
			description: "Formation BTS Sage-Femme / Midwifery",
			facultyCode: "INSES",
		},
		{
			code: "BTS-LABO",
			name: "BTS Techniques de Laboratoire",
			slug: "bts-techniques-laboratoire",
			description: "Formation BTS en Techniques de Laboratoire / Laboratory Techniques",
			facultyCode: "INSES",
		},
		{
			code: "BTS-KINE",
			name: "BTS Kinésithérapie",
			slug: "bts-kinesitherapie",
			description: "Formation BTS en Kinésithérapie / Physiotherapy",
			facultyCode: "INSES",
		},
		{
			code: "BTS-DIETETIQUE",
			name: "BTS Diététique",
			slug: "bts-dietetique",
			description: "Formation BTS en Diététique / Dietetics",
			facultyCode: "INSES",
		},
		{
			code: "BTS-RADIO",
			name: "BTS Radiologie et Imagérie Médicale",
			slug: "bts-radiologie-imagerie",
			description: "Formation BTS en Radiologie et Imagérie Médicale / Radiology and Medical Imaging",
			facultyCode: "INSES",
		},
		{
			code: "BTS-PHARMA",
			name: "BTS Techniques Pharmaceutiques",
			slug: "bts-techniques-pharmaceutiques",
			description: "Formation BTS en Techniques Pharmaceutiques / Pharmaceutical Techniques",
			facultyCode: "INSES",
		},

		// Programmes Licence Pro Santé
		{
			code: "LP-INFIRMIER",
			name: "Licence Professionnelle Sciences Infirmières",
			slug: "licence-pro-sciences-infirmieres",
			description: "Formation Licence Professionnelle en Sciences Infirmières / Nursing Sciences",
			facultyCode: "INSES",
		},

		// Programmes Master Pro Santé
		{
			code: "MP-INFIRMIER",
			name: "Master Professionnel Sciences Infirmières",
			slug: "master-pro-sciences-infirmieres",
			description: "Formation Master Professionnel en Sciences Infirmières / Nursing Sciences",
			facultyCode: "INSES",
		},
		{
			code: "MP-SANTE-PUB",
			name: "Master Professionnel Santé Publique",
			slug: "master-pro-sante-publique",
			description: "Formation Master Professionnel en Santé Publique / Public Health",
			facultyCode: "INSES",
		},
		{
			code: "MP-SANTE-REPRO",
			name: "Master Professionnel Santé de Reproduction",
			slug: "master-pro-sante-reproduction",
			description: "Formation Master Professionnel en Santé de Reproduction / Reproductive Health",
			facultyCode: "INSES",
		},
		{
			code: "MP-BIOMED",
			name: "Master Professionnel Sciences Biomédicales",
			slug: "master-pro-sciences-biomedicales",
			description: "Formation Master Professionnel en Sciences Biomédicales / Biomedical Sciences",
			facultyCode: "INSES",
		},
		{
			code: "MP-DIETETIQUE",
			name: "Master Professionnel Diététique et Nutrition",
			slug: "master-pro-dietetique-nutrition",
			description: "Formation Master Professionnel en Diététique et Nutrition / Dietetics and Nutrition",
			facultyCode: "INSES",
		},

		// Programmes BTS Commerce et Gestion
		{
			code: "BTS-COMPTA",
			name: "BTS Comptabilité et Gestion des Entreprises",
			slug: "bts-comptabilite-gestion",
			description: "Formation BTS en Comptabilité et Gestion des Entreprises / Accounting and Business Management",
			facultyCode: "INSES",
		},
		{
			code: "BTS-GRH",
			name: "BTS Gestion des Ressources Humaines",
			slug: "bts-gestion-rh",
			description: "Formation BTS en Gestion des Ressources Humaines / Human Resources Management",
			facultyCode: "INSES",
		},
		{
			code: "BTS-DOUANE",
			name: "BTS Douane et Transit",
			slug: "bts-douane-transit",
			description: "Formation BTS en Douane et Transit / Customs and Transit",
			facultyCode: "INSES",
		},
		{
			code: "BTS-BANQUE",
			name: "BTS Banque et Finance",
			slug: "bts-banque-finance",
			description: "Formation BTS en Banque et Finance / Banking and Finance",
			facultyCode: "INSES",
		},
		{
			code: "BTS-LOGISTIQUE",
			name: "BTS Logistique et Transport",
			slug: "bts-logistique-transport",
			description: "Formation BTS en Logistique et Transport / Logistics and Transport",
			facultyCode: "INSES",
		},
		{
			code: "BTS-ASSURANCE",
			name: "BTS Assurance",
			slug: "bts-assurance",
			description: "Formation BTS en Assurance / Insurance",
			facultyCode: "INSES",
		},
		{
			code: "BTS-MARKETING",
			name: "BTS Marketing-Commerce-Vente",
			slug: "bts-marketing-commerce-vente",
			description: "Formation BTS en Marketing-Commerce-Vente / Marketing-Commerce-Sales",
			facultyCode: "INSES",
		},

		// Programmes Paramédical CQP
		{
			code: "CQP-KINE-ASST",
			name: "CQP Assistant Kinésithérapie",
			slug: "cqp-assistant-kinesitherapie",
			description: "Formation CQP en Assistant Kinésithérapie / Physiotherapy Assistant",
			facultyCode: "INSES",
		},
		{
			code: "CQP-CHIMISTE",
			name: "CQP Aide Chimiste Biologiste",
			slug: "cqp-aide-chimiste-biologiste",
			description: "Formation CQP en Aide Chimiste Biologiste / Assistant Chemist Biologist",
			facultyCode: "INSES",
		},
		{
			code: "CQP-DIETETIQUE",
			name: "CQP Diététique",
			slug: "cqp-dietetique",
			description: "Formation CQP en Diététique / Dietetics",
			facultyCode: "INSES",
		},
		{
			code: "CQP-MASSAGE",
			name: "CQP Massothérapie",
			slug: "cqp-massotherapie",
			description: "Formation CQP en Massothérapie / Massage Therapy",
			facultyCode: "INSES",
		},
		{
			code: "CQP-DELEGUE-PHARMA",
			name: "CQP Délégué Pharmaceutique",
			slug: "cqp-delegue-pharmaceutique",
			description: "Formation CQP en Délégué Pharmaceutique / Pharmaceutical Delegate",
			facultyCode: "INSES",
		},
		{
			code: "CQP-DELEGUE-ASSUR",
			name: "CQP Délégué de l'Assurance Maladie",
			slug: "cqp-delegue-assurance-maladie",
			description: "Formation CQP en Délégué de l'Assurance Maladie / Health Insurance Delegate",
			facultyCode: "INSES",
		},
		{
			code: "CQP-DELEGUE-MED",
			name: "CQP Délégué Médical",
			slug: "cqp-delegue-medical",
			description: "Formation CQP en Délégué Médical / Medical Delegate",
			facultyCode: "INSES",
		},

		// Programmes Paramédical DQP
		{
			code: "DQP-VENDEUR-PHARMA",
			name: "DQP Vendeur en Pharmacie",
			slug: "dqp-vendeur-pharmacie",
			description: "Formation DQP en Vendeur en Pharmacie / Pharmacy Salesperson",
			facultyCode: "INSES",
		},
		{
			code: "DQP-SECRET-MED",
			name: "DQP Secrétariat Médical",
			slug: "dqp-secretariat-medical",
			description: "Formation DQP en Secrétariat Médical / Medical Secretariat",
			facultyCode: "INSES",
		},

		// Programmes Paramédical BTS
		{
			code: "BTS-SOINS-INF",
			name: "BTS Soins Infirmiers",
			slug: "bts-soins-infirmiers",
			description: "Formation BTS en Soins Infirmiers / Nurse",
			facultyCode: "INSES",
		},
		{
			code: "BTS-ASST-CABINET",
			name: "BTS Assistant en Cabinet Médical",
			slug: "bts-assistant-cabinet-medical",
			description: "Formation BTS en Assistant en Cabinet Médical / Medical Office Assistant",
			facultyCode: "INSES",
		},
		{
			code: "BTS-PREPOSE",
			name: "BTS Préposé aux Bénéficiaires",
			slug: "bts-prepose-beneficiaires",
			description: "Formation BTS en Préposé aux Bénéficiaires / Beneficial Assistant",
			facultyCode: "INSES",
		},
	],
	programOptions: [
		{
			programCode: "BTS-INFIRMIER",
			code: "GENERAL",
			name: "Tronc Commun",
			description: "Parcours général en sciences infirmières",
		},
		{
			programCode: "BTS-COMPTA",
			code: "GENERAL",
			name: "Tronc Commun",
			description: "Parcours général en comptabilité et gestion",
		},
	],
	teachingUnits: [
		// UE pour BTS Sciences Infirmières
		{
			programCode: "BTS-INFIRMIER",
			code: "UE-SANTE-1",
			name: "Sciences Fondamentales de la Santé",
			description: "Anatomie, physiologie, biologie",
			credits: 12,
			semester: "annual",
		},
		{
			programCode: "BTS-INFIRMIER",
			code: "UE-SANTE-2",
			name: "Soins Infirmiers de Base",
			description: "Techniques de soins et pratiques infirmières",
			credits: 18,
			semester: "annual",
		},

		// UE pour BTS Comptabilité
		{
			programCode: "BTS-COMPTA",
			code: "UE-COMPTA-1",
			name: "Comptabilité Générale",
			description: "Principes et pratiques comptables",
			credits: 15,
			semester: "annual",
		},
		{
			programCode: "BTS-COMPTA",
			code: "UE-COMPTA-2",
			name: "Gestion Financière",
			description: "Analyse financière et gestion budgétaire",
			credits: 12,
			semester: "annual",
		},
	],
	courses: [
		// Cours pour BTS Sciences Infirmières
		{
			programCode: "BTS-INFIRMIER",
			teachingUnitCode: "UE-SANTE-1",
			code: "ANAT101",
			name: "Anatomie Humaine",
			hours: 45,
		},
		{
			programCode: "BTS-INFIRMIER",
			teachingUnitCode: "UE-SANTE-1",
			code: "PHYS101",
			name: "Physiologie",
			hours: 40,
		},
		{
			programCode: "BTS-INFIRMIER",
			teachingUnitCode: "UE-SANTE-2",
			code: "SOIN101",
			name: "Soins de Base",
			hours: 60,
		},

		// Cours pour BTS Comptabilité
		{
			programCode: "BTS-COMPTA",
			teachingUnitCode: "UE-COMPTA-1",
			code: "COMPT101",
			name: "Introduction à la Comptabilité",
			hours: 50,
		},
		{
			programCode: "BTS-COMPTA",
			teachingUnitCode: "UE-COMPTA-1",
			code: "COMPT102",
			name: "Comptabilité Analytique",
			hours: 45,
		},
		{
			programCode: "BTS-COMPTA",
			teachingUnitCode: "UE-COMPTA-2",
			code: "FIN101",
			name: "Gestion Financière",
			hours: 40,
		},
	],
	classes: [
		// Classes BTS Sciences Infirmières
		{
			code: "INF25-BTS1A",
			name: "BTS Sciences Infirmières 1ère année - Groupe A",
			programCode: "BTS-INFIRMIER",
			programOptionCode: "GENERAL",
			academicYearCode: "AY-2025",
			studyCycleCode: "BTS-SANTE",
			cycleLevelCode: "BTS1",
			semesterCode: "S1",
		},
		{
			code: "INF25-BTS1B",
			name: "BTS Sciences Infirmières 1ère année - Groupe B",
			programCode: "BTS-INFIRMIER",
			programOptionCode: "GENERAL",
			academicYearCode: "AY-2025",
			studyCycleCode: "BTS-SANTE",
			cycleLevelCode: "BTS1",
			semesterCode: "S1",
		},

		// Classes BTS Comptabilité
		{
			code: "COMPT25-BTS1A",
			name: "BTS Comptabilité 1ère année - Groupe A",
			programCode: "BTS-COMPTA",
			programOptionCode: "GENERAL",
			academicYearCode: "AY-2025",
			studyCycleCode: "BTS-COMMERCE",
			cycleLevelCode: "BTS1-COM",
			semesterCode: "S1",
		},
	],
	classCourses: [
		// Cours pour la classe BTS Infirmier 1A
		{
			code: "CC-ANAT101-INF1A",
			classCode: "INF25-BTS1A",
			classAcademicYearCode: "AY-2025",
			courseCode: "ANAT101",
			teacherCode: "TEACH-DR-MBALLA",
			semesterCode: "S1",
			weeklyHours: 3,
		},
		{
			code: "CC-PHYS101-INF1A",
			classCode: "INF25-BTS1A",
			classAcademicYearCode: "AY-2025",
			courseCode: "PHYS101",
			teacherCode: "TEACH-DR-NGUEMA",
			semesterCode: "S1",
			weeklyHours: 3,
		},
		{
			code: "CC-SOIN101-INF1A",
			classCode: "INF25-BTS1A",
			classAcademicYearCode: "AY-2025",
			courseCode: "SOIN101",
			teacherCode: "TEACH-INF-AKONO",
			semesterCode: "S1",
			weeklyHours: 4,
		},

		// Cours pour la classe BTS Comptabilité 1A
		{
			code: "CC-COMPT101-COMPT1A",
			classCode: "COMPT25-BTS1A",
			classAcademicYearCode: "AY-2025",
			courseCode: "COMPT101",
			teacherCode: "TEACH-KOMBO",
			semesterCode: "S1",
			weeklyHours: 4,
		},
		{
			code: "CC-COMPT102-COMPT1A",
			classCode: "COMPT25-BTS1A",
			classAcademicYearCode: "AY-2025",
			courseCode: "COMPT102",
			teacherCode: "TEACH-KOMBO",
			semesterCode: "S1",
			weeklyHours: 3,
		},
	],
	exams: [
		{
			id: "EXAM-ANAT101-CC",
			classCourseCode: "CC-ANAT101-INF1A",
			name: "Contrôle Continu Anatomie",
			type: "CC",
			date: "2025-10-15T09:00:00Z",
			percentage: 40,
			status: "draft",
		},
		{
			id: "EXAM-COMPT101-CC",
			classCourseCode: "CC-COMPT101-COMPT1A",
			name: "Contrôle Continu Comptabilité",
			type: "CC",
			date: "2025-10-20T09:00:00Z",
			percentage: 40,
			status: "draft",
		},
	],
	enrollmentWindows: [
		{
			classCode: "INF25-BTS1A",
			academicYearCode: "AY-2025",
			status: "open",
		},
		{
			classCode: "INF25-BTS1B",
			academicYearCode: "AY-2025",
			status: "open",
		},
		{
			classCode: "COMPT25-BTS1A",
			academicYearCode: "AY-2025",
			status: "open",
		},
	],
};

const sampleUsers: UsersSeed = {
	meta: {
		version: "2024.12",
		generatedAt: "2024-12-22T00:10:00Z",
		dataset: "inses",
	},
	authUsers: [
		{
			code: "ADMIN-ROOT",
			email: "admin@inses.cm",
			name: "Administrateur INSES",
			password: "ChangeMe123!",
			role: "admin",
		},
		{
			code: "TEACH-DR-MBALLA",
			email: "dr.mballa@inses.cm",
			name: "Dr. Mballa Jean",
			password: "Password123!",
			role: "admin",
		},
		{
			code: "TEACH-DR-NGUEMA",
			email: "dr.nguema@inses.cm",
			name: "Dr. Nguema Marie",
			password: "Password123!",
			role: "admin",
		},
		{
			code: "TEACH-INF-AKONO",
			email: "inf.akono@inses.cm",
			name: "Inf. Akono Patricia",
			password: "Password123!",
			role: "admin",
		},
		{
			code: "TEACH-KOMBO",
			email: "kombo@inses.cm",
			name: "Kombo Francis",
			password: "Password123!",
			role: "admin",
		},
		{
			code: "STUDENT-NDONG",
			email: "ndong.student@inses.cm",
			name: "Ndong Alain",
			password: "Password123!",
			role: "user",
		},
		{
			code: "STUDENT-EYEBE",
			email: "eyebe.student@inses.cm",
			name: "Eyebe Rachel",
			password: "Password123!",
			role: "user",
		},
	],
	domainUsers: [
		{
			code: "ADMIN-ROOT",
			authUserCode: "ADMIN-ROOT",
			businessRole: "administrator",
			firstName: "Administrateur",
			lastName: "INSES",
			primaryEmail: "admin@inses.cm",
			status: "active",
			organizationSlug: "inses-institution",
			memberRole: "owner",
		},
		{
			code: "TEACH-DR-MBALLA",
			authUserCode: "TEACH-DR-MBALLA",
			businessRole: "teacher",
			firstName: "Jean",
			lastName: "Mballa",
			primaryEmail: "dr.mballa@inses.cm",
			status: "active",
			organizationSlug: "inses-institution",
		},
		{
			code: "TEACH-DR-NGUEMA",
			authUserCode: "TEACH-DR-NGUEMA",
			businessRole: "teacher",
			firstName: "Marie",
			lastName: "Nguema",
			primaryEmail: "dr.nguema@inses.cm",
			status: "active",
			organizationSlug: "inses-institution",
		},
		{
			code: "TEACH-INF-AKONO",
			authUserCode: "TEACH-INF-AKONO",
			businessRole: "teacher",
			firstName: "Patricia",
			lastName: "Akono",
			primaryEmail: "inf.akono@inses.cm",
			status: "active",
			organizationSlug: "inses-institution",
		},
		{
			code: "TEACH-KOMBO",
			authUserCode: "TEACH-KOMBO",
			businessRole: "teacher",
			firstName: "Francis",
			lastName: "Kombo",
			primaryEmail: "kombo@inses.cm",
			status: "active",
			organizationSlug: "inses-institution",
		},
		{
			code: "STUDENT-NDONG",
			authUserCode: "STUDENT-NDONG",
			businessRole: "student",
			firstName: "Alain",
			lastName: "Ndong",
			primaryEmail: "ndong.student@inses.cm",
			status: "active",
		},
		{
			code: "STUDENT-EYEBE",
			authUserCode: "STUDENT-EYEBE",
			businessRole: "student",
			firstName: "Rachel",
			lastName: "Eyebe",
			primaryEmail: "eyebe.student@inses.cm",
			status: "active",
		},
	],
	students: [
		{
			code: "STUDENT-NDONG",
			domainUserCode: "STUDENT-NDONG",
			classCode: "INF25-BTS1A",
			classAcademicYearCode: "AY-2025",
			registrationNumber: "INSES25-0001",
		},
		{
			code: "STUDENT-EYEBE",
			domainUserCode: "STUDENT-EYEBE",
			classCode: "COMPT25-BTS1A",
			classAcademicYearCode: "AY-2025",
			registrationNumber: "INSES25-0002",
		},
	],
	enrollments: [
		{
			studentCode: "STUDENT-NDONG",
			classCode: "INF25-BTS1A",
			classAcademicYearCode: "AY-2025",
			academicYearCode: "AY-2025",
			status: "active",
			admissionType: "normal",
		},
		{
			studentCode: "STUDENT-EYEBE",
			classCode: "COMPT25-BTS1A",
			classAcademicYearCode: "AY-2025",
			academicYearCode: "AY-2025",
			status: "active",
			admissionType: "normal",
		},
	],
	studentCourseEnrollments: [
		{
			studentCode: "STUDENT-NDONG",
			classCourseCode: "CC-ANAT101-INF1A",
			courseCode: "ANAT101",
			sourceClassCode: "INF25-BTS1A",
			sourceClassAcademicYearCode: "AY-2025",
			academicYearCode: "AY-2025",
			status: "active",
			attempt: 1,
			creditsAttempted: 4,
			creditsEarned: 0,
		},
		{
			studentCode: "STUDENT-EYEBE",
			classCourseCode: "CC-COMPT101-COMPT1A",
			courseCode: "COMPT101",
			sourceClassCode: "COMPT25-BTS1A",
			sourceClassAcademicYearCode: "AY-2025",
			academicYearCode: "AY-2025",
			status: "active",
			attempt: 1,
			creditsAttempted: 5,
			creditsEarned: 0,
		},
	],
};

const sampleExternalStudents: UsersSeed = {
	meta: {
		version: "2024.12",
		generatedAt: "2024-12-22T00:00:00Z",
		dataset: "external-admission-examples",
	},
	authUsers: [
		{
			code: "STUDENT-TRANSFER",
			email: "transfer.student@inses.cm",
			password: "password123",
			name: "Étudiant Transfert",
		},
		{
			code: "STUDENT-DIRECT",
			email: "direct.student@inses.cm",
			password: "password123",
			name: "Étudiant Admission Directe",
		},
	],
	domainUsers: [
		{
			code: "STUDENT-TRANSFER",
			authUserCode: "STUDENT-TRANSFER",
			businessRole: "student",
			firstName: "Pierre",
			lastName: "Transfert",
			primaryEmail: "transfer.student@inses.cm",
			status: "active",
		},
		{
			code: "STUDENT-DIRECT",
			authUserCode: "STUDENT-DIRECT",
			businessRole: "student",
			firstName: "Sophie",
			lastName: "Direct",
			primaryEmail: "direct.student@inses.cm",
			status: "active",
		},
	],
	students: [
		{
			code: "STUDENT-TRANSFER",
			domainUserCode: "STUDENT-TRANSFER",
			classCode: "INF25-BTS1A",
			classAcademicYearCode: "AY-2025",
			registrationNumber: "INSES25-0010",
		},
		{
			code: "STUDENT-DIRECT",
			domainUserCode: "STUDENT-DIRECT",
			classCode: "COMPT25-BTS1A",
			classAcademicYearCode: "AY-2025",
			registrationNumber: "INSES25-0011",
		},
	],
	enrollments: [
		{
			studentCode: "STUDENT-TRANSFER",
			classCode: "INF25-BTS1A",
			academicYearCode: "AY-2025",
			status: "active",
			admissionType: "transfer",
			transferInstitution: "Institut de Santé de Yaoundé",
			transferCredits: 30,
			transferLevel: "BTS1",
			admissionJustification:
				"Transfert d'un autre établissement avec validation de crédits acquis.",
			admissionDate: "2025-09-01",
		},
		{
			studentCode: "STUDENT-DIRECT",
			classCode: "COMPT25-BTS1A",
			academicYearCode: "AY-2025",
			status: "active",
			admissionType: "direct",
			admissionJustification:
				"Admission directe sur titre avec expérience professionnelle reconnue.",
			admissionDate: "2025-09-01",
		},
	],
};

const sampleFiles = [
	{
		filename: "00-foundation.yaml",
		payload: sampleFoundation,
	},
	{
		filename: "10-academics.yaml",
		payload: sampleAcademics,
	},
	{
		filename: "20-users.yaml",
		payload: sampleUsers,
	},
	{
		filename: "30-external-students.yaml",
		payload: sampleExternalStudents,
	},
];

export async function scaffoldSampleSeeds(
	baseDir: string,
	options: ScaffoldOptions = {},
) {
	const targetDir = path.isAbsolute(baseDir)
		? baseDir
		: path.resolve(process.cwd(), baseDir);
	await mkdir(targetDir, { recursive: true });
	for (const file of sampleFiles) {
		const filePath = path.join(targetDir, file.filename);
		if (!options.force) {
			try {
				await access(filePath, constants.F_OK);
				options.logger?.log(
					`[seed] Skipping existing ${file.filename} (use --force to overwrite).`,
				);
				continue;
			} catch {
				// file does not exist, fall through
			}
		}
		await writeFile(filePath, stringify(file.payload, { indent: 2 }));
		options.logger?.log(`[seed] Wrote ${filePath}`);
	}
	return targetDir;
}

export const sampleSeedFiles = sampleFiles;
