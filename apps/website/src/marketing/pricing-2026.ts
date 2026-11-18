/**
 * Commercial terms — the single source of truth for every figure on the site.
 *
 * Transcribed from `public/documents/Proposition commerciale TKAMS et QRCode
 * 2026.pdf` (réf. PC-ES / 2026-01). That document's own promise is the reason
 * this file exists:
 *
 *     « Tout montant qui ne figure pas dans ces pages ne pourra pas vous être
 *       facturé. »
 *
 * A public site that quotes different numbers than the signed proposal breaks
 * exactly that promise, so every price rendered anywhere on the site reads from
 * here. The previous site quoted 2 000 F / student, a 750 000 F floor and a
 * 1 500 000 F on-premise fee — all three were out of date.
 *
 * All amounts are FCFA, hors taxes.
 */

/** Per-student annual rate, degressive by headcount band (p. 10). */
export const STUDENT_BANDS = [
	{ upTo: 500, rate: 2_800, label: "du 1er au 500e étudiant" },
	{ upTo: 1_500, rate: 2_400, label: "du 501e au 1 500e" },
	{ upTo: Number.POSITIVE_INFINITY, rate: 2_000, label: "au-delà du 1 500e" },
] as const;

export const ADMIN_SEAT = 7_000;
/** Annual billing floor — applies below roughly 350 students (p. 10, p. 14). */
export const ANNUAL_FLOOR = 1_000_000;
export const ONPREM_INSTALL = 2_100_000;
/** Pioneer programme discount, written into the quote, not promised verbally. */
export const PIONEER_DISCOUNT = 0.1;

/** Migration, priced per dossier-année (p. 12). */
export const MIGRATION_BANDS = [
	{ upTo: 1_000, rate: 450 },
	{ upTo: 3_000, rate: 350 },
	{ upTo: Number.POSITIVE_INFINITY, rate: 250 },
] as const;
export const MIGRATION_FLOOR = 250_000;
/** Surcharge for paper archives or scanned PDFs. */
export const MIGRATION_PAPER_SURCHARGE = 0.4;

/**
 * Annual TKAMS licence for a given headcount.
 *
 * The bands are marginal, not cliff-edged: a 900-student institution pays 2 800
 * on its first 500 and 2 400 on the next 400. Admin seats scale at roughly one
 * per 100 students (the proposal's own worked examples: 200→3, 400→4, 800→6,
 * 1 500→10), and the floor applies to the total.
 */
export function annualLicence(students: number): {
	students: number;
	admins: number;
	studentCost: number;
	adminCost: number;
	subtotal: number;
	total: number;
	atFloor: boolean;
	perStudentMonth: number;
} {
	let remaining = students;
	let studentCost = 0;
	let previousCap = 0;

	for (const band of STUDENT_BANDS) {
		if (remaining <= 0) break;
		const bandSize = band.upTo - previousCap;
		const inBand = Math.min(remaining, bandSize);
		studentCost += inBand * band.rate;
		remaining -= inBand;
		previousCap = band.upTo;
	}

	const admins = adminSeats(students);
	const adminCost = admins * ADMIN_SEAT;
	const subtotal = studentCost + adminCost;
	const total = Math.max(ANNUAL_FLOOR, subtotal);

	return {
		students,
		admins,
		studentCost,
		adminCost,
		subtotal,
		total,
		atFloor: subtotal < ANNUAL_FLOOR,
		perStudentMonth: Math.round(total / students / 12),
	};
}

/**
 * Administrator seats.
 *
 * Fitted to the proposal's own simulation table (p. 14), which is the only
 * published statement of this ratio: 200→3, 350→3, 400→4, 800→6, 1 500→10.
 * The proposal notes these are an assumption — "Remplacez l'hypothèse
 * d'administrateurs par la vôtre" — so the estimator presents the resulting
 * figure as indicative rather than contractual.
 */
export function adminSeats(students: number): number {
	if (students <= 350) return 3;
	if (students <= 500) return 4;
	if (students <= 1_000) return 6;
	return Math.max(6, Math.round(students / 150));
}

/** Migration cost for a number of dossier-années (p. 12). */
export function migrationCost(
	dossierAnnees: number,
	fromPaper = false,
): number {
	let remaining = dossierAnnees;
	let cost = 0;
	let previousCap = 0;

	for (const band of MIGRATION_BANDS) {
		if (remaining <= 0) break;
		const bandSize = band.upTo - previousCap;
		const inBand = Math.min(remaining, bandSize);
		cost += inBand * band.rate;
		remaining -= inBand;
		previousCap = band.upTo;
	}

	const withSurcharge = fromPaper
		? cost * (1 + MIGRATION_PAPER_SURCHARGE)
		: cost;
	return Math.max(MIGRATION_FLOOR, Math.round(withSurcharge));
}

/** OnReceipt licences — fixed-term (p. 11). */
export const ONRECEIPT_TERM = [
	{
		key: "demo",
		name: "Démo",
		price: 0,
		duration: "Illimitée",
		seats: 1,
		support: "Documentation",
		limits: "Filigrane « DÉMO », mention « NON OFFICIEL », QR désactivés",
	},
	{
		key: "decouverte",
		name: "Découverte",
		price: 130_000,
		duration: "3 mois",
		seats: 1,
		support: "E-mail",
		limits: "Plafond de 150 documents · 1 h de formation à distance",
	},
	{
		key: "standard",
		name: "Standard",
		price: 250_000,
		duration: "1 an renouvelable",
		seats: 1,
		support: "E-mail + téléphone",
		limits: "À renouveler chaque année académique · 2 h de formation",
	},
	{
		key: "etablissement",
		name: "Établissement",
		price: 530_000,
		duration: "1 an renouvelable",
		seats: 3,
		support: "Prioritaire + sur site",
		limits: "Poste supplémentaire 110 000 FCFA · 4 h de formation",
	},
] as const;

/** OnReceipt licences — perpetual, single payment (p. 11). */
export const ONRECEIPT_PERPETUAL = [
	{
		key: "essentielle",
		name: "Essentielle",
		price: 770_000,
		updates: "3 ans",
		seats: 1,
		adds: "Génération illimitée, QR chiffrés, thèmes, historique, support e-mail, 2 h de formation",
	},
	{
		key: "premium",
		name: "Premium",
		price: 1_050_000,
		updates: "5 ans",
		seats: 2,
		adds: "+ 2 ans de MAJ, 2e poste, support téléphonique prioritaire, versions beta, formation de 3 personnes",
	},
	{
		key: "etablissement",
		name: "Établissement",
		price: 1_300_000,
		updates: "7 ans",
		seats: 5,
		adds: "+ 2 ans de MAJ, 5 postes, interventions sur site, formation illimitée, 1 000 dossiers-années de migration inclus",
	},
] as const;

export const ONRECEIPT_MAJ_EXTENSION = 100_000;

/** Options — never added to a quote without a written request (p. 13). */
export const OPTIONS = [
	{
		name: "Formation supplémentaire",
		price: "35 000 / h",
		note: "Utile en cas de rotation du personnel. Inutile avec la perpétuelle Établissement : formation illimitée.",
	},
	{
		name: "Personnalisation avancée",
		price: "85 000",
		note: "Gabarit inédit ou modification d'interface. Couleurs, logos, thèmes et profils multi-tutelle sont déjà inclus.",
	},
	{
		name: "Extension des mises à jour",
		price: "100 000 / an",
		note: "Prolonge MAJ et support d'une perpétuelle OnReceipt. 250 000 FCFA pour trois ans d'un coup.",
	},
	{
		name: "Support prioritaire",
		price: "55 000 / an",
		note: "Réponse garantie sous 4 heures ouvrées. Déjà inclus dans Établissement et TKAMS Pro.",
	},
	{
		name: "Poste supplémentaire",
		price: "110 000",
		note: "Installation additionnelle sur une licence OnReceipt, annuelle ou perpétuelle.",
	},
] as const;

/** What is explicitly outside the contract (p. 13) — the proposal's key page. */
export const NOT_INCLUDED_TKAMS = [
	"Votre connexion Internet et vos équipements",
	"Le matériel serveur en cas d'installation on-premise",
	"La saisie de données inexistantes : nous importons ce que vous avez, nous ne le reconstituons pas",
	"La validation pédagogique de vos maquettes de formation",
	"Les développements spécifiques hors palier Enterprise",
	"Les taxes applicables et les frais bancaires ou Mobile Money",
] as const;

export const NOT_INCLUDED_ONRECEIPT = [
	"Inscriptions, scolarité, frais, emplois du temps",
	"Saisie des notes par les enseignants et délibérations",
	"Portail ou application pour les étudiants",
	"Travail simultané : les données restent locales au poste",
	"Sauvegarde automatique hors du poste : l'export reste de votre responsabilité",
	"Postes au-delà du nombre prévu par la licence retenue",
] as const;

/**
 * The exclusions, with the fact a reader actually needs beside each one: who
 * carries it instead.
 *
 * The flat string list above states what we will not do; it does not say what
 * that means for the institution, which is the only reason anyone reads an
 * exclusions list. Pairing each line with its owner turns six refusals into six
 * answered questions, and gives the section a second column of real content
 * rather than empty space.
 */
export const NOT_INCLUDED_DETAIL = [
	{
		kind: "infra",
		fr: {
			item: "Votre connexion Internet et vos équipements",
			owner: "À votre charge",
			note: "TKAMS fonctionne sur un navigateur à jour ; aucune configuration poste par poste.",
		},
		en: {
			item: "Your internet connection and your equipment",
			owner: "Your responsibility",
			note: "TKAMS runs in an up-to-date browser; no per-workstation setup.",
		},
	},
	{
		kind: "infra",
		fr: {
			item: "Le matériel serveur en cas d'installation on-premise",
			owner: "À votre charge",
			note: "Nous fournissons le déploiement et la sécurisation, pas les machines.",
		},
		en: {
			item: "Server hardware for an on-premise installation",
			owner: "Your responsibility",
			note: "We provide deployment and hardening, not the machines.",
		},
	},
	{
		kind: "data",
		fr: {
			item: "La saisie de données inexistantes",
			owner: "Import, pas ressaisie",
			note: "Nous importons ce que vous avez, dans le format où vous l'avez. Nous ne le reconstituons pas.",
		},
		en: {
			item: "Entering data that does not exist",
			owner: "Import, not re-keying",
			note: "We import what you have, in the format you have it. We do not reconstruct it.",
		},
	},
	{
		kind: "academic",
		fr: {
			item: "La validation pédagogique de vos maquettes",
			owner: "Décision académique",
			note: "Le logiciel applique vos maquettes ; il ne se substitue pas à votre conseil pédagogique.",
		},
		en: {
			item: "Pedagogical validation of your course structures",
			owner: "An academic decision",
			note: "The software applies your structures; it does not stand in for your academic board.",
		},
	},
	{
		kind: "scope",
		fr: {
			item: "Les développements spécifiques hors palier Enterprise",
			owner: "Devis séparé",
			note: "Couleurs, logos, thèmes et profils multi-tutelle sont déjà inclus : ne payez pas cette ligne pour ça.",
		},
		en: {
			item: "Bespoke development outside the Enterprise tier",
			owner: "Separate quote",
			note: "Colours, logos, themes and multi-supervision profiles are already included — do not pay this line for those.",
		},
	},
	{
		kind: "legal",
		fr: {
			item: "Les taxes applicables et les frais bancaires",
			owner: "Hors montants annoncés",
			note: "Tous nos prix sont hors taxes. Les frais Mobile Money dépendent de votre opérateur.",
		},
		en: {
			item: "Applicable taxes and bank fees",
			owner: "Outside quoted amounts",
			note: "All our prices exclude tax. Mobile Money fees depend on your operator.",
		},
	},
] as const;

/** Guarantees (p. 17). */
export const GUARANTEES = [
	{
		name: "Conformité",
		detail:
			"Documents conformes aux standards des universités d'État. Rejet pour un motif de forme imputable au logiciel : correction sans frais.",
	},
	{
		name: "Satisfait ou remboursé",
		detail:
			"30 jours sur les licences OnReceipt, remboursement intégral, sans justification.",
	},
	{
		name: "Mises à jour",
		detail:
			"Continues sur TKAMS ; incluses 3, 5 ou 7 ans sur les perpétuelles selon la formule.",
	},
	{
		name: "Sécurité des données",
		detail:
			"TLS, contrôle d'accès par rôles, piste d'audit, clés API hachées. QR chiffrés AES-128 sur OnReceipt.",
	},
	{
		name: "Délais de support",
		detail:
			"Standard : 2 jours ouvrés. Prioritaire : 4 h ouvrées. Lun.–ven., 8h–17h, Douala.",
	},
	{
		name: "Réversibilité",
		detail:
			"Export complet à tout moment. Fin de contrat TKAMS : lecture et export maintenus 90 jours.",
	},
] as const;

/** Deployment timeline (p. 17). */
export const TIMELINE = [
	{
		step: "Jour 0",
		onreceipt: "Démonstration gratuite, remise du mode démo",
		tkams: "Démonstration gratuite, cadrage des besoins et de l'effectif",
	},
	{
		step: "Semaine 1",
		onreceipt: "Devis, bon de commande, acompte, installation, clé de licence",
		tkams: "Devis, contrat, création de l'instance, comptes administrateurs",
	},
	{
		step: "Semaine 2",
		onreceipt: "Paramétrage, logos, thèmes, structures UE/EC, formation",
		tkams: "Import Excel/YAML, paramétrage des filières et maquettes",
	},
	{
		step: "Semaines 3–4",
		onreceipt: "Production réelle du premier lot de documents",
		tkams: "Formation par rôle, saisie en double avec l'existant",
	},
	{
		step: "Semaines 5–6",
		onreceipt: "—",
		tkams: "Première délibération pilote, recette, bascule définitive",
	},
] as const;

/** Where each franc goes (p. 15). */
export const COST_BREAKDOWN = [
	{
		label: "Développement",
		pct: 30,
		detail:
			"Mises à jour continues, conformité aux évolutions de la tutelle, nouvelles fonctions.",
	},
	{
		label: "Support",
		pct: 26,
		detail:
			"Assistance, interventions sur site, déplacements Douala – Yaoundé.",
	},
	{
		label: "Infrastructure",
		pct: 22,
		detail: "Hébergement, sauvegardes quotidiennes, disponibilité, sécurité.",
	},
	{
		label: "Formation",
		pct: 12,
		detail: "Démarrage, formation, documentation.",
	},
	{ label: "Structure", pct: 10, detail: "Administration, marge." },
] as const;

/** The twelve differences that decide between the two products (p. 09). */
export const COMPARISON = [
	{
		criterion: "Nature",
		onreceipt: "Logiciel installé sur poste",
		tkams: "Plateforme web multi-utilisateurs",
	},
	{
		criterion: "Périmètre",
		onreceipt: "Relevés et attestations",
		tkams: "Toute la scolarité, admissions et frais compris",
	},
	{
		criterion: "Mise en service",
		onreceipt: "Le jour même à 48 h",
		tkams: "2 à 6 semaines selon la migration",
	},
	{
		criterion: "Modèle de prix",
		onreceipt: "Licence fixe, annuelle ou perpétuelle",
		tkams: "Abonnement annuel par étudiant",
	},
	{
		criterion: "Prix plancher",
		onreceipt: "0 (démo) puis 130 000 FCFA",
		tkams: "1 000 000 FCFA HT / an — palier minimum",
	},
	{
		criterion: "Effectif",
		onreceipt: "Aucune sensibilité : même prix à 80 ou 3 000",
		tkams: "Directe : la facture suit l'effectif déclaré",
	},
	{
		criterion: "Travail simultané",
		onreceipt: "1 à 5 postes, données locales",
		tkams: "Illimité, rôles et droits granulaires",
	},
	{
		criterion: "Anti-falsification",
		onreceipt: "QR chiffré AES-128 sur matricule",
		tkams: "Exports officiels, QR et piste d'audit",
	},
	{
		criterion: "Migration",
		onreceipt: "Barème par dossier-année",
		tkams: "Année en cours incluse, historiques au barème",
	},
	{
		criterion: "Internet",
		onreceipt: "Aucune dépendance, hors ligne",
		tkams: "Requis, sauf installation on-premise",
	},
	{
		criterion: "Sortie de contrat",
		onreceipt: "Perpétuelle : le logiciel reste utilisable",
		tkams: "Export complet, réversibilité 90 jours",
	},
	{
		criterion: "Choisissez-la si…",
		onreceipt: "…une échéance de tutelle vous presse maintenant",
		tkams: "…vous voulez régler le problème à la racine",
	},
] as const;

/** French number formatting, used everywhere amounts are rendered. */
export const fcfa = new Intl.NumberFormat("fr-FR");
