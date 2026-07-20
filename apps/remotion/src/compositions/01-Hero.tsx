/**
 * 01-Hero — The Big Statement (390 frames / 13 s)
 * Titre 3 lignes 120 px · grille perspective · mockup flottant · fitText stats
 */

import { fitText } from "@remotion/layout-utils";
import { getAudioDuration } from "@remotion/media-utils";
import type React from "react";
import {
	AbsoluteFill,
	Audio,
	interpolate,
	interpolateColors,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

import { AppMockup } from "../components/AppMockup";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { PerspectiveGrid } from "../components/PerspectiveGrid";
import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-01.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

const STATS = [
	{ value: 500, suffix: "+", label: "étudiants" },
	{ value: 5, suffix: "", label: "rôles" },
	{ value: 1, suffix: "", label: "plateforme" },
] as const;

export const HeroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.hero, 20, 24);

	const gridOp =
		interpolate(frame, [10, 50], [0, 1], { extrapolateRight: "clamp" }) *
		op *
		0.35;

	const mockProg = spring({
		frame: frame - 24,
		fps,
		config: { damping: 16, stiffness: 55, mass: 1.8 },
		durationInFrames: 90,
	});
	const mockOp = interpolate(mockProg, [0, 1], [0, 1]);
	const mockX = interpolate(mockProg, [0, 1], [180, 0]);
	const mockFloat = Math.sin(frame * 0.02) * 8;

	const badgeProg = spring({
		frame: frame - 0,
		fps,
		config: { damping: 20, stiffness: 120 },
		durationInFrames: 35,
	});

	// interpolateColors — fond qui se réchauffe subtilement pendant la scène
	const bgColor = interpolateColors(
		frame,
		[0, DUR.hero * 0.8],
		[C.bg, "#F5F1EC"],
	);

	return (
		<AbsoluteFill style={{ background: bgColor, overflow: "hidden" }}>
			{/* Son de transition */}
			{AUDIO.enabled && (
				<Audio
					src={staticFile("audio/transition.mp3")}
					volume={AUDIO.transitionVolume}
					endAt={22}
				/>
			)}
			{AUDIO.enabled && (
				<FadingAudio
					src={staticFile("audio/voiceover-01.mp3")}
					sceneDuration={DUR.hero}
				/>
			)}
			<div style={{ opacity: gridOp }}>
				<PerspectiveGrid
					color={C.primary}
					vanishY={560}
					opacity={1}
					cols={12}
					rows={8}
				/>
			</div>
			<Glow x="14%" y="52%" size={880} color={C.primary} opacity={op * 0.07} />
			<Glow x="80%" y="40%" size={700} color={C.violet} opacity={op * 0.05} />

			<div
				style={{
					opacity: op,
					display: "flex",
					width: "100%",
					height: "100%",
					alignItems: "center",
					padding: "0 88px",
					gap: 72,
				}}
			>
				{/* Texte gauche */}
				<div
					style={{
						flex: "0 0 700px",
						display: "flex",
						flexDirection: "column",
						gap: 0,
					}}
				>
					{/* Badge */}
					<div style={{ marginBottom: 32, overflow: "hidden" }}>
						<div
							style={{
								opacity: interpolate(badgeProg, [0, 1], [0, 1]),
								transform: `translateY(${interpolate(badgeProg, [0, 1], [30, 0])}px)`,
								display: "inline-flex",
								alignItems: "center",
								gap: 10,
								padding: "8px 18px",
								borderRadius: 999,
								background: C.primaryGlow,
								border: "1px solid rgba(91,74,212,0.28)",
							}}
						>
							<div
								style={{
									width: 7,
									height: 7,
									borderRadius: "50%",
									background: C.primary,
								}}
							/>
							<span
								style={{
									fontFamily: F.body,
									fontSize: 12,
									fontWeight: 700,
									color: C.primary,
									letterSpacing: "0.12em",
									textTransform: "uppercase",
								}}
							>
								TKAMS
							</span>
						</div>
					</div>

					{/* Titre 3 lignes — 120 px */}
					<TextReveal
						delay={12}
						stiffness={110}
						damping={20}
						containerStyle={{ marginBottom: 4 }}
					>
						<h1
							style={{
								fontFamily: F.heading,
								fontSize: 120,
								fontWeight: 800,
								color: C.text,
								margin: 0,
								lineHeight: 0.95,
								letterSpacing: "-0.04em",
							}}
						>
							La gestion
						</h1>
					</TextReveal>
					<TextReveal
						delay={22}
						stiffness={110}
						damping={20}
						containerStyle={{ marginBottom: 4 }}
					>
						<h1
							style={{
								fontFamily: F.heading,
								fontSize: 120,
								fontWeight: 800,
								margin: 0,
								lineHeight: 0.95,
								letterSpacing: "-0.04em",
								background: `linear-gradient(120deg, ${C.primary} 0%, ${C.violet} 55%, ${C.green} 100%)`,
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
							}}
						>
							académique
						</h1>
					</TextReveal>
					<TextReveal
						delay={32}
						stiffness={110}
						damping={20}
						containerStyle={{ marginBottom: 36 }}
					>
						<h1
							style={{
								fontFamily: F.heading,
								fontSize: 120,
								fontWeight: 800,
								color: C.text,
								margin: 0,
								lineHeight: 0.95,
								letterSpacing: "-0.04em",
							}}
						>
							réinventée
						</h1>
					</TextReveal>

					{/* Description */}
					<TextReveal delay={50} stiffness={120} damping={22}>
						<p
							style={{
								fontFamily: F.body,
								fontSize: 22,
								fontWeight: 400,
								color: C.textMuted,
								margin: 0,
								lineHeight: 1.75,
								maxWidth: 560,
							}}
						>
							Système multi-tenant de gestion des notes, examens et
							délibérations — pour toutes vos institutions.
						</p>
					</TextReveal>

					{/* Stats — fitText adapte la taille à la largeur du conteneur */}
					<div style={{ display: "flex", gap: 48, marginTop: 40 }}>
						{STATS.map(({ value, suffix, label }, i) => {
							const elapsed = Math.max(0, frame - 80 - i * 18);
							const counted = Math.round(
								interpolate(elapsed, [0, 55], [0, value], {
									extrapolateRight: "clamp",
								}),
							);
							const sp = spring({
								frame: frame - 70 - i * 18,
								fps,
								config: { damping: 20 },
								durationInFrames: 38,
							});
							const statText = `${counted}${suffix}`;
							const fit = fitText({
								text: statText,
								withinWidth: 180,
								fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif",
								fontWeight: "800",
							});
							return (
								<div
									key={label}
									style={{
										opacity: interpolate(sp, [0, 1], [0, 1]),
										transform: `translateY(${interpolate(sp, [0, 1], [20, 0])}px)`,
										width: 180,
									}}
								>
									<div
										style={{
											fontFamily: F.heading,
											fontSize: Math.min(52, fit.fontSize),
											fontWeight: 800,
											color: C.primary,
											lineHeight: 1,
											letterSpacing: "-0.04em",
										}}
									>
										{statText}
									</div>
									<div
										style={{
											fontFamily: F.body,
											fontSize: 15,
											color: C.textMuted,
											marginTop: 6,
											letterSpacing: "0.04em",
										}}
									>
										{label}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Mockup */}
				<div
					style={{
						flex: 1,
						opacity: mockOp,
						transform: `translateX(${mockX}px) translateY(${mockFloat}px)`,
						display: "flex",
						justifyContent: "center",
						filter: "drop-shadow(0 32px 64px rgba(91,74,212,0.18))",
					}}
				>
					<AppMockup src="dashboard.png" width={810} height={456} tilt={-5} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
