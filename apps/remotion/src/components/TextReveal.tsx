/**
 * TextReveal — Text rising out of invisibility (overflow:hidden mask).
 * Technique used in Linear / Apple / Vercel presentations.
 * Simple wrapper: puts the content in an overflow:hidden box and animates it on Y.
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
	/** Starting offset as % of the container height */
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
	// measureSpring computes the exact spring duration — more precise than a hard-coded durationInFrames: 50
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
