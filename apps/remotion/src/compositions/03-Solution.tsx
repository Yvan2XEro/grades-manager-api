/**
 * 03-Solution — Architecture (390 frames / 13 s)
 * Neo-Brutalisme + Neumorphisme + interpolateColors fond
 */

import { getAudioDuration } from "@remotion/media-utils";
import React from "react";
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

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-03.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import { CheckCircle2, Database, Monitor, Shield, Zap } from "lucide-react";
import { DotGrid } from "../components/DotGrid";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

const NEU_RAISED =
	"10px 10px 24px rgba(168,155,143,0.52), -10px -10px 24px rgba(255,255,255,0.86)";
const NEU_CIRCLE =
	"6px 6px 14px rgba(168,155,143,0.45), -6px -6px 14px rgba(255,255,255,0.82)";
const _NEU_GROOVE =
	"inset 1px 1px 3px rgba(168,155,143,0.45), inset -1px -1px 3px rgba(255,255,255,0.82)";

const LAYERS = [
	{
		Icon: Monitor,
		color: C.violet,
		label: "Interface web & mobile",
		sub: "Accessible depuis n'importe quel navigateur · Français & Anglais",
	},
	{
		Icon: Zap,
		color: C.primary,
		label: "Serveur applicatif",
		sub: "Rapide · Sécurisé · Connecté à tous vos outils",
	},
	{
		Icon: Database,
		color: C.green,
		label: "Base de données",
		sub: "Stockage fiable · Sauvegardé · Isolé par institution",
	},
] as const;

const FEATURES = [
	{ text: "Chaque institution gère ses propres données", color: C.primary },
	{ text: "5 niveaux d'accès hiérarchiques", color: C.violet },
	{ text: "Validation des notes par les responsables", color: C.green },
	{ text: "Traitements automatiques planifiés", color: C.amber },
	{ text: "Intégration avec les systèmes de diplomation", color: C.primary },
	{ text: "Règles de promotion entièrement configurables", color: C.green },
] as const;

export const SolutionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.solution, 20, 24);

	const connDraw = interpolate(frame, [65, 130], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// interpolateColors — fond qui se chill vers un léger bleu-violet en fin de scène
	const bgColor = interpolateColors(
		frame,
		[0, DUR.solution * 0.85],
		[C.bg, "#F4F2F8"],
	);

	return (
		<AbsoluteFill style={{ background: bgColor, overflow: "hidden" }}>
			{AUDIO.enabled && (
				<Audio
					src={staticFile("audio/transition.mp3")}
					volume={AUDIO.transitionVolume}
					endAt={22}
				/>
			)}
			{AUDIO.enabled && (
				<FadingAudio
					src={staticFile("audio/voiceover-03.mp3")}
					sceneDuration={DUR.solution}
				/>
			)}

			<DotGrid opacity={op * 0.1} size={38} dotSize={1.5} color={C.primary} />
			<Glow x="55%" y="50%" size={800} color={C.primary} opacity={op * 0.05} />

			<div
				style={{
					opacity: op,
					padding: "56px 88px",
					display: "flex",
					flexDirection: "column",
					height: "100%",
					gap: 0,
				}}
			>
				{/* En-tête */}
				<div style={{ marginBottom: 46 }}>
					<div style={{ overflow: "hidden", marginBottom: 10 }}>
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
									width: 28,
									height: 3,
									background: C.primary,
									borderRadius: 2,
								}}
							/>
							La solution
						</div>
					</div>
					<TextReveal delay={10} stiffness={120} damping={16}>
						<h2
							style={{
								fontFamily: F.heading,
								fontSize: 74,
								fontWeight: 900,
								color: C.text,
								margin: 0,
								letterSpacing: "-0.035em",
								lineHeight: 1.05,
							}}
						>
							Une stack moderne,{" "}
							<span
								style={{
									background: `linear-gradient(120deg, ${C.primary}, ${C.violet})`,
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
								}}
							>
								bout en bout typée
							</span>
						</h2>
					</TextReveal>
				</div>

				<div style={{ display: "flex", gap: 64, flex: 1, minHeight: 0 }}>
					{/* ── Couches architecture ── (colonne gauche fixe) */}
					<div
						style={{
							flex: "0 0 580px",
							display: "flex",
							flexDirection: "column",
							gap: 0,
						}}
					>
						{LAYERS.map(({ Icon, color, label, sub }, i) => {
							const prog = spring({
								frame: frame - 24 - i * 22,
								fps,
								config: { damping: 12, stiffness: 80, mass: 1.5 },
								durationInFrames: 58,
							});
							const lOp = interpolate(prog, [0, 1], [0, 1]);
							const lX = interpolate(prog, [0, 1], [-90, 0]);

							return (
								<React.Fragment key={label}>
									<div
										style={{ opacity: lOp, transform: `translateX(${lX}px)` }}
									>
										<div
											style={{
												background: C.bg,
												boxShadow: NEU_RAISED,
												borderRadius: 18,
												overflow: "hidden",
												display: "flex",
												alignItems: "center",
												gap: 20,
												borderLeft: `5px solid ${color}`,
											}}
										>
											<div
												style={{
													width: 58,
													height: 58,
													margin: "18px 0 18px 20px",
													borderRadius: "50%",
													background: C.bg,
													boxShadow: NEU_CIRCLE,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													flexShrink: 0,
												}}
											>
												<Icon size={24} color={color} strokeWidth={1.5} />
											</div>
											<div style={{ padding: "18px 18px 18px 0" }}>
												<div
													style={{
														fontFamily: F.heading,
														fontSize: 22,
														fontWeight: 800,
														color,
														marginBottom: 4,
														letterSpacing: "-0.01em",
													}}
												>
													{label}
												</div>
												<div
													style={{
														fontFamily: F.mono,
														fontSize: 12,
														color: C.textMuted,
													}}
												>
													{sub}
												</div>
											</div>
										</div>
									</div>

									{i < LAYERS.length - 1 && (
										<div
											style={{
												position: "relative",
												height: 24,
												marginLeft: 49,
											}}
										>
											<svg
												viewBox="0 0 2 24"
												style={{
													width: 2,
													height: 24,
													position: "absolute",
													left: 0,
													top: 0,
													overflow: "visible",
												}}
											>
												<line
													x1="1"
													y1="0"
													x2="1"
													y2={24 * connDraw}
													stroke={C.border}
													strokeWidth={2}
													strokeDasharray="4 3"
												/>
											</svg>
										</div>
									)}
								</React.Fragment>
							);
						})}

						{/* Bannière sécurité */}
						{(() => {
							const prog = spring({
								frame: frame - 98,
								fps,
								config: { damping: 14, stiffness: 90 },
								durationInFrames: 40,
							});
							return (
								<div
									style={{
										opacity: interpolate(prog, [0, 1], [0, 1]),
										transform: `translateX(${interpolate(prog, [0, 1], [-44, 0])}px)`,
										marginTop: 16,
										background: C.bg,
										boxShadow: NEU_RAISED,
										borderRadius: 14,
										padding: "14px 20px",
										display: "flex",
										alignItems: "center",
										gap: 12,
										borderLeft: `5px solid ${C.primary}`,
									}}
								>
									<Shield size={16} color={C.primary} strokeWidth={1.5} />
									<span
										style={{
											fontFamily: F.body,
											fontSize: 14,
											color: C.primary,
											fontWeight: 600,
										}}
									>
										Better-Auth · Organisation context obligatoire · Rôles
										transitifs
									</span>
								</div>
							);
						})()}
					</div>

					{/* ── Features — grille 2×3 (droite) ── */}
					<div
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							gap: 0,
						}}
					>
						<div
							style={{
								fontFamily: F.body,
								fontSize: 11,
								fontWeight: 700,
								color: C.textFaint,
								letterSpacing: "0.18em",
								textTransform: "uppercase",
								marginBottom: 20,
							}}
						>
							Fonctionnalités clés
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "16px 36px",
							}}
						>
							{FEATURES.map(({ text, color }, i) => {
								const prog = spring({
									frame: frame - 34 - i * 10,
									fps,
									config: { damping: 14, stiffness: 95 },
									durationInFrames: 36,
								});
								return (
									<div
										key={text}
										style={{
											opacity: interpolate(prog, [0, 1], [0, 1]),
											transform: `translateY(${interpolate(prog, [0, 1], [28, 0])}px)`,
											display: "flex",
											alignItems: "flex-start",
											gap: 14,
											background: C.bgCard,
											border: `1px solid ${C.border}`,
											borderLeft: `4px solid ${color}`,
											borderRadius: 14,
											padding: "16px 18px",
											boxShadow:
												"0 1px 3px rgba(28,20,16,0.05), 0 4px 12px rgba(28,20,16,0.06)",
										}}
									>
										<div
											style={{
												width: 30,
												height: 30,
												borderRadius: "50%",
												background: C.bg,
												boxShadow: NEU_CIRCLE,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												flexShrink: 0,
												marginTop: 1,
											}}
										>
											<CheckCircle2 size={14} color={color} strokeWidth={2.5} />
										</div>
										<span
											style={{
												fontFamily: F.body,
												fontSize: 17,
												color: C.text,
												lineHeight: 1.55,
											}}
										>
											{text}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
