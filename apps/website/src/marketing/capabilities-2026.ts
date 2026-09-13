/**
 * Functional coverage, derived from the server code rather than from copy.
 *
 * Every capability listed here was verified against `apps/server/src/modules/`
 * during the September 2026 functional audit. The rule for this file is simple
 * and it is the reason it exists at all: **if the code does not do it, it does
 * not go in.** The commercial proposal is the source for wording; the module
 * tree is the source for truth, and where the two disagreed, the code won.
 *
 * Three claims were deliberately softened against the proposal's own text:
 *
 *   - QR codes. Documents embed a self-carrying QR payload (matricule, name,
 *     average, mention, reference), but there is no public verification
 *     endpoint — nothing to scan *towards*. "Vérifiable par QR code" would be
 *     read as "scan opens a checking page", so it is stated as what it is.
 *   - Consolidated reporting. `modules/stats` reports per institution; there
 *     is no cross-tenant aggregation view. Stated as per-establishment.
 *   - Retakes. Fully implemented but gated behind `RETAKES_FEATURE_FLAG`,
 *     which defaults to false, so it is marked as an activation.
 *
 * `note` renders as a qualifier in smaller type — use it whenever a capability
 * is real but narrower than a reader would assume.
 */

export type Capability = {
	fr: string;
	en: string;
	/** Honest qualifier shown beneath the line. */
	note?: { fr: string; en: string };
};

export type CapabilityDomain = {
	key: string;
	/** Tailwind classes for the domain band. Reuses the chart palette. */
	band: string;
	fr: { name: string; lede: string };
	en: { name: string; lede: string };
	capabilities: Capability[];
	/** Which live demo, if any, belongs to this domain. */
	demo?:
		| "grades"
		| "deliberation"
		| "attendance"
		| "approvals"
		| "docexport"
		| "rules";
};

export const CAPABILITY_DOMAINS: CapabilityDomain[] = [
	{
		key: "admissions",
		band: "bg-tk-primary text-tk-on-primary",
		fr: {
			name: "Admissions & inscriptions",
			lede: "De la candidature en ligne au dossier étudiant complet, sans ressaisie.",
		},
		en: {
			name: "Admissions & enrolment",
			lede: "From the online application to a complete student record, with no re-keying.",
		},
		capabilities: [
			{
				fr: "Formulaire de candidature public, hors authentification",
				en: "Public application form, no account required",
			},
			{
				fr: "Suivi de candidature par code de référence",
				en: "Application tracking by reference code",
			},
			{
				fr: "Pièces exigées configurables, vérifiées une par une",
				en: "Configurable required documents, reviewed one by one",
			},
			{
				fr: "Décision d'admission motivée et tracée",
				en: "Reasoned, traced admission decision",
			},
			{
				fr: "Conversion candidat accepté → étudiant inscrit en un geste",
				en: "Accepted applicant converted to enrolled student in one step",
			},
			{
				fr: "Matricules générés selon vos formats, avec compteurs",
				en: "Registration numbers generated to your own formats, with counters",
			},
			{
				fr: "Réinscriptions et suivi de cohorte",
				en: "Re-enrolment and cohort tracking",
			},
		],
	},
	{
		key: "curriculum",
		band: "bg-tk-dark text-tk-on-dark",
		fr: {
			name: "Offre de formation LMD",
			lede: "Le référentiel LMD est dans le schéma de la base, pas simulé au-dessus.",
		},
		en: {
			name: "LMD course catalogue",
			lede: "The LMD model lives in the database schema, not simulated on top of it.",
		},
		capabilities: [
			{
				fr: "Filières, parcours, cycles et niveaux",
				en: "Programmes, pathways, cycles and levels",
			},
			{
				fr: "UE et EC, crédits ECTS, coefficients",
				en: "Teaching units and components, ECTS credits, coefficients",
			},
			{ fr: "Prérequis entre cours", en: "Course prerequisites" },
			{
				fr: "Semestres portés par l'UE : automne, printemps ou annuel",
				en: "Semester carried by the unit: fall, spring or annual",
			},
			{
				fr: "Duplication d'une maquette vers d'autres cycles",
				en: "Duplicate a course structure across cycles",
			},
			{
				fr: "Clonage de maquette d'une année sur l'autre",
				en: "Clone a curriculum from one year to the next",
			},
		],
	},
	{
		key: "grades",
		band: "bg-tk-accent text-white",
		demo: "grades",
		fr: {
			name: "Notes & moteur de règles",
			lede: "Saisie, validation, verrouillage — chaque écriture est horodatée et attribuée.",
		},
		en: {
			name: "Marks & rules engine",
			lede: "Entry, validation, locking — every write is timestamped and attributed.",
		},
		capabilities: [
			{
				fr: "Saisie par enseignant, en formulaire ou en tableur",
				en: "Entry by teachers, as a form or as a spreadsheet",
			},
			{
				fr: "Contrôle continu et examens, pondération automatique",
				en: "Continuous assessment and exams, automatic weighting",
			},
			{
				fr: "Barèmes de notation configurables",
				en: "Configurable grading scales",
			},
			{
				fr: "Cycle de vie de l'examen : création → soumission → validation → verrouillage",
				en: "Exam lifecycle: create → submit → validate → lock",
			},
			{
				fr: "Délégation de saisie à un tiers, avec droits temporaires",
				en: "Delegated entry with time-limited rights",
			},
			{ fr: "Import et export CSV", en: "CSV import and export" },
			{
				fr: "Journal des modifications de notes",
				en: "Grade edit log",
			},
			{
				fr: "Capitalisation des crédits au fil du cursus",
				en: "Credit accumulation across the degree",
			},
		],
	},
	{
		key: "deliberation",
		band: "bg-tk-primary text-tk-on-primary",
		demo: "deliberation",
		fr: {
			name: "Délibération & promotion",
			lede: "Un vrai moteur de règles, pas des conditions codées en dur.",
		},
		en: {
			name: "Deliberation & progression",
			lede: "A real rules engine, not hard-coded conditions.",
		},
		capabilities: [
			{
				fr: "Moteur de règles configurable par filière et par jury",
				en: "Rules engine configurable per programme and per jury",
			},
			{
				fr: "Seuils, notes éliminatoires, compensation, capitalisation",
				en: "Thresholds, eliminating marks, compensation, credit accumulation",
			},
			{
				fr: "Décisions de jury modifiables une par une, avec motif",
				en: "Jury decisions overridable one by one, with a reason",
			},
			{
				fr: "Procès-verbal généré et horodaté",
				en: "Minutes generated and timestamped",
			},
			{
				fr: "Promotion des admis en année supérieure",
				en: "Progression of successful students to the next year",
			},
			{
				fr: "Passage d'année complet : préparation, arbitrages, validation, exécution",
				en: "Full year transition: readiness, arbitration, approval, execution",
			},
			{
				fr: "Sessions de rattrapage",
				en: "Resit sessions",
				note: {
					fr: "Implémenté, activé par paramètre au déploiement.",
					en: "Implemented, switched on by deployment setting.",
				},
			},
			{
				fr: "Journal de délibération complet",
				en: "Complete deliberation log",
			},
		],
	},
	{
		key: "documents",
		band: "bg-tk-dark text-tk-on-dark",
		demo: "docexport",
		fr: {
			name: "Documents officiels",
			lede: "24 modèles livrés, éditables, assignables par filière et par classe.",
		},
		en: {
			name: "Official documents",
			lede: "24 templates shipped, editable, assignable by programme and by class.",
		},
		capabilities: [
			{
				fr: "Relevés, attestations, certificats de scolarité, diplômes",
				en: "Transcripts, attestations, enrolment certificates, diplomas",
			},
			{
				fr: "PV de session, PV de délibération, listes d'étudiants",
				en: "Session minutes, deliberation minutes, student lists",
			},
			{
				fr: "Ordres de paiement, reçus, quitus financiers",
				en: "Payment orders, receipts, financial clearance",
			},
			{
				fr: "Éditeur de modèles avec prévisualisation",
				en: "Template editor with preview",
			},
			{
				fr: "Modèle par défaut par établissement, surchargé par filière puis par classe",
				en: "Default template per institution, overridden by programme then by class",
			},
			{
				fr: "En-têtes à trois niveaux : ministère, université, faculté",
				en: "Three-level headers: ministry, university, faculty",
			},
			{
				fr: "Génération en lot, export ZIP",
				en: "Batch generation, ZIP export",
			},
			{
				fr: "QR d'authentification imprimé sur le document",
				en: "Authentication QR printed on the document",
				note: {
					fr: "Le QR porte les données d'identification du document (matricule, moyenne, mention, référence). Il n'ouvre pas de page de vérification en ligne.",
					en: "The QR carries the document's identifying data (registration number, average, mention, reference). It does not open an online verification page.",
				},
			},
			{
				fr: "Historique horodaté des documents téléchargés",
				en: "Timestamped history of downloaded documents",
			},
		],
	},
	{
		key: "fees",
		band: "bg-tk-accent-emerald text-white",
		fr: {
			name: "Frais de scolarité",
			lede: "Le recouvrement suivi dans le système, pas dans un tableur à côté.",
		},
		en: {
			name: "Tuition fees",
			lede: "Fee recovery tracked inside the system, not in a spreadsheet beside it.",
		},
		capabilities: [
			{
				fr: "Structures de frais par filière et par niveau, en tranches",
				en: "Fee structures by programme and level, in instalments",
			},
			{
				fr: "Affectation en masse par filière, année, classe ou liste d'étudiants",
				en: "Bulk assignment by programme, year, class or student list",
			},
			{
				fr: "Prévisualisation de l'impact avant toute affectation",
				en: "Impact preview before any assignment",
			},
			{
				fr: "Ordres de paiement, encaissements, reçus PDF",
				en: "Payment orders, payments recorded, PDF receipts",
			},
			{
				fr: "Import de relevé bancaire pour rapprochement en masse",
				en: "Bank statement import for bulk reconciliation",
				note: {
					fr: "Encaissement saisi ou rapproché par un agent. Pas de passerelle de paiement en ligne.",
					en: "Payments recorded or reconciled by staff. No online payment gateway.",
				},
			},
			{
				fr: "Remises et exonérations, tracées",
				en: "Discounts and exemptions, traced",
			},
			{
				fr: "Cinq portes indépendantes : inscription aux examens, relevé, diplôme, réinscription, génération de documents",
				en: "Five independent gates: exam registration, transcript, diploma, re-enrolment, document generation",
			},
			{
				fr: "Portail étudiant : solde, historique, reçus téléchargeables",
				en: "Student portal: balance, history, downloadable receipts",
			},
		],
	},
	{
		key: "attendance",
		band: "bg-tk-accent text-white",
		demo: "attendance",
		fr: {
			name: "Assiduité & emploi du temps",
			lede: "L'assiduité conditionne l'accès à l'examen, si vous le décidez.",
		},
		en: {
			name: "Attendance & timetable",
			lede: "Attendance gates exam access, if you decide it should.",
		},
		capabilities: [
			{
				fr: "Séances, feuilles de présence, saisie en masse",
				en: "Sessions, attendance sheets, bulk marking",
			},
			{
				fr: "Justificatifs d'absence déposés et validés",
				en: "Absence justifications uploaded and reviewed",
			},
			{
				fr: "Seuil d'assiduité et contrôle d'éligibilité aux examens",
				en: "Attendance threshold and exam eligibility check",
			},
			{
				fr: "Liste d'émargement d'examen générée puis verrouillée",
				en: "Exam roster generated then locked",
			},
			{
				fr: "Dispenses et dérogations individuelles, tracées",
				en: "Individual exemptions and overrides, traced",
			},
			{
				fr: "Emploi du temps avec détection de conflits",
				en: "Timetable with conflict detection",
			},
			{
				fr: "Import en masse et recopie d'une année sur l'autre",
				en: "Bulk import and year-to-year copy",
			},
			{
				fr: "Planification automatique des examens",
				en: "Automatic exam scheduling",
			},
		],
	},
	{
		key: "roles",
		band: "bg-tk-dark text-tk-on-dark",
		demo: "approvals",
		fr: {
			name: "Rôles, portails & validation",
			lede: "Huit rôles, six espaces de travail, une piste d'audit.",
		},
		en: {
			name: "Roles, portals & approval",
			lede: "Eight roles, six workspaces, one audit trail.",
		},
		capabilities: [
			{
				fr: "Hiérarchie de rôles transitive : direction, doyen, enseignant, éditeur de notes, scolarité, étudiant",
				en: "Transitive role hierarchy: management, dean, teacher, grade editor, registry, student",
			},
			{
				fr: "Espace enseignant : saisie, assiduité, emploi du temps, exports",
				en: "Teacher workspace: entry, attendance, timetable, exports",
			},
			{
				fr: "Espace doyen : file de validation, historique d'approbation, cohortes",
				en: "Dean workspace: approval queue, approval history, cohorts",
			},
			{
				fr: "Espace étudiant : notes, calendrier, emploi du temps, frais, documents",
				en: "Student workspace: marks, calendar, timetable, fees, documents",
			},
			{
				fr: "Portail tuteur ou parent, par lien d'accès",
				en: "Guardian or parent portal, by access link",
			},
			{
				fr: "Auto-inscription aux cours, encadrée par fenêtres d'ouverture",
				en: "Course self-enrolment, bounded by opening windows",
			},
			{
				fr: "Sept journaux d'audit distincts sur les actions sensibles",
				en: "Seven distinct audit logs on sensitive actions",
			},
		],
	},
	{
		key: "operations",
		band: "bg-tk-accent-emerald text-white",
		fr: {
			name: "Opérations en masse",
			lede: "Prévisualiser, exécuter pas à pas, annuler. L'argument de la réversibilité.",
		},
		en: {
			name: "Bulk operations",
			lede: "Preview, run step by step, roll back. The reversibility argument.",
		},
		capabilities: [
			{
				fr: "Onze traitements par lots : ouverture d'année, promotion, imports, documents, recalculs",
				en: "Eleven batch jobs: year setup, progression, imports, documents, recomputations",
			},
			{
				fr: "Prévisualisation systématique avant exécution",
				en: "Systematic preview before execution",
			},
			{
				fr: "Suivi pas à pas, journal par étape",
				en: "Step-by-step tracking, log per step",
			},
			{
				fr: "Annulation d'un traitement déjà exécuté",
				en: "Roll back a job that has already run",
			},
			{
				fr: "Détection des traitements bloqués",
				en: "Stalled-job detection",
			},
			{
				fr: "Import Excel et YAML : structure académique, personnes, inscriptions, notes",
				en: "Excel and YAML import: academic structure, people, enrolments, marks",
			},
			{
				fr: "Gabarits d'import téléchargeables",
				en: "Downloadable import templates",
			},
		],
	},
];

/** Deployment-gated or absent — stated plainly on the coverage page. */
export const NOT_IN_PRODUCT = {
	fr: [
		"Paiement en ligne par passerelle : les encaissements sont saisis ou rapprochés par vos agents.",
		"SMS et WhatsApp : les notifications partent par e-mail et dans l'application.",
		"Page publique de vérification de document : le QR porte les données, il n'ouvre pas de service en ligne.",
		"Signature électronique qualifiée : les PV sont horodatés, non signés cryptographiquement.",
		"Plateforme pédagogique : ni cours en ligne, ni devoirs, ni forums.",
		"Gestion RH et paie des enseignants.",
		"Application mobile native : l'interface est responsive, consultable au téléphone.",
	],
	en: [
		"Online payment gateway: payments are recorded or reconciled by your staff.",
		"SMS and WhatsApp: notifications are sent by e-mail and in-app.",
		"Public document verification page: the QR carries the data, it does not open an online service.",
		"Qualified electronic signature: minutes are timestamped, not cryptographically signed.",
		"Learning platform: no online courses, assignments or forums.",
		"HR and teacher payroll.",
		"Native mobile app: the interface is responsive and usable on a phone.",
	],
} as const;
