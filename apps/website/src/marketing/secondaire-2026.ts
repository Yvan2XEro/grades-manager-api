/**
 * TKAMS Secondaire — functional coverage, read off `apps/secondary`.
 *
 * Same rule as `capabilities-2026.ts`: if the code does not do it, it does not
 * go on the page. That rule bites harder here, because this product is young
 * (version 0.0.1, thirteen commits) and several things a secondary school will
 * assume are present are genuinely absent — no parent portal, no timetable, no
 * receipts, no annual average. Those are stated on the page rather than left
 * for a prospect to discover during a pilot.
 *
 * Four traps the September 2026 audit caught, recorded so nobody re-adds them:
 *
 *   - Teacher comments are captured in a dedicated grid, but `studentComments`
 *     is read by no other module: the "Appréciation" column on the printed
 *     report card is derived from the average, not from what the teacher wrote.
 *     So the page says comments are captured, never that they print.
 *   - The class council's "Export PV" produces a CSV, not a signed PDF.
 *   - `annualAverages` is declared in the schema and never written, so there is
 *     no annual average and no end-of-year progression decision.
 *   - Official exams cover BEPC, Probatoire and Baccalauréat. Not CEP.
 */

export type SecFeature = {
	fr: string;
	en: string;
	note?: { fr: string; en: string };
};

export type SecDomain = {
	key: string;
	fr: { name: string; lede: string };
	en: { name: string; lede: string };
	features: SecFeature[];
};

export const SEC_DOMAINS: SecDomain[] = [
	{
		key: "mise-en-route",
		fr: {
			name: "Mise en route guidée",
			lede: "Sept étapes, les référentiels MINESEC déjà remplis. L'établissement est opérationnel sans prestation de paramétrage.",
		},
		en: {
			name: "Guided setup",
			lede: "Seven steps with the MINESEC reference data pre-filled. The school is operational without a configuration engagement.",
		},
		features: [
			{
				fr: "Profil de l'établissement : code MINESEC, type lycée, collège ou mixte, logo",
				en: "School profile: MINESEC code, type — lycée, collège or mixed — and logo",
			},
			{
				fr: "Année scolaire et ses trois trimestres, créés et activés",
				en: "Academic year and its three terms, created and activated",
			},
			{
				fr: "Six filières MINESEC pré-remplies : Scientifique C, Littéraire A, Économique G, Technique F, premier cycle",
				en: "Six MINESEC tracks pre-filled: Science C, Literary A, Economics G, Technical F, lower secondary",
			},
			{
				fr: "Neuf matières pré-remplies, modifiables : Mathématiques, Physique-Chimie, SVT, Français, Anglais, Histoire-Géographie, Philosophie, Économie, EPS",
				en: "Nine subjects pre-filled and editable: Mathematics, Physics-Chemistry, Biology, French, English, History-Geography, Philosophy, Economics, PE",
			},
			{
				fr: "Matrice des coefficients par filière et par matière",
				en: "Coefficient matrix by track and subject",
			},
			{
				fr: "Classes de la 6ᵉ à la Terminale, et personnel",
				en: "Classes from 6ᵉ to Terminale, and staff",
			},
			{
				fr: "Import CSV à chaque étape, avec modèle téléchargeable",
				en: "CSV import at every step, with a downloadable template",
				note: {
					fr: "Filières, matières, coefficients, classes et personnel s'importent en masse. Les élèves se saisissent un par un ou lors de la mise en route.",
					en: "Tracks, subjects, coefficients, classes and staff import in bulk. Students are entered one at a time or during setup.",
				},
			},
		],
	},
	{
		key: "notes",
		fr: {
			name: "Notes & séquences",
			lede: "Le modèle camerounais tel qu'il est : six séquences ou composition, notes sur 20, coefficients par filière.",
		},
		en: {
			name: "Marks & sequences",
			lede: "The Cameroonian model as it stands: six sequences or composition, marks out of 20, coefficients by track.",
		},
		features: [
			{
				fr: "Deux modes d'évaluation : six séquences ou composition",
				en: "Two assessment modes: six sequences or composition",
			},
			{
				fr: "Séquences filtrées selon le trimestre : 1 et 2 au premier, 3 et 4 au deuxième, 5 et 6 au troisième",
				en: "Sequences filtered by term: 1 and 2 in the first, 3 and 4 in the second, 5 and 6 in the third",
			},
			{
				fr: "Saisie au clavier, sans souris : Entrée, Tabulation, Ctrl+S",
				en: "Keyboard entry, no mouse needed: Enter, Tab, Ctrl+S",
			},
			{
				fr: "Chaque enseignant ne voit que ses classes et ses matières",
				en: "Each teacher sees only their own classes and subjects",
				note: {
					fr: "Restriction appliquée côté serveur, pas seulement masquée à l'écran.",
					en: "Enforced on the server, not merely hidden in the interface.",
				},
			},
			{
				fr: "Moyenne trimestrielle recalculée en direct pendant la saisie",
				en: "Term average recalculated live as marks are entered",
			},
			{
				fr: "Colonnes de référence : les autres séquences du trimestre restent visibles",
				en: "Reference columns: the term's other sequences stay visible",
			},
			{
				fr: "Statistiques immédiates : saisis, moyenne, minimum, maximum, manquants",
				en: "Immediate statistics: entered, average, minimum, maximum, missing",
			},
			{
				fr: "Absence distinguée d'un zéro",
				en: "An absence is distinguished from a zero",
			},
			{ fr: "Import et export CSV", en: "CSV import and export" },
			{
				fr: "Appréciations des professeurs, par élève et par matière",
				en: "Teacher comments, per student and per subject",
				note: {
					fr: "Saisies dans une grille dédiée et conservées. Elles ne figurent pas sur le bulletin imprimé : la colonne « Appréciation » du PDF est calculée à partir de la moyenne.",
					en: "Captured in a dedicated grid and stored. They do not appear on the printed report card: the PDF's comment column is derived from the average.",
				},
			},
		],
	},
	{
		key: "bulletins",
		fr: {
			name: "Bulletins trimestriels",
			lede: "Le livrable de l'établissement : un PDF A4 conforme, par élève ou par classe entière.",
		},
		en: {
			name: "Term report cards",
			lede: "The school's deliverable: a compliant A4 PDF, per student or for a whole class.",
		},
		features: [
			{
				fr: "Moyenne par matière, puis moyenne générale pondérée par les coefficients de la filière",
				en: "Average per subject, then a general average weighted by the track's coefficients",
			},
			{
				fr: "Rang de l'élève et effectif de la classe",
				en: "Student rank and class size",
			},
			{
				fr: "Mention automatique sur six paliers, du passable à l'excellence",
				en: "Automatic mention across six bands, from pass to outstanding",
			},
			{
				fr: "Nombre d'absences du trimestre, repris depuis l'assiduité",
				en: "Term absence count, carried over from attendance",
			},
			{
				fr: "Statistiques de la classe par matière : moyenne, minimum, maximum",
				en: "Class statistics per subject: average, minimum, maximum",
				note: {
					fr: "Affichées à l'écran lors de la relecture. Le PDF porte la moyenne de l'élève, pas celles de la classe.",
					en: "Shown on screen during review. The PDF carries the student's average, not the class figures.",
				},
			},
			{
				fr: "Bulletin en français ou en anglais, selon l'élève",
				en: "Report card in French or English, per student",
			},
			{
				fr: "En-tête à l'image de l'établissement : logo, nom, ville, code MINESEC",
				en: "Header carrying the school's identity: logo, name, city, MINESEC code",
			},
			{
				fr: "Génération pour une classe entière, en un seul PDF paginé",
				en: "Generation for a whole class, as a single paginated PDF",
			},
			{
				fr: "Photographie figée à la génération : le bulletin ne bouge plus si une note change ensuite",
				en: "Snapshot frozen at generation: the report card does not shift if a mark changes afterwards",
			},
			{
				fr: "Circuit de validation en six états, du brouillon à la publication",
				en: "Six-state approval flow, from draft to published",
			},
		],
	},
	{
		key: "conseils",
		fr: {
			name: "Conseils de classe",
			lede: "Un conseil par classe et par trimestre, avec le classement calculé avant la séance.",
		},
		en: {
			name: "Class councils",
			lede: "One council per class and per term, with the ranking computed before the meeting.",
		},
		features: [
			{
				fr: "Classement de la classe affiché en direct : rang, moyenne, nombre de notes",
				en: "Class ranking shown live: rank, average, number of marks",
			},
			{
				fr: "Président, secrétaire, date prévue et date de tenue",
				en: "Chair, secretary, scheduled date and date held",
			},
			{
				fr: "Quatre étapes : brouillon, programmé, tenu, signé",
				en: "Four stages: draft, scheduled, held, signed",
			},
			{
				fr: "Décision et observation par élève",
				en: "Decision and note per student",
				note: {
					fr: "Quatre décisions proposées : admis, ajourné, renvoyé, passage conditionnel.",
					en: "Four decisions offered: admitted, deferred, expelled, conditional pass.",
				},
			},
			{
				fr: "Observation générale du conseil",
				en: "Overall council note",
			},
			{
				fr: "Export du relevé de séance",
				en: "Export of the session record",
				note: {
					fr: "Export au format CSV, exploitable en tableur. Le procès-verbal signé reste à produire hors de l'outil.",
					en: "Exported as CSV, usable in a spreadsheet. The signed minutes are still produced outside the tool.",
				},
			},
		],
	},
	{
		key: "examens",
		fr: {
			name: "Examens d'État",
			lede: "BEPC, Probatoire et Baccalauréat : de l'inscription des candidats aux résultats.",
		},
		en: {
			name: "State examinations",
			lede: "BEPC, Probatoire and Baccalauréat: from candidate registration to results.",
		},
		features: [
			{
				fr: "Sessions par type d'examen, série, année, centre et date limite d'inscription",
				en: "Sessions by exam type, series, year, centre and registration deadline",
			},
			{
				fr: "Séries prises en charge : A4, C, D, TI, F3, F4, A5",
				en: "Series supported: A4, C, D, TI, F3, F4, A5",
			},
			{
				fr: "Inscription d'un candidat, ou d'une classe entière en une opération",
				en: "Register one candidate, or a whole class in a single operation",
			},
			{
				fr: "Contrôle du Matricule National Unique : un élève sans MNU est signalé, pas inscrit en silence",
				en: "National registration number check: a student without one is flagged, not silently registered",
			},
			{
				fr: "Éligibilité calculée automatiquement sur la moyenne, seuil paramétrable",
				en: "Eligibility computed automatically from the average, with a configurable threshold",
			},
			{
				fr: "Frais d'examen : montant, date, référence de transaction",
				en: "Exam fees: amount, date, transaction reference",
			},
			{
				fr: "Résultats et mentions par candidat",
				en: "Results and mentions per candidate",
			},
			{
				fr: "Deux listes officielles en PDF : éligibilité et candidats",
				en: "Two official PDF lists: eligibility and candidates",
			},
			{ fr: "Export CSV des candidats", en: "CSV export of candidates" },
		],
	},
	{
		key: "assiduite",
		fr: {
			name: "Assiduité",
			lede: "Séance par séance, avec remontée automatique au bulletin.",
		},
		en: {
			name: "Attendance",
			lede: "Session by session, feeding the report card automatically.",
		},
		features: [
			{
				fr: "Séances datées, avec matière, surveillant et horaires",
				en: "Dated sessions, with subject, supervisor and times",
			},
			{
				fr: "Quatre états : présent, absent, en retard, excusé",
				en: "Four states: present, absent, late, excused",
			},
			{
				fr: "Motif de justification saisissable",
				en: "Justification reason can be recorded",
			},
			{
				fr: "Feuille de présence remplie en une fois pour toute la classe",
				en: "Attendance sheet filled in one pass for the whole class",
			},
			{
				fr: "Historique par élève, filtrable par classe et par période",
				en: "Per-student history, filterable by class and period",
			},
			{
				fr: "Compteur d'absences repris sur le bulletin du trimestre",
				en: "Absence count carried onto the term report card",
			},
		],
	},
	{
		key: "finance",
		fr: {
			name: "Frais de scolarité",
			lede: "Scolarité et cotisation APE, encaissées par les canaux réellement utilisés au Cameroun.",
		},
		en: {
			name: "School fees",
			lede: "Tuition and parents' association dues, collected through the channels actually used in Cameroon.",
		},
		features: [
			{
				fr: "Barème par année scolaire, et par classe si nécessaire",
				en: "Fee schedule per academic year, and per class where needed",
			},
			{
				fr: "Scolarité et cotisation APE distinguées",
				en: "Tuition and parents' association dues kept separate",
			},
			{
				fr: "Échéances : date, montant, libellé",
				en: "Instalments: date, amount, label",
			},
			{
				fr: "Cinq moyens de paiement : espèces, MTN Mobile Money, Orange Money, virement, Campost",
				en: "Five payment methods: cash, MTN Mobile Money, Orange Money, bank transfer, Campost",
				note: {
					fr: "Encaissements saisis par un agent. Aucune passerelle de paiement en ligne : l'élève ne paie pas depuis l'application.",
					en: "Payments recorded by staff. No online payment gateway: students do not pay from the application.",
				},
			},
			{
				fr: "Total encaissé par élève, consultable depuis sa fiche",
				en: "Total collected per student, visible from their record",
				note: {
					fr: "Le total des versements est affiché. Le calcul du reste à payer, les relances et le blocage en cas d'impayé ne sont pas dans cette édition.",
					en: "The sum of payments is shown. Outstanding-balance computation, reminders and payment-based blocking are not in this edition.",
				},
			},
		],
	},
	{
		key: "exploitation",
		fr: {
			name: "Comptes & exploitation",
			lede: "Trois rôles, deux langues, et un déploiement qui tient sur un serveur d'établissement.",
		},
		en: {
			name: "Accounts & operations",
			lede: "Three roles, two languages, and a deployment that fits on a school server.",
		},
		features: [
			{
				fr: "Trois espaces : administration, direction, enseignant",
				en: "Three workspaces: administration, management, teacher",
				note: {
					fr: "L'espace direction est aujourd'hui en consultation : tableau de bord et bulletins.",
					en: "The management workspace is read-only today: dashboard and report cards.",
				},
			},
			{
				fr: "Double authentification par application d'authentification",
				en: "Two-factor authentication by authenticator app",
			},
			{
				fr: "Interface en français ou en anglais",
				en: "Interface in French or English",
			},
			{
				fr: "Plusieurs établissements sur une même installation, strictement cloisonnés",
				en: "Several schools on one installation, strictly partitioned",
			},
			{
				fr: "Déploiement Docker, base PostgreSQL ou base embarquée",
				en: "Docker deployment, PostgreSQL or embedded database",
			},
			{
				fr: "Stockage des fichiers sur le serveur ou sur un stockage objet compatible S3",
				en: "File storage on the server or on S3-compatible object storage",
			},
		],
	},
];

/** Stated plainly, because a school will ask about every one of these. */
export const SEC_NOT_INCLUDED = {
	fr: [
		"Espace parent ou élève : l'application est utilisée par l'établissement. Les familles reçoivent le bulletin imprimé.",
		"Envoi de SMS, e-mails ou notifications aux parents.",
		"Emplois du temps et gestion des salles.",
		"Reçus de paiement, suivi des impayés et relances.",
		"Moyenne annuelle et décision de passage de fin d'année : le calcul est trimestriel.",
		"Procès-verbal de conseil signé en PDF : l'export est un tableur.",
		"Certificat d'études primaires (CEP) : les examens couverts sont le BEPC, le Probatoire et le Baccalauréat.",
		"Sanctions disciplinaires et suivi des retards cumulés.",
		"Import d'élèves en masse hors de la mise en route.",
	],
	en: [
		"Parent or student portal: the application is used by the school. Families receive the printed report card.",
		"SMS, e-mail or push notifications to parents.",
		"Timetables and room management.",
		"Payment receipts, arrears tracking and reminders.",
		"Annual average and end-of-year progression decision: computation is per term.",
		"Signed council minutes as PDF: the export is a spreadsheet.",
		"Primary school certificate (CEP): the examinations covered are BEPC, Probatoire and Baccalauréat.",
		"Disciplinary sanctions and cumulative lateness tracking.",
		"Bulk student import outside the guided setup.",
	],
} as const;

/**
 * What separates the two editions. Drawn from the schema comparison: 19 tables
 * against 77, and a different unit of account at every level.
 */
export const EDITIONS = [
	{
		fr: {
			criterion: "Découpage de l'année",
			sec: "Trois trimestres",
			sup: "Semestres LMD",
		},
		en: {
			criterion: "Year structure",
			sec: "Three terms",
			sup: "LMD semesters",
		},
	},
	{
		fr: { criterion: "Unité d'enseignement", sec: "Matières", sup: "UE et EC" },
		en: {
			criterion: "Teaching unit",
			sec: "Subjects",
			sup: "Units and components",
		},
	},
	{
		fr: {
			criterion: "Pondération",
			sec: "Coefficients par filière",
			sup: "Crédits ECTS",
		},
		en: {
			criterion: "Weighting",
			sec: "Coefficients by track",
			sup: "ECTS credits",
		},
	},
	{
		fr: {
			criterion: "Structure",
			sec: "Filières A, C, D, G, F · 6ᵉ à Terminale",
			sup: "Filières, parcours, cycles, niveaux",
		},
		en: {
			criterion: "Structure",
			sec: "Tracks A, C, D, G, F · 6ᵉ to Terminale",
			sup: "Programmes, pathways, cycles, levels",
		},
	},
	{
		fr: {
			criterion: "Fin de période",
			sec: "Conseil de classe",
			sup: "Délibération à moteur de règles",
		},
		en: {
			criterion: "End of period",
			sec: "Class council",
			sup: "Rules-engine deliberation",
		},
	},
	{
		fr: {
			criterion: "Examens",
			sec: "BEPC, Probatoire, Baccalauréat",
			sup: "Examens internes et rattrapages",
		},
		en: {
			criterion: "Examinations",
			sec: "BEPC, Probatoire, Baccalauréat",
			sup: "Internal exams and resits",
		},
	},
	{
		fr: {
			criterion: "Document délivré",
			sec: "Bulletin trimestriel",
			sup: "Relevés, attestations, diplômes",
		},
		en: {
			criterion: "Document issued",
			sec: "Term report card",
			sup: "Transcripts, attestations, diplomas",
		},
	},
] as const;
