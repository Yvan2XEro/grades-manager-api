/**
 * AnimatedRings — Anneaux SVG qui s'expansent en boucle depuis un point central.
 * Crée un effet de sonar / pulse cinématique.
 */
import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../lib/theme";

interface Props {
	cx?: number;
	cy?: number;
	color?: string;
	count?: number;
	maxRadius?: number;
	cycleFrames?: number;
	strokeWidth?: number;
}

export const AnimatedRings: React.FC<Props> = ({
	cx = 960,
	cy = 540,
	color = C.primary,
	count = 5,
	maxRadius = 560,
	cycleFrames = 90,
	strokeWidth = 1.5,
}) => {
	const frame = useCurrentFrame();

	return (
		<svg
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
			}}
			viewBox="0 0 1920 1080"
			preserveAspectRatio="xMidYMid slice"
		>
			{Array.from({ length: count }).map((_, i) => {
				const offset = (i / count) * cycleFrames;
				const t = ((frame + offset) % cycleFrames) / cycleFrames;
				const r = interpolate(t, [0, 1], [0, maxRadius]);
				const opacity = interpolate(t, [0, 0.12, 0.7, 1], [0, 0.4, 0.08, 0]);
				return (
					<circle
						key={i}
						cx={cx}
						cy={cy}
						r={r}
						fill="none"
						stroke={color}
						strokeWidth={strokeWidth}
						opacity={opacity}
					/>
				);
			})}
		</svg>
	);
};
