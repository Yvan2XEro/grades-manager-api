/**
 * 08-TechStack — The Stack (390 frames / 13 s)
 * Grille 2×2 · @remotion/shapes décor · durée audio auto
 */

import { getAudioDuration } from "@remotion/media-utils";
import { Circle, Triangle } from "@remotion/shapes";
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

export const calculateMetadataFn = async () => {
	try {
		const d = await getAudioDuration(staticFile("audio/voiceover-08.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import {
	Code2,
	Cpu,
	Database,
	Globe,
	Monitor,
	Package,
	Server,
	Zap,
} from "lucide-react";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

const CATEGORIES = [
	{
		Icon: Cpu,
		color: C.amber,
		bg: C.amberDim,
		label: "Performance",
		items: [
			{
				name: "Rapide",
				desc: "L'application démarre et répond en quelques millisecondes",
			},
			{
				name: "Fiable",
				desc: "Erreurs détectées avant la mise en production, pas après",
			},
			{
				name: "Maintenable",
				desc: "Code cohérent et lisible — facile à faire évoluer",
			},
		],
	},
	{
		Icon: Server,
		color: C.primary,
		bg: C.primaryDim,
		label: "Serveur & Sécurité",
		items: [
			{
				name: "Authentification",
				desc: "Connexion sécurisée par e-mail, gestion des sessions",
			},
			{
				name: "Contrôle d'accès",
				desc: "Chaque utilisateur voit uniquement ce qu'il doit voir",
			},
			{
				name: "API ouverte",
				desc: "Intégration facile avec vos autres outils institutionnels",
			},
			{
				name: "Données protégées",
				desc: "Chaque institution a ses propres données isolées",
			},
		],
	},
	{
		Icon: Monitor,
		color: C.green,
		bg: C.greenDim,
		label: "Interface utilisateur",
		items: [
			{
				name: "Moderne & fluide",
				desc: "Interface réactive, agréable sur écran et tablette",
			},
			{ name: "Bilingue", desc: "Disponible en français et en anglais" },
			{
				name: "Personnalisable",
				desc: "Couleurs, logos et contenus adaptés à votre institution",
			},
			{
				name: "Intuitif",
				desc: "Prise en main rapide sans formation technique",
			},
		],
	},
	{
		Icon: Database,
		color: C.red,
		bg: C.redDim,
		label: "Infrastructure",
		items: [
			{
				name: "Stockage robuste",
				desc: "Base de données éprouvée, utilisée par des milliers d'entreprises",
			},
			{
				name: "Environnement test",
				desc: "Possibilité de tester sans toucher aux vraies données",
			},
			{
				name: "Tâches planifiées",
				desc: "Envoi automatique de résultats, rappels, exports périodiques",
			},
		],
	},
] as const;

const TAGS = [
	{ Icon: Zap, label: "Performant" },
	{ Icon: Code2, label: "Open Source" },
	{ Icon: Package, label: "Déployable" },
	{ Icon: Globe, label: "Multi-institutions" },
] as const;

export const TechStackScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.techStack, 20, 24);

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
					src={staticFile("audio/voiceover-08.mp3")}
					sceneDuration={DUR.techStack}
				/>
			)}
			<Glow x="25%" y="75%" size={700} color={C.primary} opacity={op * 0.07} />
			<Glow x="78%" y="28%" size={600} color={C.green} opacity={op * 0.06} />
			<Glow x="90%" y="80%" size={500} color={C.amber} opacity={op * 0.04} />

			{/* @remotion/shapes — formes décoratives très subtiles aux coins */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					opacity: op * 0.06,
				}}
			>
				<Triangle
					length={140}
					fill={C.amber}
					direction="up"
					style={{ position: "absolute", right: 30, top: 30 }}
				/>
				<Circle
					radius={90}
					fill={C.green}
					style={{ position: "absolute", left: 28, bottom: 48 }}
				/>
				<Triangle
					length={70}
					fill={C.primary}
					direction="left"
					style={{ position: "absolute", right: 28, bottom: 68 }}
				/>
				<Circle
					radius={48}
					fill={C.violet}
					style={{ position: "absolute", left: 58, top: 55 }}
				/>
			</div>

			<div
				style={{
					opacity: op,
					padding: "50px 80px",
					display: "flex",
					flexDirection: "column",
					gap: 26,
					height: "100%",
				}}
			>
				{/* En-tête */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
					}}
				>
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
									color: C.violet,
									letterSpacing: "0.2em",
									textTransform: "uppercase",
								}}
							>
								<div
									style={{
										width: 24,
										height: 2,
										background: C.violet,
										borderRadius: 2,
									}}
								/>
								Fiabilité & qualité
							</div>
						</div>
						<TextReveal delay={10} stiffness={115} damping={20}>
							<h2
								style={{
									fontFamily: F.heading,
									fontSize: 70,
									fontWeight: 800,
									color: C.text,
									margin: 0,
									letterSpacing: "-0.03em",
								}}
							>
								Conçu pour{" "}
								<span
									style={{
										background: `linear-gradient(120deg, ${C.primary}, ${C.violet})`,
										WebkitBackgroundClip: "text",
										WebkitTextFillColor: "transparent",
									}}
								>
									durer et s'adapter
								</span>
							</h2>
						</TextReveal>
					</div>

					{/* Tags */}
					<div style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
						{TAGS.map(({ Icon, label }, i) => {
							const prog = spring({
								frame: frame - 18 - i * 10,
								fps,
								config: { damping: 17 },
								durationInFrames: 30,
							});
							return (
								<div
									key={label}
									style={{
										opacity: interpolate(prog, [0, 1], [0, 1]),
										transform: `translateY(${interpolate(prog, [0, 1], [12, 0])}px)`,
										display: "flex",
										alignItems: "center",
										gap: 7,
										padding: "8px 18px",
										background: C.bgCard,
										border: `1px solid ${C.border}`,
										borderRadius: 999,
										boxShadow: "0 1px 3px rgba(28,20,16,0.05)",
									}}
								>
									<Icon size={13} color={C.textMuted} strokeWidth={1.5} />
									<span
										style={{
											fontFamily: F.body,
											fontSize: 13,
											fontWeight: 600,
											color: C.textMuted,
											letterSpacing: "0.06em",
										}}
									>
										{label}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* Grille 2×2 */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gridTemplateRows: "1fr 1fr",
						gap: 18,
						flex: 1,
					}}
				>
					{CATEGORIES.map(({ Icon, color, bg, label, items }, ci) => {
						const prog = spring({
							frame: frame - 28 - ci * 18,
							fps,
							config: { damping: 15, stiffness: 90, mass: 1.2 },
							durationInFrames: 50,
						});
						const cOp = interpolate(prog, [0, 1], [0, 1]);
						const cY = interpolate(prog, [0, 1], [48, 0]);
						const cSc = interpolate(prog, [0, 1], [0.96, 1]);

						return (
							<div
								key={label}
								style={{
									opacity: cOp,
									transform: `translateY(${cY}px) scale(${cSc})`,
									background: C.bgCard,
									border: `1px solid ${C.border}`,
									borderTop: `4px solid ${color}`,
									borderRadius: 18,
									padding: "26px 28px",
									display: "flex",
									flexDirection: "column",
									gap: 16,
									boxShadow:
										"0 1px 3px rgba(28,20,16,0.05), 0 10px 30px rgba(28,20,16,0.08)",
									position: "relative",
									overflow: "hidden",
								}}
							>
								{/* Glow subtil coin */}
								<div
									style={{
										position: "absolute",
										top: -40,
										right: -40,
										width: 160,
										height: 160,
										borderRadius: "50%",
										background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
										pointerEvents: "none",
									}}
								/>

								{/* Header catégorie */}
								<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
									<div
										style={{
											width: 48,
											height: 48,
											borderRadius: 12,
											background: bg,
											border: `1px solid ${C.border}`,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexShrink: 0,
										}}
									>
										<Icon size={22} color={color} strokeWidth={1.5} />
									</div>
									<div
										style={{
											fontFamily: F.heading,
											fontSize: 20,
											fontWeight: 700,
											color,
											letterSpacing: "0.01em",
										}}
									>
										{label}
									</div>
								</div>

								<div
									style={{
										height: 1,
										background: `linear-gradient(90deg, ${color}35, transparent)`,
									}}
								/>

								{/* Items — mini table */}
								<div
									style={{ display: "flex", flexDirection: "column", gap: 13 }}
								>
									{items.map(({ name, desc }) => (
										<div
											key={name}
											style={{
												display: "flex",
												gap: 14,
												alignItems: "flex-start",
											}}
										>
											<div
												style={{
													fontFamily: F.mono,
													fontSize: 12,
													fontWeight: 700,
													color,
													background: `${color}14`,
													border: `1px solid ${color}28`,
													borderRadius: 6,
													padding: "3px 10px",
													whiteSpace: "nowrap",
													flexShrink: 0,
													marginTop: 1,
												}}
											>
												{name}
											</div>
											<span
												style={{
													fontFamily: F.body,
													fontSize: 14,
													color: C.textMuted,
													lineHeight: 1.65,
												}}
											>
												{desc}
											</span>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
