/**
 * CircularProgress — SVG arc animated via strokeDashoffset.
 * Use inside a parent <svg> or standalone.
 */
import type React from "react";
import { C } from "../lib/theme";

interface Props {
	/** Center in px (absolute in the parent coordinate space) */
	cx: number;
	cy: number;
	r: number;
	/** Progress 0–1 */
	progress: number;
	color?: string;
	trackColor?: string;
	strokeWidth?: number;
	/** If true, renders a standalone absolutely positioned <svg> */
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
			{/* Track */}
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke={trackColor}
				strokeWidth={strokeWidth}
			/>
			{/* Progress arc */}
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
