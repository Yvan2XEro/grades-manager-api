/**
 * 00-Intro — Brand Identity TKAMS (360 frames / 12 s)
 * Logo centré · typographie épurée · noise2D + shapes décoratifs + Trail comet
 */

import { getAudioDuration } from "@remotion/media-utils";
import { Trail } from "@remotion/motion-blur";
import { Circle, Triangle } from "@remotion/shapes";
import type React from "react";
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-00.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import { DotGrid } from "../components/DotGrid";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { NoiseBackground } from "../components/NoiseBackground";
import { ParticleBurst } from "../components/ParticleBurst";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

// Composant interne — Trail nécessite un enfant qui lit useCurrentFrame()
const IntroComet: React.FC = () => {
	const frame = useCurrentFrame();
	const progress = interpolate(frame, [5, 72], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const x = interpolate(progress, [0, 1], [160, 1760]);
	const y = interpolate(progress, [0, 1], [320, 88]);
	const opacity = interpolate(progress, [0, 0.05, 0.82, 1], [0, 0.85, 0.55, 0]);
	return (
		<AbsoluteFill>
			<div
				style={{
					position: "absolute",
					left: x,
					top: y,
					width: 11,
					height: 11,
					borderRadius: "50%",
					background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${C.primary} 55%)`,
					boxShadow: "0 0 20px 7px rgba(91,74,212,0.38)",
					transform: "translate(-50%, -50%)",
					opacity,
				}}
			/>
		</AbsoluteFill>
	);
};

const BADGES = [
	"Multi-institutions",
	"Fiable & sécurisé",
	"Modulable",
] as const;

export const IntroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.intro, 0, 28);

	// ── Logo — Clip-path circle burst + overshoot scale ──────────────
	// Phase 1 : cercle de révélation part de 0 et s'étend comme un sonar
	const clipProg = spring({
		frame: frame - 4,
		fps,
		config: { damping: 14, stiffness: 48, mass: 2.2 },
		durationInFrames: 70,
	});
	const clipRadius = interpolate(clipProg, [0, 1], [0, 500]); // px

	// Phase 2 : scale overshoot — logo "rebondit" légèrement après révélation
	const scaleProg = spring({
		frame: frame - 10,
		fps,
		config: { damping: 10, stiffness: 100, mass: 0.7 },
		durationInFrames: 48,
	});
	const logoScale = interpolate(scaleProg, [0, 1], [1.18, 1.0]);

	// Glow burst intense au moment de la révélation, se stabilise ensuite
	const burstProg = spring({
		frame: frame - 4,
		fps,
		config: { damping: 8, stiffness: 70, mass: 1.2 },
		durationInFrames: 55,
	});
	const logoGlow = interpolate(burstProg, [0, 0.25, 1], [0, 72, 18]);

	// ── Ligne décorative ──────────────────────────────
	const lineProg = spring({
		frame: frame - 60,
		fps,
		config: { damping: 26, stiffness: 140 },
		durationInFrames: 30,
	});
	const lineW = interpolate(lineProg, [0, 1], [0, 480]);

	// ── Séparateur "Grades Manager" ───────────────────
	// Deux mots révélés indépendamment
	const word1Delay = 68;
	const word2Delay = 80;

	// ── Tagline ───────────────────────────────────────
	const tagProg = spring({
		frame: frame - 102,
		fps,
		config: { damping: 22, stiffness: 120 },
		durationInFrames: 36,
	});
	const tagOp = interpolate(tagProg, [0, 1], [0, 1]);
	const tagY = interpolate(tagProg, [0, 1], [16, 0]);

	// ── Badges ────────────────────────────────────────
	const bdgBase = 128;

	// ── Glow pulsant (subtil) ─────────────────────────
	const glowPulse = 1 + Math.sin(frame * 0.04) * 0.05;

	return (
		<AbsoluteFill
			style={{
				background: C.bg,
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
			}}
		>
			{/* Son de transition au démarrage */}
			{AUDIO.enabled && (
				<Audio
					src={staticFile("audio/transition.mp3")}
					volume={AUDIO.transitionVolume}
					endAt={22}
				/>
			)}
			{AUDIO.enabled && (
				<FadingAudio
					src={staticFile("audio/voiceover-00.mp3")}
					sceneDuration={DUR.intro}
				/>
			)}

			{/* Fond organique noise2D — blobs de lumière subtils */}
			<NoiseBackground
				color={C.primary}
				opacity={0.028}
				speed={0.0012}
				count={3}
			/>

			{/* DotGrid — motif de fond discret */}
			<DotGrid opacity={op * 0.2} size={38} dotSize={1.5} color={C.primary} />

			{/* Formes géométriques décoratives aux coins */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					opacity: op * 0.07,
				}}
			>
				<Circle
					radius={130}
					fill={C.primary}
					style={{ position: "absolute", right: 68, top: 108 }}
				/>
				<Triangle
					length={80}
					fill={C.violet}
					direction="right"
					style={{ position: "absolute", left: 55, bottom: 150 }}
				/>
				<Circle
					radius={56}
					fill={C.green}
					style={{ position: "absolute", left: 195, top: 72 }}
				/>
			</div>

			{/* Trail comet — traverse l'écran au démarrage */}
			<Trail layers={8} lagInFrames={2} trailOpacity={0.42}>
				<IntroComet />
			</Trail>

			{/* Glow ambiance */}
			<div
				style={{
					transform: `scale(${glowPulse})`,
					position: "absolute",
					inset: 0,
					opacity: op,
				}}
			>
				<Glow
					x="50%"
					y="44%"
					size={900}
					color={C.primary}
					opacity={interpolate(clipProg, [0, 0.5, 1], [0, 0.12, 0.08])}
				/>
				<Glow x="22%" y="78%" size={500} color={C.violet} opacity={0.04} />
				<Glow x="78%" y="72%" size={440} color={C.green} opacity={0.03} />
			</div>

			{/* ── Contenu principal ────────────────────── */}
			<div
				style={{
					opacity: op,
					position: "relative",
					zIndex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 0,
				}}
			>
				{/* Logo TKAMS — clip-path circle burst depuis le centre */}
				<div style={{ position: "relative", marginBottom: 38 }}>
					{/* Burst flash pré-révélation — halo blanc intense qui précède le logo */}
					<div
						style={{
							position: "absolute",
							inset: -40,
							borderRadius: "50%",
							background:
								"radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(91,74,212,0.25) 40%, transparent 70%)",
							opacity: interpolate(
								clipRadius,
								[0, 80, 220, 500],
								[0, 0.9, 0.3, 0],
							),
							pointerEvents: "none",
						}}
					/>

					{/* Logo avec clip-path circle + overshoot scale */}
					<div
						style={{
							transform: `scale(${logoScale})`,
							filter: `drop-shadow(0 0px ${logoGlow}px rgba(91,74,212,0.50))`,
						}}
					>
						<div style={{ clipPath: `circle(${clipRadius}px at 50% 50%)` }}>
							<Img
								src={staticFile("logo.png")}
								style={{
									width: 480,
									height: "auto",
									objectFit: "contain",
									display: "block",
								}}
							/>
						</div>
					</div>

					{/* ParticleBurst — explose au moment où le logo est pleinement révélé */}
					<div
						style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
					>
						<ParticleBurst
							cx={240}
							cy={60}
							count={28}
							maxRadius={340}
							color={C.primary}
							delay={34}
							duration={60}
						/>
					</div>
				</div>

				{/* Ligne gradient décorative */}
				<div
					style={{
						width: lineW,
						height: 2,
						background: `linear-gradient(90deg, transparent, ${C.primary} 20%, ${C.violet} 70%, transparent)`,
						borderRadius: 2,
						marginBottom: 36,
					}}
				/>

				{/* Headline produit */}
				<div style={{ textAlign: "center", overflow: "hidden" }}>
					{(["Gestion académique", "multi-tenant"] as const).map((line, i) => {
						const delay = i === 0 ? word1Delay : word2Delay;
						const p = spring({
							frame: frame - delay,
							fps,
							config: { damping: 16, stiffness: 85, mass: 1.1 },
							durationInFrames: 52,
						});
						return (
							<h1
								key={line}
								style={{
									fontFamily: F.heading,
									fontSize: i === 0 ? 64 : 64,
									fontWeight: 900,
									margin: 0,
									lineHeight: 1.08,
									letterSpacing: "-0.03em",
									color: i === 0 ? C.text : C.primary,
									opacity: interpolate(p, [0, 1], [0, 1]),
									transform: `translateY(${interpolate(p, [0, 1], [44, 0])}px)`,
									display: "block",
								}}
							>
								{line}
							</h1>
						);
					})}
				</div>

				{/* Tagline */}
				<div
					style={{
						opacity: tagOp,
						transform: `translateY(${tagY}px)`,
						marginTop: 20,
					}}
				>
					<p
						style={{
							fontFamily: F.body,
							fontSize: 18,
							fontWeight: 400,
							color: C.textFaint,
							margin: 0,
							letterSpacing: "0.04em",
							textAlign: "center",
							textTransform: "uppercase",
						}}
					>
						Notes · Examens · Délibérations
					</p>
				</div>

				{/* Badges */}
				<div style={{ marginTop: 44, display: "flex", gap: 12 }}>
					{BADGES.map((tag, i) => {
						const bdg = spring({
							frame: frame - bdgBase - i * 14,
							fps,
							config: { damping: 20, stiffness: 110 },
							durationInFrames: 30,
						});
						return (
							<div
								key={tag}
								style={{
									opacity: interpolate(bdg, [0, 1], [0, 1]),
									transform: `translateY(${interpolate(bdg, [0, 1], [14, 0])}px)`,
									fontFamily: F.body,
									fontSize: 13,
									fontWeight: 600,
									color: C.primary,
									background: C.primaryGlow,
									border: "1px solid rgba(91,74,212,0.22)",
									borderRadius: 999,
									padding: "7px 20px",
									letterSpacing: "0.08em",
								}}
							>
								{tag}
							</div>
						);
					})}
				</div>

				{/* Powered by — très discret en bas */}
				{(() => {
					const p = spring({
						frame: frame - 158,
						fps,
						config: { damping: 22 },
						durationInFrames: 28,
					});
					return (
						<div
							style={{
								marginTop: 52,
								opacity: interpolate(p, [0, 1], [0, 0.5]),
								fontFamily: F.body,
								fontSize: 12,
								color: C.textFaint,
								letterSpacing: "0.18em",
								textTransform: "uppercase",
							}}
						>
							tkams.com
						</div>
					);
				})()}
			</div>
		</AbsoluteFill>
	);
};
