/**
 * 07-Deliberation — The Results (420 frames / 14 s)
 * Table web · arcs CircularProgress · interpolateColors fond · durée audio auto
 */

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

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-07.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import { AlertCircle, CheckCircle2, Star, XCircle } from "lucide-react";
import { CircularProgress } from "../components/CircularProgress";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

const STUDENTS = [
	{
		name: "Ndong Alain",
		avg: "14.2",
		status: "ADMIS",
		Icon: CheckCircle2,
		color: C.green,
	},
	{
		name: "Pierre Transfert",
		avg: "16.7",
		status: "ADMIS AVEC MENTION",
		Icon: Star,
		color: C.primary,
	},
	{
		name: "Eyebe Rachel",
		avg: "11.8",
		status: "ADMIS",
		Icon: CheckCircle2,
		color: C.green,
	},
	{
		name: "Brice Onana",
		avg: "9.5",
		status: "RATTRAPAGE",
		Icon: AlertCircle,
		color: C.amber,
	},
	{
		name: "Marie Nkolo",
		avg: "7.2",
		status: "NON ADMIS",
		Icon: XCircle,
		color: C.red,
	},
] as const;

const ARCS = [
	{
		label: "Taux de réussite",
		value: 72,
		color: C.green,
		cx: 210,
		cy: 530,
		r: 108,
	},
	{ label: "Mentions", value: 28, color: C.primary, cx: 545, cy: 530, r: 108 },
	{ label: "Rattrapages", value: 18, color: C.amber, cx: 875, cy: 530, r: 108 },
	{ label: "Non admis", value: 10, color: C.red, cx: 1200, cy: 530, r: 108 },
] as const;

const TABLE_COLS = "1fr 148px 230px";

export const DeliberationScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.deliberation, 20, 24);

	// interpolateColors — fond qui vire doucement vers un vert très léger au fil des résultats
	const bgColor = interpolateColors(
		frame,
		[0, DUR.deliberation * 0.8],
		[C.bg, "#F3F7F5"],
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
					src={staticFile("audio/voiceover-07.mp3")}
					sceneDuration={DUR.deliberation}
				/>
			)}
			<Glow x="78%" y="18%" size={700} color={C.green} opacity={op * 0.07} />
			<Glow x="12%" y="78%" size={600} color={C.primary} opacity={op * 0.06} />

			<div
				style={{
					opacity: op,
					padding: "54px 80px",
					display: "flex",
					flexDirection: "column",
					gap: 32,
					height: "100%",
				}}
			>
				{/* En-tête */}
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
								color: C.green,
								letterSpacing: "0.2em",
								textTransform: "uppercase",
							}}
						>
							<div
								style={{
									width: 24,
									height: 2,
									background: C.green,
									borderRadius: 2,
								}}
							/>
							Délibération de fin d'année
						</div>
					</div>
					<TextReveal delay={10} stiffness={115} damping={20}>
						<h2
							style={{
								fontFamily: F.heading,
								fontSize: 76,
								fontWeight: 800,
								color: C.text,
								margin: 0,
								letterSpacing: "-0.03em",
								lineHeight: 1.05,
							}}
						>
							Résultats{" "}
							<span
								style={{
									background: `linear-gradient(120deg, ${C.green}, ${C.primary})`,
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
								}}
							>
								automatisés par règles
							</span>
						</h2>
					</TextReveal>
				</div>

				<div style={{ display: "flex", gap: 44, flex: 1, minHeight: 0 }}>
					{/* ── Table étudiants ──────────────────────── */}
					{(() => {
						const wrapProg = spring({
							frame: frame - 18,
							fps,
							config: { damping: 18, stiffness: 90 },
							durationInFrames: 40,
						});
						return (
							<div
								style={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									opacity: interpolate(wrapProg, [0, 1], [0, 1]),
									transform: `translateX(${interpolate(wrapProg, [0, 1], [-32, 0])}px)`,
									background: C.bgCard,
									border: `1px solid ${C.border}`,
									borderRadius: 18,
									overflow: "hidden",
									boxShadow:
										"0 1px 3px rgba(28,20,16,0.05), 0 10px 30px rgba(28,20,16,0.08)",
								}}
							>
								{/* Titre tableau */}
								<div
									style={{
										padding: "18px 24px 14px",
										borderBottom: `1px solid ${C.border}`,
									}}
								>
									<div
										style={{
											fontFamily: F.heading,
											fontSize: 17,
											fontWeight: 700,
											color: C.text,
											marginBottom: 2,
										}}
									>
										INF25-BTS1A
									</div>
									<div
										style={{
											fontFamily: F.body,
											fontSize: 13,
											color: C.textFaint,
										}}
									>
										Promotion 2024-2025 · 5 étudiants
									</div>
								</div>

								{/* Header colonnes */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: TABLE_COLS,
										padding: "10px 24px",
										background: C.bgMuted,
										borderBottom: `1px solid ${C.border}`,
									}}
								>
									{["Étudiant", "Moyenne", "Statut"].map((h) => (
										<span
											key={h}
											style={{
												fontFamily: F.body,
												fontSize: 11,
												fontWeight: 700,
												color: C.textFaint,
												letterSpacing: "0.14em",
												textTransform: "uppercase",
											}}
										>
											{h}
										</span>
									))}
								</div>

								{/* Lignes */}
								{STUDENTS.map(({ name, avg, status, Icon, color }, i) => {
									const prog = spring({
										frame: frame - 32 - i * 18,
										fps,
										config: { damping: 17, stiffness: 100 },
										durationInFrames: 44,
									});
									const sOp = interpolate(prog, [0, 1], [0, 1]);
									const sX = interpolate(prog, [0, 1], [-24, 0]);
									return (
										<div
											key={name}
											style={{ opacity: sOp, transform: `translateX(${sX}px)` }}
										>
											<div
												style={{
													display: "grid",
													gridTemplateColumns: TABLE_COLS,
													padding: "17px 24px",
													borderBottom:
														i < STUDENTS.length - 1
															? `1px solid ${C.borderSub}`
															: undefined,
													alignItems: "center",
													borderLeft: `3px solid ${color}`,
												}}
											>
												{/* Nom */}
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 10,
													}}
												>
													<div
														style={{
															width: 8,
															height: 8,
															borderRadius: "50%",
															background: color,
															flexShrink: 0,
														}}
													/>
													<span
														style={{
															fontFamily: F.heading,
															fontSize: 17,
															fontWeight: 600,
															color: C.text,
														}}
													>
														{name}
													</span>
												</div>
												{/* Moyenne */}
												<span
													style={{
														fontFamily: F.mono,
														fontSize: 16,
														fontWeight: 600,
														color: C.textMuted,
													}}
												>
													{avg} / 20
												</span>
												{/* Statut */}
												<div
													style={{
														display: "inline-flex",
														alignItems: "center",
														gap: 7,
														padding: "5px 12px",
														background: `${color}14`,
														border: `1px solid ${color}25`,
														borderRadius: 999,
														width: "fit-content",
													}}
												>
													<Icon size={13} color={color} strokeWidth={2} />
													<span
														style={{
															fontFamily: F.body,
															fontSize: 12,
															fontWeight: 700,
															color,
															letterSpacing: "0.06em",
														}}
													>
														{status}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						);
					})()}

					{/* ── Arcs circulaires + règles ────────────── */}
					<div
						style={{
							flex: "0 0 860px",
							display: "flex",
							flexDirection: "column",
							gap: 0,
						}}
					>
						<div
							style={{
								fontFamily: F.body,
								fontSize: 11,
								fontWeight: 700,
								color: C.textFaint,
								letterSpacing: "0.14em",
								textTransform: "uppercase",
								marginBottom: 22,
							}}
						>
							Statistiques de session
						</div>

						<div style={{ position: "relative", flex: 1 }}>
							<svg
								viewBox="0 0 1400 580"
								style={{ width: "100%", height: "100%" }}
							>
								{ARCS.map(({ label, value, color, cx, cy, r }, i) => {
									const elapsed = Math.max(0, frame - 54 - i * 18);
									const arcProg = Math.min(1, elapsed / 70);
									const numVal = Math.round(arcProg * value);

									const labelProg = spring({
										frame: frame - 48 - i * 18,
										fps,
										config: { damping: 17 },
										durationInFrames: 36,
									});
									const lOp = interpolate(labelProg, [0, 1], [0, 1]);

									return (
										<g key={label} opacity={lOp}>
											<CircularProgress
												cx={cx}
												cy={cy}
												r={r}
												progress={arcProg}
												color={color}
												trackColor={C.borderSub}
												strokeWidth={10}
											/>
											{/* Valeur centrale */}
											<text
												x={cx}
												y={cy - 4}
												textAnchor="middle"
												fontFamily="Sora, sans-serif"
												fontSize={42}
												fontWeight={800}
												fill={color}
											>
												{numVal}%
											</text>
											{/* Label dessous */}
											<text
												x={cx}
												y={cy + 32}
												textAnchor="middle"
												fontFamily="Inter, sans-serif"
												fontSize={15}
												fill="rgba(107,94,82,0.75)"
											>
												{label}
											</text>
										</g>
									);
								})}
							</svg>
						</div>

						{/* Règles de promotion */}
						{(() => {
							const prog = spring({
								frame: frame - 168,
								fps,
								config: { damping: 17 },
								durationInFrames: 36,
							});
							const rOp = interpolate(prog, [0, 1], [0, 1]);
							const rY = interpolate(prog, [0, 1], [14, 0]);
							return (
								<div
									style={{
										opacity: rOp,
										transform: `translateY(${rY}px)`,
										background: C.bgCard,
										border: `1px solid ${C.border}`,
										borderTop: `3px solid ${C.green}`,
										borderRadius: 14,
										padding: "20px 24px",
										boxShadow:
											"0 1px 3px rgba(28,20,16,0.05), 0 6px 18px rgba(28,20,16,0.07)",
									}}
								>
									<div
										style={{
											fontFamily: F.heading,
											fontSize: 16,
											fontWeight: 700,
											color: C.green,
											marginBottom: 14,
										}}
									>
										Règles de promotion appliquées
									</div>
									{[
										"Moyenne générale ≥ 10 / 20",
										"Aucune matière < 6 / 20",
										"Présence ≥ 75 % des séances",
									].map((r) => (
										<div
											key={r}
											style={{
												display: "flex",
												gap: 10,
												alignItems: "center",
												marginBottom: 10,
											}}
										>
											<CheckCircle2 size={14} color={C.green} strokeWidth={2} />
											<span
												style={{
													fontFamily: F.body,
													fontSize: 15,
													color: C.textMuted,
												}}
											>
												{r}
											</span>
										</div>
									))}
								</div>
							);
						})()}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
