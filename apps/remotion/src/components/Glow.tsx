/**
 * Halo de lumière douce — adapté au fond clair
 */
import type React from "react";
import { C } from "../lib/theme";

interface GlowProps {
	x?: string;
	y?: string;
	size?: number;
	color?: string;
	opacity?: number;
}

export const Glow: React.FC<GlowProps> = ({
	x = "50%",
	y = "50%",
	size = 600,
	color = C.primary,
	opacity = 0.12,
}) => (
	<div
		style={{
			position: "absolute",
			left: x,
			top: y,
			width: size,
			height: size,
			borderRadius: "50%",
			background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
			opacity,
			transform: "translate(-50%, -50%)",
			pointerEvents: "none",
			filter: "blur(80px)",
		}}
	/>
);
