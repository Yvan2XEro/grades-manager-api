/**
 * Micro-interaction sounds via Web Audio API.
 * Features: volume control, 4 themes, pitch variation on clicks.
 */

export type SoundTheme = "default" | "soft" | "playful" | "minimal";

interface ThemeConfig {
	gainMult: number;
	freqMult: number;
	decayMult: number;
}

const THEMES: Record<SoundTheme, ThemeConfig> = {
	default: { gainMult: 1.0, freqMult: 1.0, decayMult: 1.0 },
	soft: { gainMult: 0.65, freqMult: 0.88, decayMult: 1.5 },
	playful: { gainMult: 1.1, freqMult: 1.18, decayMult: 0.75 },
	minimal: { gainMult: 0.22, freqMult: 1.0, decayMult: 0.8 },
};

const VOLUME_KEY = "ui-sound-volume";
const THEME_KEY = "ui-sound-theme";
const ENABLED_KEY = "ui-sounds-enabled";

let ctx: AudioContext | null = null;
let masterVolume = 0.75;
let currentTheme: SoundTheme = "default";
let soundEnabled = true;

// Init from localStorage
try {
	const v = localStorage.getItem(VOLUME_KEY);
	if (v !== null) masterVolume = Math.max(0, Math.min(1, Number.parseFloat(v)));
	const t = localStorage.getItem(THEME_KEY);
	if (t && t in THEMES) currentTheme = t as SoundTheme;
	const e = localStorage.getItem(ENABLED_KEY);
	if (e !== null) soundEnabled = e !== "false";
} catch {
	// ignore
}

function getCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}

function mkGain(ac: AudioContext, value: number): GainNode {
	const g = ac.createGain();
	g.gain.value = value;
	g.connect(ac.destination);
	return g;
}

function applyTheme(
	baseGain: number,
	baseFreq: number,
): [number, number, ThemeConfig] {
	const t = THEMES[currentTheme];
	return [baseGain * masterVolume * t.gainMult, baseFreq * t.freqMult, t];
}

function osc(
	ac: AudioContext,
	dest: GainNode,
	freq: number,
	type: OscillatorType,
	start: number,
	dur: number,
) {
	const o = ac.createOscillator();
	o.type = type;
	o.frequency.value = freq;
	o.connect(dest);
	o.start(start);
	o.stop(start + dur);
}

/** Click — pitch cycles through 5 notes to avoid monotony */
const CLICK_PITCHES = [1100, 1180, 1050, 1230, 1080];
let clickIdx = 0;

export function playClick() {
	const ac = getCtx();
	const baseFreq = CLICK_PITCHES[clickIdx++ % CLICK_PITCHES.length];
	const [g, freq, t] = applyTheme(0.075, baseFreq);
	const dur = 0.05 * t.decayMult;
	const node = mkGain(ac, g);
	const now = ac.currentTime;
	node.gain.setValueAtTime(g, now);
	node.gain.exponentialRampToValueAtTime(0.001, now + dur);
	osc(ac, node, freq, "sine", now, dur);
}

/** Soft pop — modal/dialog open */
export function playOpen() {
	const ac = getCtx();
	const [g, freq, t] = applyTheme(0.07, 370);
	const dur = 0.13 * t.decayMult;
	const node = mkGain(ac, 0.001);
	const now = ac.currentTime;
	node.gain.setValueAtTime(0.001, now);
	node.gain.linearRampToValueAtTime(g, now + 0.012);
	node.gain.exponentialRampToValueAtTime(0.001, now + dur);
	const o = ac.createOscillator();
	o.type = "sine";
	o.frequency.setValueAtTime(freq * 0.88, now);
	o.frequency.linearRampToValueAtTime(freq * 1.12, now + dur);
	o.connect(node);
	o.start(now);
	o.stop(now + dur);
}

/** Inverse pop — modal/dialog close */
export function playClose() {
	const ac = getCtx();
	const [g, freq, t] = applyTheme(0.06, 480);
	const dur = 0.1 * t.decayMult;
	const node = mkGain(ac, g);
	const now = ac.currentTime;
	node.gain.setValueAtTime(g, now);
	node.gain.exponentialRampToValueAtTime(0.001, now + dur);
	const o = ac.createOscillator();
	o.type = "sine";
	o.frequency.setValueAtTime(freq, now);
	o.frequency.exponentialRampToValueAtTime(freq * 0.55, now + dur);
	o.connect(node);
	o.start(now);
	o.stop(now + dur);
}

/** Two ascending notes — success */
export function playSuccess() {
	const ac = getCtx();
	const [g, , t] = applyTheme(0.1, 660);
	const now = ac.currentTime;
	const freqA = 660 * THEMES[currentTheme].freqMult;
	const freqB = 880 * THEMES[currentTheme].freqMult;
	const dur = 0.18 * t.decayMult;

	const makeNote = (freq: number, start: number) => {
		const n = mkGain(ac, 0.001);
		n.gain.setValueAtTime(0.001, start);
		n.gain.linearRampToValueAtTime(g, start + 0.018);
		n.gain.exponentialRampToValueAtTime(0.001, start + dur);
		osc(ac, n, freq, "sine", start, dur);
	};
	makeNote(freqA, now);
	makeNote(freqB, now + 0.11);
}

/** Descending buzz — error */
export function playError() {
	const ac = getCtx();
	const [g, freq, t] = applyTheme(0.09, 280);
	const dur = 0.22 * t.decayMult;
	const node = mkGain(ac, g);
	const now = ac.currentTime;
	node.gain.setValueAtTime(g, now);
	node.gain.exponentialRampToValueAtTime(0.001, now + dur);
	const o = ac.createOscillator();
	o.type = "sawtooth";
	o.frequency.setValueAtTime(freq, now);
	o.frequency.exponentialRampToValueAtTime(freq * 0.43, now + dur);
	o.connect(node);
	o.start(now);
	o.stop(now + dur);
}

/** Bell chime — notification */
export function playNotification() {
	const ac = getCtx();
	const [g, , t] = applyTheme(0.07, 880);
	const now = ac.currentTime;
	const f1 = 880 * THEMES[currentTheme].freqMult;
	const f2 = 1108 * THEMES[currentTheme].freqMult;
	const dur = 0.5 * t.decayMult;

	const chime = (freq: number, start: number, vol: number) => {
		const n = mkGain(ac, vol * g);
		n.gain.exponentialRampToValueAtTime(0.001, start + dur);
		osc(ac, n, freq, "sine", start, dur);
		osc(ac, n, freq * 2, "sine", start, dur * 0.5);
	};
	chime(f1, now, 1.0);
	chime(f2, now + 0.1, 0.7);
}

/** Warning tone — alert dialogs */
export function playWarning() {
	const ac = getCtx();
	const [g, freq, t] = applyTheme(0.08, 520);
	const dur = 0.15 * t.decayMult;
	const now = ac.currentTime;

	const n = mkGain(ac, g);
	n.gain.setValueAtTime(g, now);
	n.gain.exponentialRampToValueAtTime(0.001, now + dur);
	osc(ac, n, freq, "triangle", now, dur);

	// small echo
	const n2 = mkGain(ac, g * 0.4);
	n2.gain.setValueAtTime(g * 0.4, now + 0.12);
	n2.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + dur);
	osc(ac, n2, freq * 0.9, "triangle", now + 0.12, dur);
}

/** Whoosh — sidebar / panel open */
export function playSwoosh() {
	const ac = getCtx();
	const [g, , t] = applyTheme(0.055, 1);
	const dur = 0.14 * t.decayMult;
	const now = ac.currentTime;

	// filtered noise via sawtooth sweep
	const n = mkGain(ac, g);
	n.gain.setValueAtTime(0.001, now);
	n.gain.linearRampToValueAtTime(g, now + 0.025);
	n.gain.exponentialRampToValueAtTime(0.001, now + dur);

	const o = ac.createOscillator();
	o.type = "sawtooth";
	o.frequency.setValueAtTime(900, now);
	o.frequency.exponentialRampToValueAtTime(260, now + dur);

	const filter = ac.createBiquadFilter();
	filter.type = "bandpass";
	filter.frequency.value = 1200;
	filter.Q.value = 0.6;

	o.connect(filter);
	filter.connect(n);
	o.start(now);
	o.stop(now + dur);
}

/** Quick sparkle — CommandPalette / search open */
export function playSparkle() {
	const ac = getCtx();
	const [g, , t] = applyTheme(0.06, 1);
	const now = ac.currentTime;
	const freqs = [1320, 1760, 2093].map(
		(f) => f * THEMES[currentTheme].freqMult,
	);

	freqs.forEach((freq, i) => {
		const start = now + i * 0.055;
		const dur = 0.09 * t.decayMult;
		const n = mkGain(ac, 0.001);
		n.gain.setValueAtTime(0.001, start);
		n.gain.linearRampToValueAtTime(g * (1 - i * 0.2), start + 0.01);
		n.gain.exponentialRampToValueAtTime(0.001, start + dur);
		osc(ac, n, freq, "sine", start, dur);
	});
}

/** ─── Master controls ─────────────────────────────────────── */

export function isSoundEnabled(): boolean {
	return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
	soundEnabled = enabled;
	try {
		localStorage.setItem(ENABLED_KEY, String(enabled));
	} catch {
		// ignore
	}
}

export function getVolume(): number {
	return masterVolume;
}

export function setVolume(v: number) {
	masterVolume = Math.max(0, Math.min(1, v));
	try {
		localStorage.setItem(VOLUME_KEY, String(masterVolume));
	} catch {
		// ignore
	}
}

export function getTheme(): SoundTheme {
	return currentTheme;
}

export function setTheme(t: SoundTheme) {
	currentTheme = t;
	try {
		localStorage.setItem(THEME_KEY, t);
	} catch {
		// ignore
	}
}

/** ─── Guarded public API ──────────────────────────────────── */

function guard(fn: () => void): () => void {
	return () => {
		if (!soundEnabled || masterVolume === 0) return;
		try {
			fn();
		} catch {
			// AudioContext blocked — fail silently
		}
	};
}

export const sounds = {
	click: guard(playClick),
	open: guard(playOpen),
	close: guard(playClose),
	success: guard(playSuccess),
	error: guard(playError),
	notification: guard(playNotification),
	warning: guard(playWarning),
	swoosh: guard(playSwoosh),
	sparkle: guard(playSparkle),
};
