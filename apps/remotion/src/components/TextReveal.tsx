/**
 * TextReveal — Texte qui monte depuis l'invisible (overflow:hidden mask).
 * Technique utilisée dans les présentations Linear / Apple / Vercel.
 * Wrapper simple : met le contenu dans un overflow:hidden et l'anime en Y.
 */
import type React from "react";
import {
	interpolate,
	measureSpring,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

interface Props {
	children: React.ReactNode;
	delay?: number;
	/** Distance de départ en % de la hauteur du conteneur */
	fromPercent?: number;
	stiffness?: number;
	damping?: number;
	style?: React.CSSProperties;
	containerStyle?: React.CSSProperties;
}

export const TextReveal: React.FC<Props> = ({
	children,
	delay = 0,
	fromPercent = 110,
	stiffness = 130,
	damping = 22,
	style,
	containerStyle,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const springConfig = { damping, stiffness, mass: 0.9 };
	// measureSpring calcule la durée exacte du ressort — plus précis que durationInFrames: 50 en dur
	const springDuration = measureSpring({
		fps,
		config: springConfig,
		threshold: 0.005,
	});

	const prog = spring({
		frame: frame - delay,
		fps,
		config: springConfig,
		durationInFrames: springDuration,
	});

	const y = interpolate(prog, [0, 1], [fromPercent, 0]);

	return (
		<div style={{ overflow: "hidden", display: "block", ...containerStyle }}>
			<div style={{ transform: `translateY(${y}%)`, ...style }}>{children}</div>
		</div>
	);
};
