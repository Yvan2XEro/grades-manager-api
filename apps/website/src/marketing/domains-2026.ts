/**
 * The nine functional domains (commercial proposal, p. 06).
 *
 * "Toute l'année académique, de la candidature au diplôme. Neuf domaines
 * fonctionnels, une seule base de données, aucune ressaisie entre les modules."
 *
 * Kept here rather than in the i18n dictionary because the French text is
 * transcribed from a signed commercial document: it should read identically on
 * the site and in the proposal, and a translator editing `fr.ts` should not be
 * able to drift it by accident. The English is a translation of that source.
 */

export type Domain = {
	key: string;
	/** Rendered larger and on the violet ground when true. */
	featured?: boolean;
	fr: { name: string; desc: string };
	en: { name: string; desc: string };
};

export const DOMAINS: Domain[] = [
	{
		key: "students",
		fr: {
			name: "Étudiants & inscriptions",
			desc: "Candidatures en ligne, décisions d'admission motivées, matricule généré, dossier complet, affectation filière et niveau, réinscriptions, suivi de cohorte.",
		},
		en: {
			name: "Students & enrolment",
			desc: "Online applications, reasoned admission decisions, generated registration numbers, complete records, programme and level assignment, re-enrolment, cohort tracking.",
		},
	},
	{
		key: "curriculum",
		fr: {
			name: "Offre de formation LMD",
			desc: "Filières, parcours, maquettes, UE et EC, crédits ECTS, coefficients, prérequis, semestres et sessions : le référentiel LMD est natif, pas une surcouche.",
		},
		en: {
			name: "LMD course catalogue",
			desc: "Programmes, pathways, course structures, units and components, ECTS credits, coefficients, prerequisites, semesters and sessions: the LMD model is native, not a layer on top.",
		},
	},
	{
		key: "fees",
		fr: {
			name: "Frais de scolarité & paiements",
			desc: "Frais par filière et niveau, ordres de paiement, tranches, encaissements, reçus et quitus, soldes et impayés, relances, états de recouvrement — accès aux documents conditionné au paiement.",
		},
		en: {
			name: "Tuition fees & payments",
			desc: "Fees by programme and level, payment orders, instalments, receipts and clearance, balances and arrears, reminders, recovery statements — document access tied to payment.",
		},
	},
	{
		key: "courses",
		fr: {
			name: "Cours, assiduité, portail",
			desc: "Emploi du temps, séances, inscriptions aux cours, feuilles de présence, examens planifiés, portail consultable par l'étudiant et l'enseignant.",
		},
		en: {
			name: "Courses, attendance, portal",
			desc: "Timetable, sessions, course registration, attendance sheets, scheduled exams, a portal open to students and teachers.",
		},
	},
	{
		key: "grades",
		fr: {
			name: "Notes & moteur de règles",
			desc: "Saisie par enseignant, validation par responsable d'UE, contrôle continu et examens, moyennes pondérées automatiques, compensation et capitalisation selon vos critères.",
		},
		en: {
			name: "Marks & rules engine",
			desc: "Entry by teachers, validation by unit leads, continuous assessment and exams, automatic weighted averages, compensation and credit accumulation on your own criteria.",
		},
	},
	{
		key: "deliberation",
		featured: true,
		fr: {
			name: "Délibération & promotion",
			desc: "Sessions normales et de rattrapage, moteur de règles, décisions de jury, PV signé, promotion d'année : du brouillon au procès-verbal en trois heures.",
		},
		en: {
			name: "Deliberation & progression",
			desc: "Normal and resit sessions, rules engine, jury decisions, signed minutes, year progression: from draft to signed minutes in three hours.",
		},
	},
	{
		key: "documents",
		fr: {
			name: "Documents & vérification",
			desc: "24 modèles officiels : relevés, attestations, certificats, PV de session, listes et diplômes — tracés, horodatés et vérifiables par QR code.",
		},
		en: {
			name: "Documents & verification",
			desc: "24 official templates: transcripts, certificates, attestations, session minutes, lists and diplomas — traced, timestamped and verifiable by QR code.",
		},
	},
	{
		key: "security",
		fr: {
			name: "Rôles, sécurité, audit",
			desc: "Contrôle d'accès granulaire par rôles, chiffrement TLS, piste d'audit horodatée des actions sensibles, clés API stockées hachées.",
		},
		en: {
			name: "Roles, security, audit",
			desc: "Granular role-based access control, TLS encryption, timestamped audit trail on sensitive actions, API keys stored hashed.",
		},
	},
	{
		key: "multi",
		featured: true,
		fr: {
			name: "Multi-tutelle, multi-campus, reporting",
			desc: "Plusieurs tutelles en parallèle, règles et documents propres à chacune, reporting consolidé pour la direction. Import Excel/YAML dès la création de l'instance.",
		},
		en: {
			name: "Multi-supervision, multi-campus, reporting",
			desc: "Several supervising bodies in parallel, each with its own rules and documents, consolidated reporting for management. Excel/YAML import from instance creation.",
		},
	},
];

/**
 * The nine stages, with the two facts the bare list was missing: when each one
 * happens in the year, and who does it.
 *
 * Without those, nine equal cards carry one sentence each and the grid reads as
 * filler. With them, a registrar can find their own row at a glance — which is
 * the only thing that section is for.
 *
 * Keyed by the step number already in `dict.workflow.steps`, so the copy stays
 * in the dictionary and only the scheduling metadata lives here.
 */
export const WORKFLOW_META: Record<
	string,
	{ fr: { when: string; who: string }; en: { when: string; who: string } }
> = {
	"01": {
		fr: { when: "Avant la rentrée", who: "Scolarité" },
		en: { when: "Before the year opens", who: "Registrar" },
	},
	"02": {
		fr: { when: "Une fois, à l'ouverture", who: "Direction · DSI" },
		en: { when: "Once, at opening", who: "Management · IT" },
	},
	"03": {
		fr: { when: "Une fois, puis par avenant", who: "Direction des études" },
		en: { when: "Once, then by amendment", who: "Academic office" },
	},
	"04": {
		fr: { when: "Semaines 1 à 4", who: "Scolarité" },
		en: { when: "Weeks 1 to 4", who: "Registrar" },
	},
	"05": {
		fr: { when: "En continu", who: "Comptabilité · DSI" },
		en: { when: "Continuous", who: "Finance · IT" },
	},
	"06": {
		fr: { when: "Tout le semestre", who: "Enseignants" },
		en: { when: "All semester", who: "Teachers" },
	},
	"07": {
		fr: { when: "Fin de semestre", who: "Jury" },
		en: { when: "End of semester", who: "Jury" },
	},
	"08": {
		fr: { when: "Après le jury", who: "Scolarité" },
		en: { when: "After the jury", who: "Registrar" },
	},
	"09": {
		fr: { when: "Clôture de l'année", who: "Direction des études" },
		en: { when: "Year close", who: "Academic office" },
	},
};

/** Deployment modes, as named in the proposal (p. 06). */
export const DEPLOYMENT_MODES = [
	{ fr: "Cloud mutualisé", en: "Shared cloud" },
	{ fr: "Infrastructure dédiée", en: "Dedicated infrastructure" },
	{ fr: "On-premise", en: "On-premise" },
] as const;

/** Who benefits, and how (proposal p. 16). */
export const BENEFITS = {
	institution: {
		fr: {
			title: "Pour l'établissement",
			items: [
				"Conformité à la tutelle, donc moins de rejets",
				"Délibérations en heures, plus en semaines",
				"Zéro erreur de moyenne pondérée",
				"Documents à l'image de l'établissement",
				"Audit complet en cas de contrôle",
				"Crédibilité renforcée auprès des familles",
			],
		},
		en: {
			title: "For the institution",
			items: [
				"Compliance with the supervising body, so fewer rejections",
				"Deliberations in hours, not weeks",
				"Zero weighted-average errors",
				"Documents carrying the institution's identity",
				"A complete audit trail under inspection",
				"Stronger credibility with families",
			],
		},
	},
	students: {
		fr: {
			title: "Pour les étudiants",
			items: [
				"Documents reconnus immédiatement",
				"Authenticité vérifiable par QR code",
				"Délivrance en quelques minutes",
				"Présentation standardisée et professionnelle",
				"Version française ou anglaise selon le dossier visé",
				"Situation financière et notes consultables",
			],
		},
		en: {
			title: "For students",
			items: [
				"Documents recognised immediately",
				"Authenticity verifiable by QR code",
				"Issued within minutes",
				"Standardised, professional presentation",
				"French or English edition, depending on the application",
				"Financial position and marks available to consult",
			],
		},
	},
	administration: {
		fr: {
			title: "Pour l'administration",
			items: [
				"Fin des tâches répétitives de recopie",
				"Contrôle qualité automatique avant impression",
				"Archivage numérique organisé",
				"Rôles et responsabilités identifiés",
				"Recouvrement suivi sans tableur parallèle",
				"Personnel formé, pas laissé seul devant l'outil",
			],
		},
		en: {
			title: "For the administration",
			items: [
				"An end to repetitive re-keying",
				"Automatic quality control before printing",
				"Organised digital archiving",
				"Clear roles and responsibilities",
				"Fee recovery tracked without a parallel spreadsheet",
				"Trained staff, not left alone with the tool",
			],
		},
	},
} as const;
