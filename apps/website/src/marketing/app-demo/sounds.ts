"use client";

/**
 * Demo micro-interaction sounds.
 *
 * Ported from the product's own `apps/web/src/lib/sounds.ts`, so the demos on
 * the marketing site sound exactly like the software a prospect would buy.
 * Everything is synthesised with the Web Audio API — no audio files are
 * shipped, and nothing is fetched.
 *
 * Defaults match the product exactly: sound ON, master volume 0.75. The
 * visitor can mute from the speaker control in each frame's header, and that
 * choice is remembered across visits.
 *
 * Note on browser autoplay policy: every major browser refuses to start audio
 * until the page has received a real user gesture. Nothing here can sidestep
 * that, and nothing should try — so the first sound a visitor hears is the one
 * attached to their own first click or drag inside a demo. The AudioContext is
 * created lazily at that moment for the same reason.
 */

/** Safari still exposes the prefixed constructor only. */
declare global {
	interface Window {
		webkitAudioContext?: typeof AudioContext;
	}
}

const ENABLED_KEY = "tkams-demo-sound";
/** The product's own master volume. */
const BASE_VOLUME = 0.75;

let ctx: AudioContext | null = null;
/** On by default, as in the application. */
let enabled = true;

/**
 * Restore a previous choice. Only an explicit "off" overrides the default, so
 * a first-time visitor gets sound and a visitor who muted stays muted.
 */
if (typeof window !== "undefined") {
	try {
		enabled = window.localStorage.getItem(ENABLED_KEY) !== "off";
	} catch {
		// Private browsing or blocked storage — keep the default.
	}
}

function getCtx(): AudioContext | null {
	if (typeof window === "undefined") return null;
	const Ctor = window.AudioContext ?? window.webkitAudioContext;
	if (!Ctor) return null;
	if (!ctx) ctx = new Ctor();
	if (ctx.state === "suspended") void ctx.resume();
	return ctx;
}

function gainNode(ac: AudioContext, value: number): GainNode {
	const g = ac.createGain();
	g.gain.value = value;
	g.connect(ac.destination);
	return g;
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

/** Click — pitch cycles through five notes so repeats do not grate. */
const CLICK_PITCHES = [1100, 1180, 1050, 1230, 1080];
let clickIdx = 0;

function click(ac: AudioContext) {
	const freq = CLICK_PITCHES[clickIdx++ % CLICK_PITCHES.length] ?? 1100;
	const g = 0.075 * BASE_VOLUME;
	const dur = 0.05;
	const node = gainNode(ac, g);
	const now = ac.currentTime;
	node.gain.setValueAtTime(g, now);
	node.gain.exponentialRampToValueAtTime(0.001, now + dur);
	osc(ac, node, freq, "sine", now, dur);
}

/** Two ascending notes — a value validated, a jury closed. */
function success(ac: AudioContext) {
	const g = 0.1 * BASE_VOLUME;
	const now = ac.currentTime;
	const dur = 0.18;
	const note = (freq: number, start: number) => {
		const n = gainNode(ac, 0.001);
		n.gain.setValueAtTime(0.001, start);
		n.gain.linearRampToValueAtTime(g, start + 0.018);
		n.gain.exponentialRampToValueAtTime(0.001, start + dur);
		osc(ac, n, freq, "sine", start, dur);
	};
	note(660, now);
	note(880, now + 0.11);
}

/** Soft rising pop — a rule changed, the cohort re-decided. */
function pop(ac: AudioContext) {
	const g = 0.07 * BASE_VOLUME;
	const dur = 0.13;
	const node = gainNode(ac, 0.001);
	const now = ac.currentTime;
	node.gain.setValueAtTime(0.001, now);
	node.gain.linearRampToValueAtTime(g, now + 0.012);
	node.gain.exponentialRampToValueAtTime(0.001, now + dur);
	const o = ac.createOscillator();
	o.type = "sine";
	o.frequency.setValueAtTime(370 * 0.88, now);
	o.frequency.linearRampToValueAtTime(370 * 1.12, now + dur);
	o.connect(node);
	o.start(now);
	o.stop(now + dur);
}

/** Descending tone — a student drops below the bar. */
function warn(ac: AudioContext) {
	const g = 0.08 * BASE_VOLUME;
	const dur = 0.15;
	const now = ac.currentTime;
	const n = gainNode(ac, g);
	n.gain.setValueAtTime(g, now);
	n.gain.exponentialRampToValueAtTime(0.001, now + dur);
	osc(ac, n, 520, "triangle", now, dur);
}

function play(fn: (ac: AudioContext) => void) {
	if (!enabled) return;
	try {
		const ac = getCtx();
		if (ac) fn(ac);
	} catch {
		// Autoplay policy or unsupported context — fail silently.
	}
}

export const demoSounds = {
	click: () => play(click),
	success: () => play(success),
	pop: () => play(pop),
	warn: () => play(warn),
};

export function isSoundOn(): boolean {
	return enabled;
}

/**
 * Toggle and persist. Returns the new state.
 *
 * Un-muting plays a confirmation pop: it tells the visitor sound is back, and
 * it is itself the user gesture that unlocks the AudioContext on browsers that
 * demand one.
 */
export function toggleSound(): boolean {
	enabled = !enabled;
	try {
		window.localStorage.setItem(ENABLED_KEY, enabled ? "on" : "off");
	} catch {
		// ignore
	}
	if (enabled) {
		try {
			const ac = getCtx();
			if (ac) pop(ac);
		} catch {
			// ignore
		}
	}
	return enabled;
}
