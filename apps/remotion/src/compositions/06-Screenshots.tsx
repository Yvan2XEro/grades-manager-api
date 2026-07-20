/**
 * 06-Screenshots — The Product (390 frames / 13 s)
 * Freeze "capture" moment · mockups 3D · calcul durée audio automatique
 */

import { getAudioDuration } from "@remotion/media-utils";
import type React from "react";
import {
	AbsoluteFill,
	Audio,
	Freeze,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-06.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import { AppMockup } from "../components/AppMockup";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

// Badge "CAPTURÉ" — useCurrentFrame() interne sera gelé à CAPTURE_FRAME par <Freeze>
// Le compteur de frame affiché restera donc toujours "f160" même si la scène avance
const CapturedBadge: React.FC = () => {
	const innerFrame = useCurrentFrame(); // ← toujours CAPTURE_FRAME grâce à Freeze
	return (
		<AbsoluteFill style={{ pointerEvents: "none" }}>
			<div
				style={{
					position: "absolute",
					top: 62,
					right: 108,
					display: "flex",
					alignItems: "center",
					gap: 8,
					background: "rgba(28,20,16,0.70)",
					backdropFilter: "blur(8px)",
					padding: "7px 16px",
					borderRadius: 999,
					zIndex: 20,
				}}
			>
				<div
					style={{
						width: 8,
						height: 8,
						borderRadius: "50%",
						background: C.red,
					}}
				/>
				<span
					style={{
						fontFamily: F.mono,
						fontSize: 13,
						fontWeight: 700,
						color: "white",
						letterSpacing: "0.06em",
					}}
				>
					CAPTURÉ · f{innerFrame}
				</span>
			</div>
		</AbsoluteFill>
	);
};

export const ScreenshotsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.screenshots, 20, 24);

	// Mockup 1 — Dashboard (gauche, en avant)
	const m1 = spring({
		frame: frame - 14,
		fps,
		config: { damping: 16, stiffness: 55, mass: 1.8 },
		durationInFrames: 80,
	});
	const m1Op = interpolate(m1, [0, 1], [0, 1]);
	const m1X = interpolate(m1, [0, 1], [-140, 0]);
	const m1Float = Math.sin(frame * 0.02) * 8;

	// Mockup 2 — Étudiants (droite, légèrement en arrière)
	const m2 = spring({
		frame: frame - 36,
		fps,
		config: { damping: 16, stiffness: 52, mass: 1.7 },
		durationInFrames: 78,
	});
	const m2Op = interpolate(m2, [0, 1], [0, 1]);
	const m2X = interpolate(m2, [0, 1], [160, 0]);
	const m2Float = Math.sin(frame * 0.02 + 1.9) * 7;

	// Mockup 3 — Notes (centre, premier plan)
	const m3 = spring({
		frame: frame - 60,
		fps,
		config: { damping: 16, stiffness: 50, mass: 1.6 },
		durationInFrames: 76,
	});
	const m3Op = interpolate(m3, [0, 1], [0, 1]);
	const m3Y2 = interpolate(m3, [0, 1], [100, 0]);
	const m3Float = Math.sin(frame * 0.02 + 3.5) * 6;

	// Glows derrière chaque mockup
	const gPulse = 1 + Math.sin(frame * 0.03) * 0.06;

	// Freeze — moment "capture d'écran" : tout se fige brièvement à frame 160
	const CAPTURE_FRAME = 160;
	const isCaptured = frame >= CAPTURE_FRAME && frame < CAPTURE_FRAME + 18;
	// Flash blanc pendant la capture
	const flashOp = isCaptured
		? interpolate(
				frame,
				[CAPTURE_FRAME, CAPTURE_FRAME + 6, CAPTURE_FRAME + 18],
				[0, 0.35, 0],
			)
		: 0;

	const LABELS = [
		{ text: "Tableau de bord admin", left: 60, top: 180, delay: 24 },
		{ text: "Gestion des étudiants", right: 46, top: 195, delay: 45 },
		{ text: "Saisie des notes", left: "50%" as const, bottom: 42, delay: 68 },
	] as const;

	return (
		<AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
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
					src={staticFile("audio/voiceover-06.mp3")}
					sceneDuration={DUR.screenshots}
				/>
			)}
			{/* Glows d'ambiance */}
			<div
				style={{
					transform: `scale(${gPulse})`,
					position: "absolute",
					inset: 0,
				}}
			>
				<Glow
					x="50%"
					y="44%"
					size={1200}
					color={C.primary}
					opacity={op * 0.1}
				/>
				<Glow x="15%" y="65%" size={600} color={C.violet} opacity={op * 0.07} />
				<Glow x="85%" y="65%" size={550} color={C.green} opacity={op * 0.06} />
			</div>

			{/* Flash blanc de capture — simule l'obturateur */}
			{isCaptured && (
				<AbsoluteFill
					style={{
						background: "white",
						opacity: flashOp,
						zIndex: 100,
						pointerEvents: "none",
					}}
				/>
			)}

			{/* Freeze — le badge lit useCurrentFrame()=160 en permanence même si la scène avance */}
			{frame >= CAPTURE_FRAME - 5 && frame <= CAPTURE_FRAME + 65 && (
				<div
					style={{
						opacity: interpolate(
							frame,
							[
								CAPTURE_FRAME - 5,
								CAPTURE_FRAME + 2,
								CAPTURE_FRAME + 58,
								CAPTURE_FRAME + 65,
							],
							[0, 1, 1, 0],
						),
					}}
				>
					<Freeze frame={CAPTURE_FRAME}>
						<CapturedBadge />
					</Freeze>
				</div>
			)}

			<div
				style={{
					opacity: op,
					width: "100%",
					height: "100%",
					position: "relative",
				}}
			>
				{/* En-tête */}
				<div
					style={{
						position: "absolute",
						top: 60,
						left: 96,
						right: 96,
						zIndex: 10,
						display: "flex",
						flexDirection: "column",
						gap: 8,
					}}
				>
					<div style={{ overflow: "hidden" }}>
						<div
							style={{
								opacity: interpolate(
									spring({
										frame,
										fps,
										config: { damping: 22 },
										durationInFrames: 28,
									}),
									[0, 1],
									[0, 1],
								),
								display: "inline-flex",
								alignItems: "center",
								gap: 10,
								fontFamily: F.body,
								fontSize: 12,
								fontWeight: 700,
								color: C.primary,
								letterSpacing: "0.2em",
								textTransform: "uppercase",
							}}
						>
							<div
								style={{
									width: 24,
									height: 2,
									background: C.primary,
									borderRadius: 2,
								}}
							/>
							L'interface en action
						</div>
					</div>
					<TextReveal delay={10} stiffness={115} damping={20}>
						<h2
							style={{
								fontFamily: F.heading,
								fontSize: 72,
								fontWeight: 800,
								color: C.text,
								margin: 0,
								letterSpacing: "-0.03em",
							}}
						>
							Conçu pour les équipes pédagogiques
						</h2>
					</TextReveal>
				</div>

				{/* Mockup 1 — Dashboard */}
				<div
					style={{
						position: "absolute",
						left: 52,
						top: 192,
						opacity: m1Op,
						transform: `translateX(${m1X}px) translateY(${m1Float}px)`,
						zIndex: 3,
						filter: "drop-shadow(0 40px 80px rgba(91,74,212,0.18))",
					}}
				>
					<AppMockup
						src="dashboard.png"
						width={790}
						height={444}
						tilt={3}
						label="localhost:5174/admin"
					/>
				</div>

				{/* Mockup 2 — Étudiants */}
				<div
					style={{
						position: "absolute",
						right: 40,
						top: 205,
						opacity: m2Op,
						transform: `translateX(${m2X}px) translateY(${m2Float}px)`,
						zIndex: 2,
						filter: "drop-shadow(0 32px 64px rgba(26,143,98,0.14))",
					}}
				>
					<AppMockup
						src="students.png"
						width={720}
						height={405}
						tilt={-3}
						label="localhost:5174/admin/students"
					/>
				</div>

				{/* Mockup 3 — Notes */}
				<div
					style={{
						position: "absolute",
						left: "50%",
						bottom: 38,
						transform: `translateX(-50%) translateY(${m3Y2 + m3Float}px)`,
						opacity: m3Op,
						zIndex: 5,
						filter: "drop-shadow(0 48px 96px rgba(91,74,212,0.22))",
					}}
				>
					<AppMockup
						src="grades.png"
						width={680}
						height={340}
						label="localhost:5174/teacher/grades"
					/>
				</div>

				{/* Labels flottants */}
				{LABELS.map(({ text, delay, ...pos }) => {
					const prog = spring({
						frame: frame - delay,
						fps,
						config: { damping: 17 },
						durationInFrames: 35,
					});
					return (
						<div
							key={text}
							style={{
								position: "absolute",
								...(pos as React.CSSProperties),
								opacity: interpolate(prog, [0, 1], [0, 1]),
								transform: `translateY(${interpolate(prog, [0, 1], [14, 0])}px)`,
								padding: "7px 16px",
								background: C.bgCard,
								border: `1px solid ${C.border}`,
								borderRadius: 10,
								fontFamily: F.body,
								fontSize: 13,
								color: C.textMuted,
								fontWeight: 600,
								zIndex: 10,
								whiteSpace: "nowrap",
								boxShadow:
									"0 2px 8px rgba(28,20,16,0.08), 0 4px 16px rgba(28,20,16,0.06)",
							}}
						>
							{text}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
