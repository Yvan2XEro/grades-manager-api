/**
 * Transitions personnalisées — Neo-Brutalisme + Motion Design
 * Utilisées dans Root.tsx via TransitionSeries de @remotion/transitions
 */

import type {
	TransitionPresentation,
	TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";

// ─── 1. Zoom + Blur ────────────────────────────────────────────────────────────
// Transition principale (01→02) : la scène sortante explose vers l'avant,
// la scène entrante surgit du centre — effet "plongée dans l'écran"
const ZoomBlurComponent: React.FC<
	TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress }) => {
	const isEntering = presentationDirection === "entering";

	const scale = isEntering
		? interpolate(presentationProgress, [0, 1], [1.18, 1], {
				extrapolateRight: "clamp",
			})
		: interpolate(presentationProgress, [0, 1], [1, 1.22], {
				extrapolateRight: "clamp",
			});

	const blur = isEntering
		? interpolate(presentationProgress, [0, 0.6, 1], [10, 2, 0], {
				extrapolateRight: "clamp",
			})
		: interpolate(presentationProgress, [0, 0.4, 1], [0, 3, 12], {
				extrapolateRight: "clamp",
			});

	const opacity = isEntering
		? interpolate(presentationProgress, [0, 0.35, 1], [0, 0.7, 1], {
				extrapolateRight: "clamp",
			})
		: interpolate(presentationProgress, [0.55, 1], [1, 0], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			});

	return (
		<AbsoluteFill
			style={{
				transform: `scale(${scale})`,
				filter: `blur(${blur}px)`,
				opacity,
				transformOrigin: "center center",
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const zoomBlur = (): TransitionPresentation<Record<string, never>> => ({
	component: ZoomBlurComponent,
	props: {},
});

// ─── 2. Curtain Slide ──────────────────────────────────────────────────────────
// Rideau dur de côté — tranchant, brutaliste
type CurtainProps = { direction: "left" | "right" };

const CurtainComponent: React.FC<
	TransitionPresentationComponentProps<CurtainProps>
> = ({
	children,
	presentationDirection,
	presentationProgress,
	passedProps,
}) => {
	const isEntering = presentationDirection === "entering";
	const dir = passedProps.direction;

	let clipPath: string;
	if (isEntering) {
		const pct = interpolate(presentationProgress, [0, 1], [0, 100], {
			extrapolateRight: "clamp",
		});
		clipPath =
			dir === "right"
				? `inset(0 ${100 - pct}% 0 0 round 0px)`
				: `inset(0 0 0 ${100 - pct}% round 0px)`;
	} else {
		const pct = interpolate(presentationProgress, [0, 1], [0, 100], {
			extrapolateRight: "clamp",
		});
		clipPath =
			dir === "right"
				? `inset(0 0 0 ${pct}% round 0px)`
				: `inset(0 ${pct}% 0 0 round 0px)`;
	}

	return <AbsoluteFill style={{ clipPath }}>{children}</AbsoluteFill>;
};

export const curtainSlide = (
	direction: "left" | "right" = "right",
): TransitionPresentation<CurtainProps> => ({
	component: CurtainComponent,
	props: { direction },
});

// ─── 3. Scale Reveal ───────────────────────────────────────────────────────────
// Scène sortante rétrécit, scène entrante grandit depuis le centre
// Idéale pour les transitions calmes (intro, outro, sections informatives)
const ScaleRevealComponent: React.FC<
	TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress }) => {
	const isEntering = presentationDirection === "entering";

	const scale = isEntering
		? interpolate(presentationProgress, [0, 1], [0.88, 1], {
				extrapolateRight: "clamp",
			})
		: interpolate(presentationProgress, [0, 1], [1, 1.06], {
				extrapolateRight: "clamp",
			});

	const opacity = isEntering
		? interpolate(presentationProgress, [0, 0.45, 1], [0, 0.85, 1], {
				extrapolateRight: "clamp",
			})
		: interpolate(presentationProgress, [0.5, 1], [1, 0], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			});

	return (
		<AbsoluteFill
			style={{
				transform: `scale(${scale})`,
				opacity,
				transformOrigin: "center center",
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const scaleReveal = (): TransitionPresentation<
	Record<string, never>
> => ({
	component: ScaleRevealComponent,
	props: {},
});

// ─── 4. Slide Up ───────────────────────────────────────────────────────────────
// La scène entrante monte depuis le bas — énergique, dynamique
// Parfaite après les sections à contenu dense
const SlideUpComponent: React.FC<
	TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress }) => {
	const isEntering = presentationDirection === "entering";

	const translateY = isEntering
		? interpolate(presentationProgress, [0, 1], [120, 0], {
				extrapolateRight: "clamp",
			})
		: interpolate(presentationProgress, [0, 1], [0, -80], {
				extrapolateRight: "clamp",
			});

	const opacity = isEntering
		? interpolate(presentationProgress, [0, 0.4, 1], [0, 1, 1], {
				extrapolateRight: "clamp",
			})
		: interpolate(presentationProgress, [0.6, 1], [1, 0], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			});

	return (
		<AbsoluteFill
			style={{
				transform: `translateY(${translateY}px)`,
				opacity,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const slideUp = (): TransitionPresentation<Record<string, never>> => ({
	component: SlideUpComponent,
	props: {},
});
