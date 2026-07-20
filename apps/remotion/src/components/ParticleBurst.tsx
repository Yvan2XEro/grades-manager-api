/**
 * ParticleBurst — Explosion de particules depuis un point central.
 * S'anime automatiquement depuis frame=delay.
 */
import type React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { C } from "../lib/theme";

interface Props {
	cx?: number;
	cy?: number;
	count?: number;
	maxRadius?: number;
	color?: string;
	delay?: number;
	/** Durée de l'animation en frames */
	duration?: number;
}

export const ParticleBurst: React.FC<Props> = ({
	cx = 960,
	cy = 540,
	count = 32,
	maxRadius = 420,
	color = C.primary,
	delay = 0,
	duration = 70,
}) => {
	const frame = useCurrentFrame();
	const t = Math.max(0, frame - delay);
	const prog = Math.min(1, t / duration);

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
			{Array.from({ length: count }).map((_, i) => {
				const angle = (i / count) * Math.PI * 2;
				// Vitesse et taille variables déterministes (random() = même résultat à chaque frame)
				const speedMul = 0.6 + random(`particle-speed-${i}`) * 0.4;
				const r = prog * maxRadius * speedMul;
				const opacity = interpolate(prog, [0, 0.25, 0.7, 1], [0, 0.8, 0.3, 0]);
				const size = 1.5 + random(`particle-size-${i}`) * 3.2;

				return (
					<circle
						key={i}
						cx={cx + Math.cos(angle) * r}
						cy={cy + Math.sin(angle) * r}
						r={size}
						fill={color}
						opacity={opacity}
					/>
				);
			})}
		</svg>
	);
};
