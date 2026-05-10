/**
 * 04-Roles — Hiérarchie (420 frames / 14 s)
 * Neo-Brutalisme + Neumorphisme + @remotion/shapes décor + Trail sur les cartes
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
		const d = await getAudioDuration(staticFile("audio/voiceover-04.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import {
	BookOpen,
	Crown,
	GraduationCap,
	Shield,
	ShieldCheck,
	UserCircle,
} from "lucide-react";
import { DotGrid } from "../components/DotGrid";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

const NEU_RAISED =
	"10px 10px 24px rgba(168,155,143,0.52), -10px -10px 24px rgba(255,255,255,0.86)";
const NEU_CIRCLE =
	"5px 5px 12px rgba(168,155,143,0.45), -5px -5px 12px rgba(255,255,255,0.82)";
const NEU_GROOVE =
	"inset 1px 1px 3px rgba(168,155,143,0.45), inset -1px -1px 3px rgba(255,255,255,0.82)";

const ROLES = [
	{
		Icon: Crown,
		color: C.amber,
		name: "Super Admin",
		level: "N·1",
		perms: [
			"Gérer toutes les institutions",
			"Activer les années académiques",
			"Accès système complet",
		],
	},
	{
		Icon: ShieldCheck,
		color: C.red,
		name: "Administrateur",
		level: "N·2",
		perms: [
			"Créer cours, examens, classes",
			"Gérer les utilisateurs",
			"Approuver les notes",
		],
	},
	{
		Icon: GraduationCap,
		color: C.primary,
		name: "Doyen",
		level: "N·3",
		perms: [
			"Valider les délibérations",
			"Vue faculté complète",
			"Hérite droits Enseignant",
		],
	},
	{
		Icon: BookOpen,
		color: C.green,
		name: "Enseignant",
		level: "N·4",
		perms: ["Saisir ses notes", "Voir ses étudiants", "Calendrier examens"],
	},
	{
		Icon: UserCircle,
		color: C.textMuted,
		name: "Étudiant",
		level: "N·5",
		perms: [
			"Consulter ses notes",
			"Voir ses inscriptions",
			"Télécharger bulletin",
		],
	},
] as const;

export const RolesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.roles, 20, 24);

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
					src={staticFile("audio/voiceover-04.mp3")}
					sceneDuration={DUR.roles}
				/>
			)}

			<DotGrid opacity={op * 0.11} size={38} dotSize={1.5} color={C.primary} />
			<Glow x="50%" y="22%" size={800} color={C.primary} opacity={op * 0.05} />

			{/* Shapes décoratives — coins très subtils */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					opacity: op * 0.055,
				}}
			>
				<Triangle
					length={110}
					fill={C.primary}
					direction="down"
					style={{ position: "absolute", right: 52, top: 48 }}
				/>
				<Circle
					radius={80}
					fill={C.violet}
					style={{ position: "absolute", left: 40, bottom: 60 }}
				/>
				<Triangle
					length={60}
					fill={C.green}
					direction="right"
					style={{ position: "absolute", right: 40, bottom: 110 }}
				/>
			</div>

			<div
				style={{
					opacity: op,
					padding: "50px 72px",
					display: "flex",
					flexDirection: "column",
					height: "100%",
					gap: 0,
				}}
			>
				{/* En-tête */}
				<div style={{ marginBottom: 38 }}>
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
							Gestion des accès
						</div>
					</div>
					<TextReveal delay={10} stiffness={120} damping={16}>
						<h2
							style={{
								fontFamily: F.heading,
								fontSize: 72,
								fontWeight: 900,
								color: C.text,
								margin: 0,
								letterSpacing: "-0.035em",
								lineHeight: 1,
							}}
						>
							5 rôles,{" "}
							<span
								style={{
									background: `linear-gradient(120deg, ${C.primary}, ${C.violet})`,
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
								}}
							>
								chacun à sa place
							</span>
						</h2>
					</TextReveal>
				</div>

				{/* Cards neumorphiques */}
				<div style={{ display: "flex", gap: 14, flex: 1 }}>
					{ROLES.map(({ Icon, color, name, level, perms }, i) => {
						const prog = spring({
							frame: frame - 20 - i * 20,
							fps,
							config: { damping: 11, stiffness: 82, mass: 1.5 },
							durationInFrames: 60,
						});
						const cOp = interpolate(prog, [0, 1], [0, 1]);
						const cY = interpolate(prog, [0, 1], [120, 0]);
						const rX = interpolate(prog, [0, 1], [-32, 0]);

						return (
							<div
								key={name}
								style={{ flex: 1, opacity: cOp, perspective: "900px" }}
							>
								<div
									style={{
										height: "100%",
										background: C.bg,
										boxShadow: NEU_RAISED,
										borderRadius: 20,
										overflow: "hidden",
										display: "flex",
										flexDirection: "column",
										transform: `translateY(${cY}px) rotateX(${rX}deg)`,
										transformOrigin: "top center",
										position: "relative",
									}}
								>
									{/* Bande top brutalist */}
									<div
										style={{ height: 5, background: color, flexShrink: 0 }}
									/>

									<div
										style={{
											padding: "22px 20px",
											display: "flex",
											flexDirection: "column",
											gap: 16,
											flex: 1,
										}}
									>
										{/* Icône en cercle neumorphique */}
										<div
											style={{
												width: 54,
												height: 54,
												borderRadius: "50%",
												background: C.bg,
												boxShadow: NEU_CIRCLE,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<Icon size={26} color={color} strokeWidth={1.5} />
										</div>

										{/* Nom + badge niveau brutalist */}
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												gap: 7,
											}}
										>
											<div
												style={{
													fontFamily: F.heading,
													fontSize: 20,
													fontWeight: 800,
													color,
													letterSpacing: "-0.01em",
													lineHeight: 1.2,
												}}
											>
												{name}
											</div>
											{/* Badge brutalist — fond plein couleur */}
											<div
												style={{
													display: "inline-flex",
													alignItems: "center",
													background: color,
													padding: "2px 9px",
													borderRadius: 5,
													width: "fit-content",
												}}
											>
												<span
													style={{
														fontFamily: F.mono,
														fontSize: 10,
														fontWeight: 700,
														color: "white",
														letterSpacing: "0.12em",
													}}
												>
													{level}
												</span>
											</div>
										</div>

										{/* Divider en creux neumorphique */}
										<div
											style={{
												height: 2,
												borderRadius: 2,
												boxShadow: NEU_GROOVE,
											}}
										/>

										{/* Permissions */}
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												gap: 11,
											}}
										>
											{perms.map((p) => (
												<div
													key={p}
													style={{
														display: "flex",
														gap: 10,
														alignItems: "flex-start",
													}}
												>
													<div
														style={{
															marginTop: 7,
															width: 5,
															height: 5,
															borderRadius: "50%",
															background: color,
															flexShrink: 0,
														}}
													/>
													<span
														style={{
															fontFamily: F.body,
															fontSize: 14,
															color: C.textMuted,
															lineHeight: 1.6,
														}}
													>
														{p}
													</span>
												</div>
											))}
										</div>

										{/* Numéro filigrane */}
										<div
											style={{
												position: "absolute",
												bottom: 8,
												right: 14,
												fontFamily: F.heading,
												fontSize: 72,
												fontWeight: 900,
												color: `${color}08`,
												lineHeight: 1,
												userSelect: "none",
												letterSpacing: "-0.05em",
											}}
										>
											{String(i + 1).padStart(2, "0")}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Note hiérarchie — neumorphique */}
				{(() => {
					const prog = spring({
						frame: frame - 155,
						fps,
						config: { damping: 17 },
						durationInFrames: 36,
					});
					return (
						<div
							style={{
								opacity: interpolate(prog, [0, 1], [0, 1]),
								transform: `translateY(${interpolate(prog, [0, 1], [14, 0])}px)`,
								marginTop: 16,
								background: C.bg,
								boxShadow: NEU_RAISED,
								borderRadius: 12,
								padding: "15px 22px",
								display: "flex",
								gap: 12,
								alignItems: "center",
								borderLeft: `5px solid ${C.primary}`,
							}}
						>
							<Shield size={16} color={C.primary} strokeWidth={1.5} />
							<span
								style={{
									fontFamily: F.body,
									fontSize: 15,
									color: C.primary,
									fontWeight: 400,
								}}
							>
								Un Doyen peut faire tout ce qu'un Enseignant fait — les droits
								se transmettent automatiquement vers le bas
							</span>
						</div>
					);
				})()}
			</div>
		</AbsoluteFill>
	);
};
