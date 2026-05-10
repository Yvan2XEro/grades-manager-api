import { preloadAudio, preloadImage } from "@remotion/preload";
import {
	linearTiming,
	springTiming,
	TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import {
	Audio,
	Composition,
	interpolate,
	staticFile,
	useCurrentFrame,
} from "remotion";
import {
	IntroScene,
	calculateMetadataFn as introMeta,
} from "./compositions/00-Intro";
import {
	HeroScene,
	calculateMetadataFn as heroMeta,
} from "./compositions/01-Hero";
import {
	ProblemScene,
	calculateMetadataFn as problemMeta,
} from "./compositions/02-Problem";
import {
	SolutionScene,
	calculateMetadataFn as solutionMeta,
} from "./compositions/03-Solution";
import {
	RolesScene,
	calculateMetadataFn as rolesMeta,
} from "./compositions/04-Roles";
import {
	GradeWorkflowScene,
	calculateMetadataFn as workflowMeta,
} from "./compositions/05-GradeWorkflow";
import {
	ScreenshotsScene,
	calculateMetadataFn as screenshotsMeta,
} from "./compositions/06-Screenshots";
import {
	DeliberationScene,
	calculateMetadataFn as deliberationMeta,
} from "./compositions/07-Deliberation";
import {
	TechStackScene,
	calculateMetadataFn as techStackMeta,
} from "./compositions/08-TechStack";
import {
	OutroScene,
	calculateMetadataFn as outroMeta,
} from "./compositions/09-Outro";
import { AUDIO, DUR, VIDEO } from "./lib/theme";
import {
	curtainSlide,
	scaleReveal,
	slideUp,
	zoomBlur,
} from "./lib/transitions";

// ─────────────────────────────────────────────────────────────────────────────
// Préchargement des assets pour un preview Studio sans freeze
// ─────────────────────────────────────────────────────────────────────────────
[
	"audio/background.mp3",
	"audio/transition.mp3",
	"audio/reveal.mp3",
	...Array.from(
		{ length: 10 },
		(_, i) => `audio/voiceover-${String(i).padStart(2, "0")}.mp3`,
	),
].forEach((f) => preloadAudio(staticFile(f)));

[
	"logo.png",
	"logo-bg.png",
	"screens/dashboard.png",
	"screens/students.png",
	"screens/grades.png",
	"screens/exams.png",
	"screens/deliberations.png",
].forEach((f) => preloadImage(staticFile(f)));

const { width, height, fps } = VIDEO;

// Durée de chaque transition (overlap entre scènes adjacentes)
const TRANS = 30;

// TOTAL = somme des durées - overlaps (9 transitions entre 10 scènes)
const TOTAL =
	DUR.intro +
	DUR.hero +
	DUR.problem +
	DUR.solution +
	DUR.roles +
	DUR.workflow +
	DUR.screenshots +
	DUR.deliberation +
	DUR.techStack +
	DUR.outro -
	9 * TRANS;

// Positions absolues de début de chaque scène dans la timeline avec transitions
const S0 = 0;
const S1 = S0 + DUR.intro - TRANS;
const S2 = S1 + DUR.hero - TRANS;
const S3 = S2 + DUR.problem - TRANS;
const S4 = S3 + DUR.solution - TRANS;
const S5 = S4 + DUR.roles - TRANS;
const S6 = S5 + DUR.workflow - TRANS;
const S7 = S6 + DUR.screenshots - TRANS;
const S8 = S7 + DUR.deliberation - TRANS;
const S9 = S8 + DUR.techStack - TRANS;

// ─────────────────────────────────────────────────────────────────────────────
// Musique de fond — dynamique par scène
// ─────────────────────────────────────────────────────────────────────────────
const BackgroundMusic: React.FC = () => {
	const frame = useCurrentFrame();
	const volume = interpolate(
		frame,
		[
			S0,
			S0 + 35,
			S1,
			S1 + 55,
			S2,
			S2 + 30,
			S3,
			S3 + 40,
			S4,
			S4 + 40,
			S5,
			S5 + 50,
			S6,
			S6 + 40,
			S7,
			S7 + 30,
			S8,
			S8 + 40,
			S9,
			S9 + 70,
			TOTAL - 55,
			TOTAL,
		],
		[
			0, 0.18, 0.3, 0.2, 0.13, 0.13, 0.24, 0.2, 0.18, 0.18, 0.21, 0.21, 0.28,
			0.24, 0.14, 0.14, 0.2, 0.2, 0.26, 0.34, 0.1, 0,
		],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);
	if (!AUDIO.enabled) return null;
	return (
		<Audio src={staticFile("audio/background.mp3")} volume={volume} loop />
	);
};

// ─────────────────────────────────────────────────────────────────────────────
// Composition principale avec transitions
// ─────────────────────────────────────────────────────────────────────────────
export const GradesManagerPresentation: React.FC = () => (
	<>
		<BackgroundMusic />
		<TransitionSeries>
			{/* 00 — Intro */}
			<TransitionSeries.Sequence durationInFrames={DUR.intro}>
				<IntroScene />
			</TransitionSeries.Sequence>

			{/* 00→01 : scale reveal — intro élégante vers hero */}
			<TransitionSeries.Transition
				timing={springTiming({
					durationInFrames: TRANS,
					config: { damping: 14, stiffness: 80 },
				})}
				presentation={scaleReveal()}
			/>

			{/* 01 — Hero */}
			<TransitionSeries.Sequence durationInFrames={DUR.hero}>
				<HeroScene />
			</TransitionSeries.Sequence>

			{/* 01→02 : ZOOM BLUR — l'écran explose vers l'avant, plonge dans le problème */}
			<TransitionSeries.Transition
				timing={springTiming({
					durationInFrames: TRANS,
					config: { damping: 12, stiffness: 70 },
				})}
				presentation={zoomBlur()}
			/>

			{/* 02 — Problem */}
			<TransitionSeries.Sequence durationInFrames={DUR.problem}>
				<ProblemScene />
			</TransitionSeries.Sequence>

			{/* 02→03 : curtain droite — rideau qui révèle la solution */}
			<TransitionSeries.Transition
				timing={linearTiming({ durationInFrames: TRANS })}
				presentation={curtainSlide("right")}
			/>

			{/* 03 — Solution */}
			<TransitionSeries.Sequence durationInFrames={DUR.solution}>
				<SolutionScene />
			</TransitionSeries.Sequence>

			{/* 03→04 : slide up — énergie montante vers les rôles */}
			<TransitionSeries.Transition
				timing={springTiming({
					durationInFrames: TRANS,
					config: { damping: 13, stiffness: 85 },
				})}
				presentation={slideUp()}
			/>

			{/* 04 — Roles */}
			<TransitionSeries.Sequence durationInFrames={DUR.roles}>
				<RolesScene />
			</TransitionSeries.Sequence>

			{/* 04→05 : curtain gauche — direction inverse, dynamisme */}
			<TransitionSeries.Transition
				timing={linearTiming({ durationInFrames: TRANS })}
				presentation={curtainSlide("left")}
			/>

			{/* 05 — Workflow */}
			<TransitionSeries.Sequence durationInFrames={DUR.workflow}>
				<GradeWorkflowScene />
			</TransitionSeries.Sequence>

			{/* 05→06 : zoom blur — plonge dans les captures produit */}
			<TransitionSeries.Transition
				timing={springTiming({
					durationInFrames: TRANS,
					config: { damping: 12, stiffness: 68 },
				})}
				presentation={zoomBlur()}
			/>

			{/* 06 — Screenshots */}
			<TransitionSeries.Sequence durationInFrames={DUR.screenshots}>
				<ScreenshotsScene />
			</TransitionSeries.Sequence>

			{/* 06→07 : scale reveal — calme vers les résultats */}
			<TransitionSeries.Transition
				timing={springTiming({
					durationInFrames: TRANS,
					config: { damping: 16, stiffness: 90 },
				})}
				presentation={scaleReveal()}
			/>

			{/* 07 — Deliberation */}
			<TransitionSeries.Sequence durationInFrames={DUR.deliberation}>
				<DeliberationScene />
			</TransitionSeries.Sequence>

			{/* 07→08 : curtain droite — net et décisif */}
			<TransitionSeries.Transition
				timing={linearTiming({ durationInFrames: TRANS })}
				presentation={curtainSlide("right")}
			/>

			{/* 08 — TechStack */}
			<TransitionSeries.Sequence durationInFrames={DUR.techStack}>
				<TechStackScene />
			</TransitionSeries.Sequence>

			{/* 08→09 : scale reveal — fermeture apaisée vers l'outro */}
			<TransitionSeries.Transition
				timing={springTiming({
					durationInFrames: TRANS,
					config: { damping: 18, stiffness: 95 },
				})}
				presentation={scaleReveal()}
			/>

			{/* 09 — Outro */}
			<TransitionSeries.Sequence durationInFrames={DUR.outro}>
				<OutroScene />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	</>
);

// ─────────────────────────────────────────────────────────────────────────────
// Enregistrement des compositions
// ─────────────────────────────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => (
	<>
		{/* Vidéo complète */}
		<Composition
			id="GradesManagerPresentation"
			component={GradesManagerPresentation}
			durationInFrames={TOTAL}
			fps={fps}
			width={width}
			height={height}
		/>

		{/* Scènes individuelles — calculateMetadata adapte la durée au voiceover réel */}
		<Composition
			id="00-Intro"
			component={IntroScene}
			durationInFrames={DUR.intro}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={introMeta}
		/>
		<Composition
			id="01-Hero"
			component={HeroScene}
			durationInFrames={DUR.hero}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={heroMeta}
		/>
		<Composition
			id="02-Problem"
			component={ProblemScene}
			durationInFrames={DUR.problem}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={problemMeta}
		/>
		<Composition
			id="03-Solution"
			component={SolutionScene}
			durationInFrames={DUR.solution}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={solutionMeta}
		/>
		<Composition
			id="04-Roles"
			component={RolesScene}
			durationInFrames={DUR.roles}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={rolesMeta}
		/>
		<Composition
			id="05-GradeWorkflow"
			component={GradeWorkflowScene}
			durationInFrames={DUR.workflow}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={workflowMeta}
		/>
		<Composition
			id="06-Screenshots"
			component={ScreenshotsScene}
			durationInFrames={DUR.screenshots}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={screenshotsMeta}
		/>
		<Composition
			id="07-Deliberation"
			component={DeliberationScene}
			durationInFrames={DUR.deliberation}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={deliberationMeta}
		/>
		<Composition
			id="08-TechStack"
			component={TechStackScene}
			durationInFrames={DUR.techStack}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={techStackMeta}
		/>
		<Composition
			id="09-Outro"
			component={OutroScene}
			durationInFrames={DUR.outro}
			fps={fps}
			width={width}
			height={height}
			calculateMetadata={outroMeta}
		/>
	</>
);
