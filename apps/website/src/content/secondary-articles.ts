import type { Post } from "../payload-types";

type Article = {
	slug: string;
	title: string;
	description: string;
	sections: { heading: string; paragraphs: string[] }[];
};

// Editorial sources: apps/secondary modules and client pages, checked September 2026.
// These are public school workflows; system administration and test fixtures are excluded.
export const secondaryArticles: Article[] = [
	{
		slug: "tkams-secondaire-disponible-colleges-lycees",
		title: "TKAMS accompagne désormais aussi les collèges et lycées",
		description:
			"TKAMS Secondaire est disponible : élèves, classes, notes, bulletins et suivi scolaire, dans la continuité de notre expertise académique.",
		sections: [
			{
				heading: "Une nouvelle étape pour TKAMS",
				paragraphs: [
					"TKAMS Secondaire est désormais disponible. Les collèges et lycées disposent d’un parcours conçu autour de leur année scolaire : inscriptions, organisation des classes, travail des enseignants, bulletins trimestriels et suivi des élèves.",
					"TKAMS est né au contact des établissements d’enseignement supérieur. Les universités, grandes écoles et instituts conservent leur offre dédiée au LMD, avec ses unités d’enseignement, crédits, délibérations et parcours de diplomation. L’arrivée du secondaire prolonge cette expertise avec les outils et le vocabulaire propres à la vie scolaire.",
				],
			},
			{
				heading: "Un dossier élève qui accompagne le travail de l’équipe",
				paragraphs: [
					"L’établissement peut créer les dossiers élèves, les inscrire dans une classe et consulter les effectifs de l’année scolaire. Les informations de scolarité, les notes, les frais et l’assiduité se retrouvent depuis les parcours dédiés à l’élève.",
					"La direction organise les séries, les matières et leurs coefficients, puis affecte les enseignants aux classes et matières concernées. Les enseignants disposent ainsi du contexte nécessaire pour saisir les notes et les appréciations de leurs élèves.",
				],
			},
			{
				heading: "Préparer les échéances du trimestre",
				paragraphs: [
					"La génération des bulletins s’appuie sur les notes enregistrées et les coefficients configurés. Moyennes pondérées et rangs permettent de préparer la lecture des résultats. Les conseils de classe disposent d’un espace pour consigner les décisions et les observations de l’équipe pédagogique.",
					"Le suivi quotidien comprend aussi les présences et absences, l’enregistrement des règlements et la consultation des soldes de frais scolaires. Pour les examens officiels, les équipes peuvent organiser les sessions, enregistrer les candidats et préparer leurs listes.",
				],
			},
			{
				heading: "Découvrir le parcours de votre établissement",
				paragraphs: [
					"L’interface est disponible en français et en anglais. Un démarrage guidé aide à préparer l’année scolaire, les séries, matières, coefficients, classes et membres de l’équipe, avec des modèles CSV pour les données de configuration.",
					"Vous dirigez un collège ou un lycée ? Présentez votre organisation, vos effectifs et vos besoins à l’équipe TKAMS pour une démonstration du secondaire. Vous représentez un établissement supérieur ? Votre parcours LMD reste accessible depuis la présentation du produit.",
				],
			},
		],
	},
	{
		slug: "notes-bulletins-conseils-classe-tkams-secondaire",
		title:
			"Des notes au conseil de classe : le parcours du trimestre avec TKAMS Secondaire",
		description:
			"Découvrez comment les affectations, notes, coefficients, bulletins et décisions du conseil de classe s’articulent dans TKAMS Secondaire.",
		sections: [
			{
				heading: "Préparer les classes avant la saisie",
				paragraphs: [
					"La préparation d’un trimestre commence par une organisation claire : une année scolaire active, des élèves inscrits dans leurs classes, un catalogue de matières et des coefficients définis pour les séries concernées. Ces éléments donnent leur contexte aux notes qui seront saisies.",
					"L’affectation d’un enseignant relie une personne, une classe et une matière pour l’année scolaire. Elle détermine les classes et matières proposées à l’enseignant dans son parcours de saisie. La direction prépare ces affectations avant le travail de notation.",
				],
			},
			{
				heading: "Saisir les notes et les appréciations",
				paragraphs: [
					"L’enseignant sélectionne sa classe, sa matière et le trimestre. Il retrouve les élèves inscrits et saisit les notes des évaluations. Les appréciations permettent de compléter la lecture des résultats par un retour pédagogique.",
					"Avant de préparer les bulletins, l’équipe vérifie que les notes attendues sont enregistrées et que les coefficients correspondent bien à l’organisation de l’établissement. Un calcul automatique reste tributaire des données qui lui sont fournies.",
				],
			},
			{
				heading: "Générer et relire les bulletins",
				paragraphs: [
					"TKAMS Secondaire calcule les moyennes pondérées à partir des notes et coefficients, ainsi que le rang. L’équipe peut consulter les bulletins trimestriels et produire leurs versions PDF. La génération par classe facilite la préparation d’un ensemble de bulletins.",
					"La relecture reste une étape de travail utile : identité de l’élève, classe, matières, résultats et appréciations doivent correspondre au trimestre concerné. Le bulletin sert de support commun à la direction et aux enseignants pour examiner la situation de chaque élève.",
				],
			},
			{
				heading: "Consigner les décisions pédagogiques",
				paragraphs: [
					"Le conseil de classe est organisé pour une classe et un trimestre. L’équipe consulte les résultats et enregistre les décisions et observations pour les élèves concernés. Les décisions sont prises par l’équipe pédagogique ; le logiciel permet de les consigner.",
					"Cette continuité entre affectations, saisie, bulletins et conseil de classe structure le travail de fin de trimestre. Pour découvrir ce parcours avec les besoins de votre collège ou lycée, demandez une démonstration de TKAMS Secondaire.",
				],
			},
		],
	},
	{
		slug: "preparer-rentree-tkams-secondaire",
		title:
			"Préparer la rentrée de votre collège ou lycée avec TKAMS Secondaire",
		description:
			"Année scolaire, séries, matières, classes et équipe : les données à préparer pour démarrer votre établissement dans TKAMS Secondaire.",
		sections: [
			{
				heading: "Commencer par les repères de l’établissement",
				paragraphs: [
					"Le démarrage guidé de TKAMS Secondaire accompagne la préparation d’un établissement sans année scolaire configurée. La première étape rassemble les informations de l’établissement, puis le libellé et les dates de l’année scolaire.",
					"Préparer ces informations avant la saisie permet à l’équipe de travailler sur une référence commune. Le découpage en trimestres structure ensuite les opérations de notation et de préparation des bulletins.",
				],
			},
			{
				heading: "Construire le catalogue pédagogique",
				paragraphs: [
					"Rassemblez les séries, les matières et les coefficients correspondants. Les codes des séries et des matières servent de repères dans les fichiers d’import : un code utilisé pour affecter un coefficient doit correspondre à une matière présente dans le catalogue.",
					"Des modèles CSV accompagnent la préparation des données de configuration. Il est utile de les télécharger, de conserver leurs colonnes et de vérifier les correspondances entre fichiers avant l’import. Une série, une matière et un coefficient doivent décrire la même organisation pédagogique.",
				],
			},
			{
				heading: "Préparer les classes et les enseignants",
				paragraphs: [
					"Les classes précisent notamment leur niveau et leur série. Une fois leur structure préparée, l’établissement peut enregistrer son équipe puis organiser les affectations des enseignants aux classes et matières.",
					"L’inscription des élèves se poursuit depuis les parcours de gestion des élèves. L’équipe peut inscrire un élève lors de la création de sa fiche ou depuis un dossier existant, puis retrouver les effectifs dans la classe concernée.",
				],
			},
			{
				heading: "Organiser les premières semaines",
				paragraphs: [
					"Après le démarrage, les pages de gestion permettent de poursuivre le travail sur les classes, matières, séries et membres de l’équipe. Les enseignants peuvent préparer la saisie des notes ; les personnes chargées du suivi scolaire retrouvent les parcours d’assiduité et de frais scolaires.",
					"Les règlements sont enregistrés pour suivre les montants payés et les soldes. Sélectionner un mode de paiement documente un règlement ; cela ne déclenche pas une transaction auprès d’un opérateur de paiement.",
					"Pour préparer votre démarrage, contactez l’équipe TKAMS avec vos effectifs, votre organisation des classes et vos besoins. Une démonstration permet de parcourir ces étapes dans le contexte de votre établissement, en français ou en anglais.",
				],
			},
		],
	},
];

function block(type: "heading" | "paragraph", text: string) {
	return {
		type,
		version: 1,
		format: "" as const,
		indent: 0,
		direction: "ltr" as const,
		...(type === "heading" ? { tag: "h2" } : { textFormat: 0, textStyle: "" }),
		children: [
			{
				type: "text",
				version: 1,
				text,
				format: 0,
				detail: 0,
				mode: "normal",
				style: "",
			},
		],
	};
}

export function toPayloadDraft(
	article: Article,
): Pick<Post, "title" | "slug" | "content" | "meta" | "_status"> {
	return {
		title: article.title,
		slug: article.slug,
		_status: "draft",
		meta: {
			title: `${article.title} — TKAMS`,
			description: article.description,
		},
		content: {
			root: {
				type: "root",
				version: 1,
				format: "",
				indent: 0,
				direction: "ltr",
				children: [
					...article.sections.flatMap((section) => [
						block("heading", section.heading),
						...section.paragraphs.map((p) => block("paragraph", p)),
					]),
					{
						...block("paragraph", ""),
						children: [
							{
								type: "link",
								version: 3,
								format: "",
								indent: 0,
								direction: "ltr",
								fields: {
									linkType: "custom",
									url: "/secondaire",
									newTab: false,
								},
								children: block(
									"paragraph",
									"Découvrir TKAMS Secondaire et demander une démonstration",
								).children,
							},
						],
					},
				],
			},
		},
	};
}
