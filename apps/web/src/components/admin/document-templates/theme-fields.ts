/**
 * Metadata about each theme group used by ThemeEditor.
 *
 * The shape of a document theme is `Record<groupKey, Record<fieldKey, value>>`.
 * For each group we declare which tab it belongs to, its visible label, and
 * an optional per-field label override / hint.
 */

export type ThemeTab = "typography" | "colors" | "sizes" | "options";

export type GroupMeta = {
	tab: ThemeTab;
	label: string;
	description?: string;
	fieldLabels?: Record<string, string>;
};

export const GROUP_META: Record<string, GroupMeta> = {
	fonts: {
		tab: "typography",
		label: "Polices",
		description:
			"Choisissez la police pour chaque zone (titre, corps, entête, etc.)",
	},
	sizes: {
		tab: "sizes",
		label: "Tailles de texte",
		description: "Tailles en points (pt) — ajustez selon la lisibilité.",
	},
	colors: {
		tab: "colors",
		label: "Couleurs",
		description: "Couleurs principales et accents.",
	},
	borders: {
		tab: "sizes",
		label: "Bordures",
		description: "Largeur des bordures décoratives en pixels.",
	},
	logos: {
		tab: "sizes",
		label: "Logos",
		description: "Tailles et offsets des logos en pixels.",
	},
	qrCode: {
		tab: "options",
		label: "QR code",
		description: "Affichage et taille du QR code.",
	},
	titleEffects: {
		tab: "typography",
		label: "Effets de titre",
		description: "Ombre, espacement et hauteur du titre.",
	},
	spacing: {
		tab: "sizes",
		label: "Espacements",
		description: "Marges entre les sections (mm).",
	},
	display: {
		tab: "options",
		label: "Affichage",
		description: "Bilingue, langue principale, options visuelles.",
	},
	watermark: {
		tab: "options",
		label: "Filigrane",
		description: "Texte et logo en filigrane (ORIGINAL, etc.).",
	},
	page: {
		tab: "options",
		label: "Format de page",
		description: "Format papier, orientation et marges (mm).",
	},
	table: {
		tab: "options",
		label: "Tableau",
		description: "Apparence des tableaux dans le relevé.",
	},
};

export const TAB_LABELS: Record<ThemeTab, string> = {
	typography: "Typographie",
	colors: "Couleurs",
	sizes: "Tailles",
	options: "Options",
};

export const FONT_LIST = [
	"Times New Roman, serif",
	"Georgia, serif",
	"Garamond, serif",
	"Palatino, serif",
	"Cambria, serif",
	"Baskerville, serif",
	"Book Antiqua, serif",
	"Didot, serif",
	"Bodoni MT, serif",
	"Constantia, serif",
	"Arial, sans-serif",
	"Helvetica, sans-serif",
	"Calibri, sans-serif",
	"Verdana, sans-serif",
	"Tahoma, sans-serif",
	"Trebuchet MS, sans-serif",
	"Segoe UI, sans-serif",
	"Open Sans, sans-serif",
	"Roboto, sans-serif",
	"Lato, sans-serif",
	"Montserrat, sans-serif",
	"Source Sans Pro, sans-serif",
];

const HUMAN_LABELS: Record<string, string> = {
	main: "Principale",
	title: "Titre",
	subtitle: "Sous-titre",
	header: "En-tête",
	legalText: "Texte légal",
	studentName: "Nom étudiant",
	studentInfo: "Infos étudiant",
	footer: "Pied de page",
	signature: "Signature",
	mention: "Mention",
	reference: "Référence",
	body: "Corps",
	table: "Tableau",
	tableHeader: "En-tête tableau",
	tableBody: "Corps tableau",
	primary: "Primaire",
	secondary: "Secondaire",
	accent: "Accent",
	fullName: "Nom complet",
	matricule: "Matricule",
	diplomaTitle: "Titre du diplôme",
	yearObtention: "Année d'obtention",
	juryDates: "Dates jury",
	outerBorder: "Bordure ext.",
	innerBorder: "Bordure int.",
	tableHeaderBg: "Fond en-tête",
	tableHeaderText: "Texte en-tête",
	tableBorder: "Bordure tableau",
	alternateRow: "Ligne alternée",
	passingGrade: "Note réussie",
	failingGrade: "Note échec",
	border: "Bordure",
	content: "Contenu",
	summary: "Résumé",
	referenceNumber: "Numéro de réf.",
	outerWidth: "Largeur ext.",
	innerWidth: "Largeur int.",
	rowHeight: "Hauteur ligne",
	borderWidth: "Largeur bordure",
	alternateRows: "Lignes alternées",
	showCoefficient: "Coefficient",
	showCredits: "Crédits",
	showAppreciation: "Appréciation",
	highlightFailures: "Surligner échecs",
	institutionLogoSize: "Logo institution",
	facultyLogoSize: "Logo faculté",
	universityLogoSize: "Logo université",
	ministryLogoSize: "Logo ministère",
	coatOfArmsSize: "Armoiries",
	watermarkLogoSize: "Logo filigrane",
	facultyLogoOffsetX: "Logo faculté X",
	facultyLogoOffsetY: "Logo faculté Y",
	coatOfArmsOffsetX: "Armoiries X",
	coatOfArmsOffsetY: "Armoiries Y",
	ministryLogoOffsetX: "Logo ministère X",
	ministryLogoOffsetY: "Logo ministère Y",
	enabled: "Activé",
	compactPayload: "QR compact",
	size: "Taille",
	offsetX: "Décalage X",
	offsetY: "Décalage Y",
	lineHeight: "Hauteur de ligne",
	letterSpacing: "Espacement lettres",
	shadow: "Ombre",
	shadowColor: "Couleur ombre",
	shadowOffsetX: "Ombre X",
	shadowOffsetY: "Ombre Y",
	shadowBlur: "Flou ombre",
	headerLineHeight: "Interligne en-tête",
	titleBlockMarginTop: "Marge titre haut",
	titleBlockMarginBottom: "Marge titre bas",
	ministerBlockMarginBottom: "Marge ministre bas",
	recipientBlockMarginBottom: "Marge destinataire bas",
	signatureBlockMarginTop: "Marge signature haut",
	sectionSpacing: "Espacement section",
	bodyLineHeight: "Interligne corps",
	paragraphSpacing: "Espacement paragraphe",
	bilingual: "Bilingue (FR/EN)",
	primaryLanguage: "Langue principale",
	showQRCode: "Afficher QR code",
	qrCodeSize: "Taille QR code",
	showSemesterBreakdown: "Détail par semestre",
	showRanking: "Afficher rang",
	showRefNumber: "N° de référence",
	showStamp: "Cachet",
	decorative: "Décoratif",
	text: "Texte",
	color: "Couleur",
	textOpacity: "Opacité texte",
	logoOpacity: "Opacité logo",
	logoSize: "Taille logo",
	textSize: "Taille texte",
	orientation: "Orientation",
	margins: "Marges",
	top: "Haut",
	right: "Droite",
	bottom: "Bas",
	left: "Gauche",
};

export function fieldLabel(group: string, field: string): string {
	const meta = GROUP_META[group];
	return (
		meta?.fieldLabels?.[field] ??
		HUMAN_LABELS[field] ??
		field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
	);
}

/**
 * Inspect a value to decide how to render it.
 * - hex string → color
 * - one of FONT_LIST → font select
 * - number → slider
 * - boolean → switch
 * - "french"|"english"|"A4"|"A3"|"Letter"|"portrait"|"landscape" → enum select
 */
export type FieldKind =
	| "color"
	| "font"
	| "number"
	| "boolean"
	| "page-size"
	| "page-orientation"
	| "language"
	| "text"
	| "object";

export function detectFieldKind(value: unknown, fieldKey?: string): FieldKind {
	if (typeof value === "boolean") return "boolean";
	if (typeof value === "number") return "number";
	if (typeof value === "string") {
		if (/^#[0-9a-f]{6}$/i.test(value)) return "color";
		if (FONT_LIST.includes(value)) return "font";
		if (value === "french" || value === "english") return "language";
		if (value === "portrait" || value === "landscape")
			return "page-orientation";
		if (value === "A4" || value === "A3" || value === "Letter")
			return "page-size";
		// Conservative fallbacks based on field name
		if (fieldKey?.toLowerCase().includes("color")) return "color";
		return "text";
	}
	if (value !== null && typeof value === "object") return "object";
	return "text";
}

/** Group ordering inside a tab — most-used groups first. */
export const TAB_GROUP_ORDER: Record<ThemeTab, string[]> = {
	typography: ["fonts", "titleEffects"],
	colors: ["colors"],
	sizes: ["sizes", "spacing", "borders", "logos"],
	options: ["display", "watermark", "qrCode", "page", "table"],
};
