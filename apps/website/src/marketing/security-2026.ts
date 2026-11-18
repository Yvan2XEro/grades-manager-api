/**
 * Security, access control and data governance.
 *
 * Written for the two readers who decide whether a platform is allowed into an
 * institution and who are never the ones the marketing pages address: the IT
 * lead, who wants to know where the data sits and how to get it back, and the
 * supervising body, which wants to know who did what and when.
 *
 * As with `capabilities-2026.ts`, every line was checked against the server
 * code. TLS and hosting hardening are stated as deployment properties rather
 * than product features, because that is what they are — claiming them as
 * built-in would be the kind of overstatement this page exists to avoid.
 */

export type SecurityItem = {
	fr: { title: string; desc: string };
	en: { title: string; desc: string };
};

/** The eight business roles, in hierarchy order. Source: modules/authz. */
export const ROLES = [
	{
		fr: {
			name: "Direction générale",
			scope: "Tout le périmètre, plusieurs établissements",
		},
		en: { name: "Executive", scope: "Full scope, several institutions" },
	},
	{
		fr: { name: "Administration", scope: "Un établissement, tous les modules" },
		en: { name: "Administrator", scope: "One institution, every module" },
	},
	{
		fr: {
			name: "Doyen",
			scope: "Validation des notes, cohortes, délibérations",
		},
		en: { name: "Dean", scope: "Grade approval, cohorts, deliberations" },
	},
	{
		fr: {
			name: "Enseignant",
			scope: "Ses cours : saisie, assiduité, emploi du temps",
		},
		en: {
			name: "Teacher",
			scope: "Their courses: entry, attendance, timetable",
		},
	},
	{
		fr: {
			name: "Éditeur de notes",
			scope: "Saisie déléguée, sans accès au reste",
		},
		en: { name: "Grade editor", scope: "Delegated entry, nothing else" },
	},
	{
		fr: {
			name: "Scolarité",
			scope: "Dossiers, inscriptions, documents, frais",
		},
		en: { name: "Registry", scope: "Records, enrolment, documents, fees" },
	},
	{
		fr: { name: "Étudiant", scope: "Son dossier seul" },
		en: { name: "Student", scope: "Their own record only" },
	},
	{
		fr: {
			name: "Tuteur",
			scope: "Le dossier de son étudiant, par lien d'accès",
		},
		en: { name: "Guardian", scope: "Their student's record, by access link" },
	},
] as const;

/** The seven audit trails, named as the tables that carry them. */
export const AUDIT_TRAILS = [
	{
		fr: {
			what: "Modifications de notes",
			detail: "Ancienne valeur, nouvelle valeur, auteur, horodatage",
		},
		en: {
			what: "Grade changes",
			detail: "Old value, new value, author, timestamp",
		},
	},
	{
		fr: {
			what: "Cycle de vie des examens",
			detail: "Création, soumission, validation, verrouillage",
		},
		en: {
			what: "Exam lifecycle",
			detail: "Creation, submission, approval, locking",
		},
	},
	{
		fr: {
			what: "Accès aux cours",
			detail: "Qui a consulté quelle classe, et quand",
		},
		en: {
			what: "Course access",
			detail: "Who consulted which class, and when",
		},
	},
	{
		fr: {
			what: "Délibérations",
			detail: "Calculs, arbitrages de jury, motifs saisis",
		},
		en: {
			what: "Deliberations",
			detail: "Computations, jury overrides, reasons entered",
		},
	},
	{
		fr: { what: "Justificatifs d'absence", detail: "Dépôt, examen, décision" },
		en: { what: "Absence justifications", detail: "Upload, review, decision" },
	},
	{
		fr: {
			what: "Téléchargements de documents",
			detail: "Quel document, par qui, à quelle date",
		},
		en: {
			what: "Document downloads",
			detail: "Which document, by whom, on what date",
		},
	},
	{
		fr: {
			what: "Appels de l'API externe",
			detail: "Clé utilisée, endpoint, volume",
		},
		en: { what: "External API calls", detail: "Key used, endpoint, volume" },
	},
] as const;

export const SECURITY_ITEMS: SecurityItem[] = [
	{
		fr: {
			title: "Séparation du compte et du profil",
			desc: "L'identifiant de connexion et le profil institutionnel sont deux objets distincts. Une même personne peut porter plusieurs profils — enseignant dans une faculté, responsable dans une autre — sans multiplier les comptes ni mélanger les droits.",
		},
		en: {
			title: "Account and profile kept apart",
			desc: "The login identity and the institutional profile are two separate objects. One person can hold several profiles — teacher in one faculty, lead in another — without duplicate accounts or blended permissions.",
		},
	},
	{
		fr: {
			title: "Cloisonnement par établissement",
			desc: "Chaque requête est résolue dans le périmètre d'un établissement. Une donnée d'un établissement n'est jamais lisible depuis un autre, y compris pour les comptes qui appartiennent aux deux.",
		},
		en: {
			title: "Per-institution isolation",
			desc: "Every request resolves inside one institution's scope. Data from one institution is never readable from another, including for accounts that belong to both.",
		},
	},
	{
		fr: {
			title: "Hiérarchie de tutelle sur trois niveaux",
			desc: "Ministère, université, faculté ou institut : la chaîne de rattachement est portée par les données et se retrouve dans les en-têtes des documents officiels, sans configuration par document.",
		},
		en: {
			title: "Three-level supervision hierarchy",
			desc: "Ministry, university, faculty or institute: the chain of attachment is carried by the data and appears in official document headers, with no per-document setup.",
		},
	},
	{
		fr: {
			title: "Verrouillage irréversible des examens",
			desc: "Une fois l'examen verrouillé, plus aucune note ne peut être modifiée. Le verrouillage intervient à la validation ou automatiquement à l'expiration. C'est une contrainte du système, pas une consigne d'usage.",
		},
		en: {
			title: "Irreversible exam locking",
			desc: "Once an exam is locked, no mark can be changed. Locking happens on approval or automatically on expiry. It is a system constraint, not a policy reminder.",
		},
	},
	{
		fr: {
			title: "Clés d'API stockées hachées",
			desc: "Les clés d'intégration ne sont jamais conservées en clair : seule leur empreinte est enregistrée. Une clé perdue se révoque et se remplace, elle ne se retrouve pas.",
		},
		en: {
			title: "API keys stored hashed",
			desc: "Integration keys are never kept in the clear: only their hash is stored. A lost key is revoked and replaced, never recovered.",
		},
	},
	{
		fr: {
			title: "Réversibilité des traitements en masse",
			desc: "Les onze traitements par lots se prévisualisent avant exécution, se suivent étape par étape et s'annulent après coup. Une promotion d'année appliquée par erreur se défait.",
		},
		en: {
			title: "Reversible bulk operations",
			desc: "All eleven batch jobs preview before running, report step by step, and roll back afterwards. A year progression applied by mistake can be undone.",
		},
	},
	{
		fr: {
			title: "Export complet, à tout moment",
			desc: "Vos données académiques et personnelles restent votre propriété exclusive. L'export dans un format exploitable est disponible pendant toute la relation, et la lecture reste ouverte 90 jours après une résiliation.",
		},
		en: {
			title: "Full export, at any time",
			desc: "Your academic and personal data remain your exclusive property. Export in a usable format is available throughout the relationship, and read access stays open for 90 days after termination.",
		},
	},
	{
		fr: {
			title: "Trois modes d'hébergement",
			desc: "Cloud mutualisé, infrastructure dédiée, ou installation sur vos propres serveurs. Le choix vous appartient et il est réversible : les trois exécutent le même logiciel.",
		},
		en: {
			title: "Three hosting modes",
			desc: "Shared cloud, dedicated infrastructure, or installation on your own servers. The choice is yours and it is reversible: all three run the same software.",
		},
	},
];

/** Stated as deployment properties, not product claims. */
export const DEPLOYMENT_NOTE = {
	fr: "Le chiffrement TLS, la politique de sauvegarde et le durcissement du serveur relèvent du mode d'hébergement retenu. En cloud mutualisé et en infrastructure dédiée, ils sont assurés par l'éditeur et détaillés au contrat. En installation sur vos serveurs, ils relèvent de votre équipe informatique, et le transfert de compétences fait partie de la prestation d'installation.",
	en: "TLS encryption, backup policy and server hardening depend on the hosting mode chosen. On shared cloud and dedicated infrastructure they are handled by the publisher and detailed in the contract. On your own servers they belong to your IT team, and the knowledge transfer is part of the installation service.",
} as const;
