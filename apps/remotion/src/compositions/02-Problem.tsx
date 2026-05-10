/**
 * 02-Problem — The Pain (360 frames / 12 s)
 * Neo-Brutalisme + Neumorphisme + evolveSvgPath fond organique
 */

import { getAudioDuration } from "@remotion/media-utils";
import { noise2D } from "@remotion/noise";
import { AlertTriangle, Building2, Database } from "lucide-react";
import type React from "react";
import {
	AbsoluteFill,
	Audio,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { DotGrid } from "../components/DotGrid";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-02.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

// ── Neumorphic shadows (calibrés pour C.bg = #F7F4F0) ──────────────────────
const NEU_RAISED =
	"10px 10px 24px rgba(168,155,143,0.52), -10px -10px 24px rgba(255,255,255,0.86)";
const NEU_GROOVE =
	"inset 1px 1px 3px rgba(168,155,143,0.45), inset -1px -1px 3px rgba(255,255,255,0.82)";

const PAINS = [
	{
		Icon: AlertTriangle,
		color: C.red,
		num: "01",
		title: "Gestion manuelle",
		sub: "des notes",
		desc: "Tableurs partagés, conflits de versions. Les erreurs de saisie sont impossibles à retrouver ou auditer.",
	},
	{
		Icon: Database,
		color: C.amber,
		num: "02",
		title: "Aucune",
		sub: "traçabilité",
		desc: "Qui a modifié quoi et quand ? Délibérations opaques, contestables et sans historique fiable.",
	},
	{
		Icon: Building2,
		color: C.textMuted,
		num: "03",
		title: "Silos",
		sub: "institutionnels",
		desc: "Chaque établissement dans sa bulle — aucun standard, aucune intégration entre institutions.",
	},
] as const;

export const ProblemScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.problem, 20, 24);

	return (
		<AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
			{AUDIO.enabled && (
				<Audio
					src={staticFile("audio/transition.mp3")}
					volume={AUDIO.transitionVolume}
					endAt={22}
				/>
			)}
			{AUDIO.enabled && (
				<FadingAudio
					src={staticFile("audio/voiceover-02.mp3")}
					sceneDuration={DUR.problem}
				/>
			)}

			<DotGrid opacity={op * 0.13} size={36} dotSize={1.5} color={C.red} />
			<Glow x="6%" y="12%" size={480} color={C.red} opacity={op * 0.06} />
			<Glow x="94%" y="88%" size={420} color={C.amber} opacity={op * 0.05} />

			{/* noise2D blob — forme organique qui respire en fond (remplace evolveSvgPath) */}
			{(() => {
				const POINTS = 10;
				const cx = 960;
				const cy = 540;
				const r = 280;
				const t = frame * 0.0009;
				const noisePath = `${Array.from({ length: POINTS }, (_, i) => {
					const angle = (i / POINTS) * Math.PI * 2;
					const n = noise2D(
						`pb-${i}`,
						Math.cos(angle) + t,
						Math.sin(angle) + t,
					);
					const dist = r + n * 88;
					const px = cx + Math.cos(angle) * dist;
					const py = cy + Math.sin(angle) * dist;
					return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
				}).join(" ")} Z`;
				return (
					<AbsoluteFill style={{ pointerEvents: "none" }}>
						<svg
							style={{
								position: "absolute",
								inset: 0,
								width: "100%",
								height: "100%",
							}}
							viewBox="0 0 1920 1080"
						>
							<path d={noisePath} fill={C.red} opacity={op * 0.025} />
						</svg>
					</AbsoluteFill>
				);
			})()}

			<div
				style={{
					opacity: op,
					padding: "58px 80px",
					display: "flex",
					flexDirection: "column",
					height: "100%",
					gap: 0,
				}}
			>
				{/* En-tête */}
				<div style={{ marginBottom: 44 }}>
					<div style={{ overflow: "hidden", marginBottom: 12 }}>
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
								color: C.red,
								letterSpacing: "0.2em",
								textTransform: "uppercase",
							}}
						>
							<div
								style={{
									width: 28,
									height: 3,
									background: C.red,
									borderRadius: 2,
								}}
							/>
							Le problème
						</div>
					</div>
					<TextReveal delay={10} stiffness={120} damping={16}>
						<h2
							style={{
								fontFamily: F.heading,
								fontSize: 80,
								fontWeight: 900,
								color: C.text,
								margin: 0,
								lineHeight: 1,
								letterSpacing: "-0.04em",
							}}
						>
							Gérer l'académique ne devrait
						</h2>
					</TextReveal>
					<TextReveal delay={20} stiffness={120} damping={16}>
						<h2
							style={{
								fontFamily: F.heading,
								fontSize: 80,
								fontWeight: 900,
								color: C.red,
								margin: 0,
								lineHeight: 1,
								letterSpacing: "-0.04em",
							}}
						>
							pas être chaotique.
						</h2>
					</TextReveal>
				</div>

				{/* Cards neo-brutales + neumorphiques */}
				<div style={{ display: "flex", gap: 22, flex: 1 }}>
					{PAINS.map(({ Icon, color, num, title, sub, desc }, i) => {
						const prog = spring({
							frame: frame - 26 - i * 22,
							fps,
							config: { damping: 11, stiffness: 85, mass: 1.5 },
							durationInFrames: 60,
						});
						const cOp = interpolate(prog, [0, 1], [0, 1]);
						const cY = interpolate(prog, [0, 1], [140, 0]);
						const rX = interpolate(prog, [0, 1], [-38, 0]);

						return (
							<div
								key={num}
								style={{ flex: 1, opacity: cOp, perspective: "1000px" }}
							>
								<div
									style={{
										height: "100%",
										background: C.bg,
										boxShadow: NEU_RAISED,
										borderRadius: 22,
										overflow: "hidden",
										display: "flex",
										flexDirection: "column",
										transform: `translateY(${cY}px) rotateX(${rX}deg)`,
										transformOrigin: "top center",
									}}
								>
									{/* ── Header brutalist — fond couleur plein ── */}
									<div
										style={{
											background: color,
											padding: "22px 26px",
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-end",
											flexShrink: 0,
										}}
									>
										<div
											style={{
												width: 50,
												height: 50,
												borderRadius: 13,
												background: "rgba(255,255,255,0.18)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<Icon size={26} color="white" strokeWidth={2} />
										</div>
										<span
											style={{
												fontFamily: F.heading,
												fontSize: 84,
												fontWeight: 900,
												color: "rgba(255,255,255,0.22)",
												lineHeight: 1,
												letterSpacing: "-0.06em",
											}}
										>
											{num}
										</span>
									</div>

									{/* ── Corps neumorphique ── */}
									<div
										style={{
											padding: "26px 26px",
											display: "flex",
											flexDirection: "column",
											gap: 18,
											flex: 1,
										}}
									>
										<div>
											<div
												style={{
													fontFamily: F.heading,
													fontSize: 36,
													fontWeight: 900,
													color: C.text,
													lineHeight: 1.1,
													letterSpacing: "-0.02em",
												}}
											>
												{title}
											</div>
											<div
												style={{
													fontFamily: F.heading,
													fontSize: 36,
													fontWeight: 900,
													color,
													lineHeight: 1.1,
													letterSpacing: "-0.02em",
												}}
											>
												{sub}
											</div>
										</div>

										{/* Séparateur neumorphique en creux */}
										<div
											style={{
												height: 2,
												borderRadius: 2,
												boxShadow: NEU_GROOVE,
											}}
										/>

										<p
											style={{
												fontFamily: F.body,
												fontSize: 18,
												color: C.textMuted,
												lineHeight: 1.75,
												margin: 0,
											}}
										>
											{desc}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
