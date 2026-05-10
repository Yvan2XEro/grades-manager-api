/**
 * 09-Outro — Brand Finale (330 frames / 11 s)
 * NoiseBackground · Loop rings · interpolateColors · durée audio auto
 */

import { getAudioDuration } from "@remotion/media-utils";
import type React from "react";
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	interpolateColors,
	Loop,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { AnimatedRings } from "../components/AnimatedRings";

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-09.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import { DotGrid } from "../components/DotGrid";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { NoiseBackground } from "../components/NoiseBackground";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

const NEU_RAISED =
	"10px 10px 24px rgba(168,155,143,0.50), -10px -10px 24px rgba(255,255,255,0.86)";

export const OutroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.outro, 20, 0);

	// ── Logo — Scan laser horizontal (gauche → droite) ──────────────
	// Le clip-path révèle progressivement le logo via un balayage horizontal
	const scanProg = spring({
		frame: frame - 4,
		fps,
		config: { damping: 18, stiffness: 85, mass: 1.1 },
		durationInFrames: 52,
	});
	// scanPct : 0% → 115% (dépasse le bord droit pour la ligne de fin)
	const scanPct = interpolate(scanProg, [0, 1], [0, 115]);
	// Ligne laser : légèrement en avance sur le clip (précède de ~5%)
	const laserPct = Math.min(110, scanPct + 3);
	// Glow du drop-shadow : intense pendant le scan, stable après
	const logoGlow = interpolate(scanPct, [0, 30, 90, 115], [0, 28, 14, 12]);

	// Ligne
	const lineProg = spring({
		frame: frame - 58,
		fps,
		config: { damping: 26, stiffness: 140 },
		durationInFrames: 30,
	});
	const lineW = interpolate(lineProg, [0, 1], [0, 480]);

	// Headline CTA
	const headProg = spring({
		frame: frame - 65,
		fps,
		config: { damping: 16, stiffness: 80, mass: 1.2 },
		durationInFrames: 55,
	});
	const headOp = interpolate(headProg, [0, 1], [0, 1]);
	const headY = interpolate(headProg, [0, 1], [44, 0]);

	// Sous-titre
	const subProg = spring({
		frame: frame - 85,
		fps,
		config: { damping: 20 },
		durationInFrames: 36,
	});
	const subOp = interpolate(subProg, [0, 1], [0, 1]);
	const subY = interpolate(subProg, [0, 1], [18, 0]);

	// CTA buttons
	const ctaProg = spring({
		frame: frame - 105,
		fps,
		config: { damping: 18 },
		durationInFrames: 36,
	});
	const ctaOp = interpolate(ctaProg, [0, 1], [0, 1]);
	const ctaY = interpolate(ctaProg, [0, 1], [22, 0]);

	// Footer
	const ftProg = spring({
		frame: frame - 130,
		fps,
		config: { damping: 22 },
		durationInFrames: 28,
	});

	const glowPulse = 1 + Math.sin(frame * 0.04) * 0.04;

	// interpolateColors — fond qui se réchauffe légèrement vers la fin
	const bgColor = interpolateColors(
		frame,
		[0, DUR.outro * 0.75],
		[C.bg, "#F5F2EE"],
	);

	return (
		<AbsoluteFill
			style={{
				background: bgColor,
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
			}}
		>
			{AUDIO.enabled && (
				<Audio
					src={staticFile("audio/transition.mp3")}
					volume={AUDIO.transitionVolume}
					endAt={22}
				/>
			)}
			{AUDIO.enabled && (
				<FadingAudio
					src={staticFile("audio/voiceover-09.mp3")}
					sceneDuration={DUR.outro}
				/>
			)}

			{/* Fond organique noise2D */}
			<NoiseBackground
				color={C.violet}
				opacity={0.022}
				speed={0.001}
				count={3}
			/>

			<DotGrid opacity={op * 0.18} size={38} dotSize={1.5} color={C.primary} />

			{/* Loop — AnimatedRings en boucle perpétuelle indépendante du frame global */}
			<div style={{ position: "absolute", inset: 0, opacity: op * 0.55 }}>
				<Loop durationInFrames={110}>
					<AnimatedRings
						cx={960}
						cy={540}
						color={C.primary}
						count={4}
						maxRadius={500}
						cycleFrames={110}
						strokeWidth={1}
					/>
				</Loop>
			</div>

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
					size={880}
					color={C.primary}
					opacity={interpolate(scanProg, [0, 0.5, 1], [0, 0.09, 0.06])}
				/>
			</div>

			<div
				style={{
					opacity: op,
					position: "relative",
					zIndex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				{/* Logo TKAMS — scan laser horizontal */}
				<div
					style={{
						position: "relative",
						marginBottom: 36,
						display: "inline-block",
					}}
				>
					{/* Logo révélé par clip-path balayant de gauche à droite */}
					<div
						style={{
							clipPath: `polygon(0 0, ${Math.min(100, scanPct)}% 0, ${Math.min(100, scanPct)}% 100%, 0 100%)`,
							filter: `drop-shadow(0 8px ${logoGlow}px rgba(91,74,212,0.30))`,
						}}
					>
						<Img
							src={staticFile("logo.png")}
							style={{
								width: 420,
								height: "auto",
								objectFit: "contain",
								display: "block",
							}}
						/>
					</div>

					{/* Ligne laser — bord lumineux qui précède la révélation */}
					{laserPct <= 108 && (
						<div
							style={{
								position: "absolute",
								top: -8,
								bottom: -8,
								left: `${laserPct}%`,
								width: 3,
								background: `linear-gradient(180deg,
								transparent 0%,
								${C.violet} 15%,
								${C.primary} 45%,
								${C.violet} 85%,
								transparent 100%)`,
								boxShadow:
									"0 0 18px 6px rgba(91,74,212,0.55), 0 0 40px 12px rgba(91,74,212,0.18)",
								opacity: interpolate(scanPct, [0, 3, 95, 108], [0, 1, 1, 0]),
								transform: "translateX(-50%)",
							}}
						/>
					)}

					{/* Reflet lumineux résiduel après le passage du laser */}
					<div
						style={{
							position: "absolute",
							inset: 0,
							background: `linear-gradient(90deg, transparent ${Math.max(0, scanPct - 15)}%, rgba(91,74,212,0.06) ${Math.max(0, scanPct - 5)}%, transparent ${scanPct}%)`,
							pointerEvents: "none",
						}}
					/>
				</div>

				{/* Ligne */}
				<div
					style={{
						width: lineW,
						height: 2,
						background: `linear-gradient(90deg, transparent, ${C.primary} 20%, ${C.violet} 70%, transparent)`,
						borderRadius: 2,
						marginBottom: 36,
					}}
				/>

				{/* Headline CTA */}
				<div
					style={{
						opacity: headOp,
						transform: `translateY(${headY}px)`,
						textAlign: "center",
					}}
				>
					<h1
						style={{
							fontFamily: F.heading,
							fontSize: 68,
							fontWeight: 900,
							color: C.text,
							margin: 0,
							lineHeight: 1.05,
							letterSpacing: "-0.035em",
						}}
					>
						Prêt à déployer ?
					</h1>
				</div>

				{/* Sous-titre */}
				<div
					style={{
						opacity: subOp,
						transform: `translateY(${subY}px)`,
						marginTop: 16,
					}}
				>
					<p
						style={{
							fontFamily: F.body,
							fontSize: 19,
							fontWeight: 400,
							color: C.textMuted,
							margin: 0,
							textAlign: "center",
							maxWidth: 700,
							lineHeight: 1.7,
						}}
					>
						Modernisez la gestion académique de votre institution — une seule
						commande suffit.
					</p>
				</div>

				{/* CTA neumorphiques */}
				<div
					style={{
						opacity: ctaOp,
						transform: `translateY(${ctaY}px)`,
						display: "flex",
						gap: 20,
						marginTop: 44,
					}}
				>
					<div
						style={{
							fontFamily: F.mono,
							fontSize: 18,
							fontWeight: 700,
							color: C.primary,
							background: C.bg,
							boxShadow: NEU_RAISED,
							padding: "16px 36px",
							borderRadius: 14,
							border: `2px solid ${C.primary}`,
							letterSpacing: "0.02em",
						}}
					>
						Contactez-nous au
					</div>
					<div
						style={{
							fontFamily: F.mono,
							fontSize: 18,
							fontWeight: 700,
							color: C.green,
							background: C.bg,
							boxShadow: NEU_RAISED,
							padding: "16px 36px",
							borderRadius: 14,
							border: `2px solid ${C.green}`,
							letterSpacing: "0.02em",
						}}
					>
						+237 652 761 931
					</div>
				</div>

				{/* Footer */}
				<div
					style={{
						marginTop: 48,
						opacity: interpolate(ftProg, [0, 1], [0, 0.45]),
						fontFamily: F.body,
						fontSize: 12,
						color: C.textFaint,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
					}}
				>
					tkams.com
				</div>
			</div>
		</AbsoluteFill>
	);
};
