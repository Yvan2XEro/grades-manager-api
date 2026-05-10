// ─── Palette LIGHT — identique à la version web (charte respectée) ────────────
export const C = {
	// Backgrounds
	bg: "#F7F4F0", // warm off-white
	bgCard: "#FFFFFF", // blanc pur — surfaces card
	bgCard2: "#EDE9E3",
	bgMuted: "#E8E3DC",
	sidebar: "#FDFCFA",

	// Borders
	border: "#DDD7CE",
	borderSub: "#E8E4DF",

	// Primary — violet web exact
	primary: "#5B4AD4",
	primaryDim: "#EDE9FC",
	primaryGlow: "rgba(91,74,212,0.08)",
	primaryGlowStrong: "rgba(91,74,212,0.16)",

	// Text
	text: "#1C1410",
	textMuted: "#6B5E52",
	textFaint: "#A89C92",

	// Status — identiques au web
	green: "#1A8F62",
	greenDim: "#E4F5EE",
	amber: "#A67C00",
	amberDim: "#FDF4DC",
	red: "#C03820",
	redDim: "#FAE9E3",
	violet: "#7B6AE8",

	// Pure
	white: "#FFFFFF",
	black: "#000000",
} as const;

// ─── Typographie ──────────────────────────────────────────────────────────────
export const F = {
	heading: "'Sora', ui-sans-serif, system-ui, sans-serif",
	body: "'Inter', ui-sans-serif, system-ui, sans-serif",
	mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

// ─── Vidéo ────────────────────────────────────────────────────────────────────
export const VIDEO = {
	width: 1920,
	height: 1080,
	fps: 30,
} as const;

// ─── Durées ───────────────────────────────────────────────────────────────────
// ─── Audio ───────────────────────────────────────────────────────────────────
// Place les fichiers dans apps/remotion/public/audio/
// background.mp3 → musique de fond instrumentale (ex. Pixabay "Corporate Ambient")
// transition.mp3 → whoosh court (~0.6s) entre les scènes
// reveal.mp3     → chime subtil (~0.3s) pour les éléments clés
export const AUDIO = {
	enabled: true, // Mettre false si les fichiers n'existent pas encore
	backgroundVolume: 0.3,
	transitionVolume: 0.14,
	revealVolume: 0.1,
} as const;

// Règle : DUR >= durée_audio_en_secondes × 30 + 30 frames de marge
// Exemple : voix de 11s → DUR minimum = 11 × 30 + 30 = 360 frames
export const DUR = {
	intro: 360, // 12s
	hero: 390, // 13s
	problem: 360, // 12s
	solution: 390, // 13s
	roles: 420, // 14s
	workflow: 450, // 15s
	screenshots: 390, // 13s
	deliberation: 420, // 14s
	techStack: 390, // 13s
	outro: 330, // 11s
} as const;
