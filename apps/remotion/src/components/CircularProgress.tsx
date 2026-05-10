/**
 * CircularProgress — Arc SVG animé via strokeDashoffset.
 * À utiliser dans un <svg> parent ou autonome.
 */
import type React from "react";
import { C } from "../lib/theme";

interface Props {
	/** Centre en px (absolu dans le repère parent) */
	cx: number;
	cy: number;
	r: number;
	/** Progression 0–1 */
	progress: number;
	color?: string;
	trackColor?: string;
	strokeWidth?: number;
	/** Si true, rend un <svg> autonome positionné en absolu */
	standalone?: boolean;
}

export const CircularProgress: React.FC<Props> = ({
	cx,
	cy,
	r,
	progress,
	color = C.primary,
	trackColor = "#E8E4DF",
	strokeWidth = 8,
	standalone = false,
}) => {
	const circ = 2 * Math.PI * r;
	const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

	const inner = (
		<g>
			{/* Piste */}
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke={trackColor}
				strokeWidth={strokeWidth}
			/>
			{/* Arc de progression */}
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke={color}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeDasharray={circ}
				strokeDashoffset={offset}
				transform={`rotate(-90, ${cx}, ${cy})`}
				style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
			/>
		</g>
	);

	if (!standalone) return inner;

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
		>
			{inner}
		</svg>
	);
};
