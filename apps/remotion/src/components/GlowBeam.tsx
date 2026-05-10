/**
 * GlowBeam — Faisceau lumineux qui parcourt un chemin horizontal.
 * progress (0→1) contrôle la tête du faisceau.
 */
import type React from "react";
import { C } from "../lib/theme";

interface Props {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	progress: number; // 0–1
	color?: string;
	width?: number;
	trailRatio?: number; // longueur de la traîne (en % de la longueur totale)
}

export const GlowBeam: React.FC<Props> = ({
	x1,
	y1,
	x2,
	y2,
	progress,
	color = C.primary,
	width = 3,
	trailRatio = 0.25,
}) => {
	const headX = x1 + (x2 - x1) * progress;
	const headY = y1 + (y2 - y1) * progress;

	const trailStart = Math.max(0, progress - trailRatio);
	const trailX1 = x1 + (x2 - x1) * trailStart;
	const trailY1 = y1 + (y2 - y1) * trailStart;

	// ID unique basé sur la position pour éviter les conflits SVG
	const uid = `gb_${Math.round(x1)}_${Math.round(y1)}`;

	return (
		<svg
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				overflow: "visible",
			}}
			viewBox="0 0 1920 1080"
		>
			<defs>
				<linearGradient
					id={uid}
					gradientUnits="userSpaceOnUse"
					x1={trailX1}
					y1={trailY1}
					x2={headX}
					y2={headY}
				>
					<stop offset="0%" stopColor={color} stopOpacity="0" />
					<stop offset="70%" stopColor={color} stopOpacity="0.6" />
					<stop offset="100%" stopColor={color} stopOpacity="1" />
				</linearGradient>
			</defs>

			{/* Ligne de fond (chemin complet, grisé) */}
			<line
				x1={x1}
				y1={y1}
				x2={x2}
				y2={y2}
				stroke={color}
				strokeWidth={1}
				opacity={0.15}
			/>

			{/* Traîne lumineuse */}
			{progress > 0 && (
				<line
					x1={trailX1}
					y1={trailY1}
					x2={headX}
					y2={headY}
					stroke={`url(#${uid})`}
					strokeWidth={width}
					strokeLinecap="round"
				/>
			)}

			{/* Tête : glow concentré */}
			{progress > 0 && (
				<>
					<circle
						cx={headX}
						cy={headY}
						r={width * 4}
						fill={color}
						opacity={0.25}
					/>
					<circle
						cx={headX}
						cy={headY}
						r={width * 8}
						fill={color}
						opacity={0.08}
					/>
					<circle
						cx={headX}
						cy={headY}
						r={width * 1.5}
						fill={color}
						opacity={1}
					/>
				</>
			)}
		</svg>
	);
};
