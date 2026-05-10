/**
 * 05-GradeWorkflow — Pipeline examen (450 frames / 15 s)
 * Trail comet sur le rail · calcul durée audio automatique
 */

import { getAudioDuration } from "@remotion/media-utils";
import { Trail } from "@remotion/motion-blur";
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
		const d = await getAudioDuration(staticFile("audio/voiceover-05.mp3"));
		return { durationInFrames: Math.round(d * 30) + 30 };
	} catch {
		return {};
	}
};

import {
	CheckCircle2,
	FilePlus,
	GitMerge,
	Lock,
	PenLine,
	ThumbsUp,
} from "lucide-react";
import { DotGrid } from "../components/DotGrid";
import { FadingAudio } from "../components/FadingAudio";
import { Glow } from "../components/Glow";
import { TextReveal } from "../components/TextReveal";
import { AUDIO, C, DUR, F } from "../lib/theme";
import { sceneOpacity } from "../lib/transition";

// Composant interne — Trail nécessite un enfant avec useCurrentFrame() interne
// La comète parcourt le rail de gauche à droite en suivant beamProgress
const BeamComet: React.FC = () => {
	const frame = useCurrentFrame();
	const beamProg = interpolate(frame, [44, 215], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	// Position approximative sur le rail (padding 80 + H_PADDING sur 1920)
	const railLeft = 80 + H_PADDING + NODE_SIZE / 2;
	const railRight = 1920 - 80 - H_PADDING - NODE_SIZE / 2;
	const cometX = interpolate(beamProg, [0, 1], [railLeft, railRight]);
	// Y approximatif : padding 54 + header ~190 + NODE_SIZE/2 = ~288
	const cometY = 288;
	const cometOp = interpolate(beamProg, [0, 0.04, 0.96, 1], [0, 1, 1, 0]);
	return (
		<AbsoluteFill>
			<div
				style={{
					position: "absolute",
					left: cometX,
					top: cometY,
					width: 18,
					height: 18,
					borderRadius: "50%",
					background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${C.primary} 55%)`,
					boxShadow:
						"0 0 22px 8px rgba(91,74,212,0.45), 0 0 44px 12px rgba(91,74,212,0.18)",
					transform: "translate(-50%, -50%)",
					opacity: cometOp,
				}}
			/>
		</AbsoluteFill>
	);
};

const NEU_RAISED =
	"10px 10px 24px rgba(168,155,143,0.52), -10px -10px 24px rgba(255,255,255,0.86)";
const NEU_PRESSED =
	"inset 6px 6px 14px rgba(168,155,143,0.50), inset -6px -6px 14px rgba(255,255,255,0.84)";
const NEU_GROOVE =
	"inset 2px 2px 5px rgba(168,155,143,0.40), inset -2px -2px 5px rgba(255,255,255,0.78)";

const STEPS = [
	{
		Icon: FilePlus,
		color: C.textMuted,
		label: "Créé",
		detail: "L'examen est\nplanifié par l'admin",
	},
	{
		Icon: PenLine,
		color: C.violet,
		label: "En saisie",
		detail: "L'enseignant\nentre les notes",
	},
	{
		Icon: CheckCircle2,
		color: C.green,
		label: "Noté",
		detail: "Les notes sont\nvérifiées automatiquement",
	},
	{
		Icon: GitMerge,
		color: C.amber,
		label: "Soumis",
		detail: "Envoyé pour\nvalidation",
	},
	{
		Icon: ThumbsUp,
		color: C.primary,
		label: "Approuvé",
		detail: "Le responsable\nconfirme les résultats",
	},
	{
		Icon: Lock,
		color: C.red,
		label: "Clôturé",
		detail: "Archivé — aucune\nmodification possible",
	},
] as const;

const NODE_SIZE = 90; // diamètre des cercles
const H_PADDING = 52; // padding horizontal du rail

export const GradeWorkflowScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const op = sceneOpacity(frame, DUR.workflow, 20, 24);

	const beamProgress = interpolate(frame, [44, 215], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Pré-calcul des animations par étape
	const anims = STEPS.map((_, i) => {
		const prog = spring({
			frame: frame - 28 - i * 18,
			fps,
			config: { damping: 13, stiffness: 88, mass: 1.3 },
			durationInFrames: 52,
		});
		const nodeActivation = interpolate(
			beamProgress,
			[i / STEPS.length, Math.min(1, i / STEPS.length + 0.09)],
			[0, 1],
			{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
		);
		return {
			opacity: interpolate(prog, [0, 1], [0, 1]),
			y: interpolate(prog, [0, 1], [60, 0]),
			nodeActivation,
			isActive: nodeActivation > 0.5,
			pulse: 1 + nodeActivation * Math.sin(frame * 0.12) * 0.055,
		};
	});

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
					src={staticFile("audio/voiceover-05.mp3")}
					sceneDuration={DUR.workflow}
				/>
			)}

			<DotGrid opacity={op * 0.12} size={40} dotSize={1.5} color={C.primary} />
			<Glow x="50%" y="82%" size={800} color={C.primary} opacity={op * 0.06} />

			{/* Trail comet — suit le beam le long du rail avec motion blur cinématique */}
			<div style={{ opacity: op }}>
				<Trail layers={9} lagInFrames={2} trailOpacity={0.55}>
					<BeamComet />
				</Trail>
			</div>

			<div
				style={{
					opacity: op,
					padding: "54px 80px",
					display: "flex",
					flexDirection: "column",
					height: "100%",
					gap: 0,
				}}
			>
				{/* En-tête */}
				<div style={{ marginBottom: 52 }}>
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
							Cycle de vie d'un examen
						</div>
					</div>
					<TextReveal delay={10} stiffness={120} damping={16}>
						<h2
							style={{
								fontFamily: F.heading,
								fontSize: 76,
								fontWeight: 900,
								color: C.text,
								margin: 0,
								letterSpacing: "-0.03em",
								lineHeight: 1.05,
							}}
						>
							De la création au{" "}
							<span style={{ color: C.red }}>verrouillage définitif</span>
						</h2>
					</TextReveal>
				</div>

				{/* ── Pipeline (layout en 2 rangées) ── */}
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						gap: 0,
					}}
				>
					{/* ─── RANGÉE 1 : Nœuds + Rail ─────────────────────────────── */}
					{/* Le rail est positionné top:50% + translateY(-50%) dans ce div
					    dont la hauteur = NODE_SIZE → rail parfaitement centré sur les cercles */}
					<div
						style={{
							position: "relative",
							display: "flex",
							justifyContent: "space-between",
							padding: `0 ${H_PADDING}px`,
							height: NODE_SIZE,
							alignItems: "center",
						}}
					>
						{/* Rail neumorphique en creux */}
						<div
							style={{
								position: "absolute",
								top: "50%",
								left: H_PADDING,
								right: H_PADDING,
								height: 6,
								transform: "translateY(-50%)",
								borderRadius: 3,
								background: C.bg,
								boxShadow: NEU_GROOVE,
								zIndex: 0,
							}}
						/>

						{/* Barre de progression colorée */}
						<div
							style={{
								position: "absolute",
								top: "50%",
								left: H_PADDING,
								width: `calc(${beamProgress * 100}% - ${H_PADDING * 2}px)`,
								height: 6,
								transform: "translateY(-50%)",
								borderRadius: 3,
								background: `linear-gradient(90deg, ${C.primary}, ${C.violet})`,
								boxShadow: "0 0 14px rgba(91,74,212,0.35)",
								zIndex: 1,
							}}
						/>

						{/* Nœuds neumorphiques */}
						{STEPS.map(({ Icon, color, label }, i) => {
							const a = anims[i];
							return (
								<div
									key={label}
									style={{
										opacity: a.opacity,
										transform: `translateY(${a.y}px) scale(${a.pulse})`,
										position: "relative",
										zIndex: 10,
										flexShrink: 0,
									}}
								>
									<div
										style={{
											width: NODE_SIZE,
											height: NODE_SIZE,
											borderRadius: "50%",
											background: C.bg,
											boxShadow: a.isActive ? NEU_PRESSED : NEU_RAISED,
											border: a.isActive
												? `2.5px solid ${color}`
												: `2.5px solid ${C.border}`,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Icon
											size={36}
											color={color}
											strokeWidth={a.isActive ? 2 : 1.5}
										/>
									</div>
								</div>
							);
						})}
					</div>

					{/* ─── RANGÉE 2 : Labels ───────────────────────────────────── */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							padding: `0 ${H_PADDING}px`,
							marginTop: 20,
						}}
					>
						{STEPS.map(({ label, detail, color }, i) => {
							const a = anims[i];
							return (
								<div
									key={label}
									style={{
										width: NODE_SIZE,
										opacity: a.opacity,
										transform: `translateY(${a.y}px)`,
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: 8,
									}}
								>
									<div
										style={{
											fontFamily: F.heading,
											fontSize: 17,
											fontWeight: 900,
											color: a.isActive ? color : C.textMuted,
											textAlign: "center",
											letterSpacing: "-0.01em",
										}}
									>
										{label}
									</div>
									<div
										style={{
											fontFamily: F.body,
											fontSize: 13,
											color: C.textFaint,
											textAlign: "center",
											whiteSpace: "pre-line",
											lineHeight: 1.65,
										}}
									>
										{detail}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Avertissement neumorphique */}
				{(() => {
					const prog = spring({
						frame: frame - 242,
						fps,
						config: { damping: 17 },
						durationInFrames: 36,
					});
					return (
						<div
							style={{
								opacity: interpolate(prog, [0, 1], [0, 1]),
								transform: `translateY(${interpolate(prog, [0, 1], [14, 0])}px)`,
								background: C.bg,
								boxShadow: NEU_RAISED,
								borderRadius: 12,
								padding: "15px 22px",
								display: "flex",
								gap: 12,
								alignItems: "center",
								borderLeft: `5px solid ${C.red}`,
							}}
						>
							<Lock size={15} color={C.red} strokeWidth={2} />
							<span
								style={{
									fontFamily: F.body,
									fontSize: 15,
									color: C.red,
									fontWeight: 500,
								}}
							>
								Une fois clôturé, aucune modification n'est possible — vos
								résultats sont protégés et archivés définitivement
							</span>
						</div>
					);
				})()}
			</div>
		</AbsoluteFill>
	);
};
