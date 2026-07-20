/**
 * PerspectiveGrid — Grille SVG avec point de fuite central.
 * Crée l'effet "sol 3D" des présentations Linear / Vercel.
 */
import type React from "react";
import { C } from "../lib/theme";

interface Props {
	opacity?: number;
	color?: string;
	/** Y du point de fuite (0–1080). Défaut = 520, correspond à ~48 % de la hauteur */
	vanishY?: number;
	cols?: number;
	rows?: number;
}

export const PerspectiveGrid: React.FC<Props> = ({
	opacity = 1,
	color = C.primary,
	vanishY = 520,
	cols = 14,
	rows = 9,
}) => {
	const W = 1920;
	const H = 1080;
	const VX = W / 2;

	// Lignes verticales : du point de fuite vers le bas
	const vLines = Array.from({ length: cols + 1 }, (_, i) => {
		const bx = (i / cols) * W;
		return { x1: VX, y1: vanishY, x2: bx, y2: H };
	});

	// Lignes horizontales : espacement exponentiel (rapproché près du VP)
	const hLines = Array.from({ length: rows }, (_, i) => {
		const t = ((i + 1) / rows) ** 1.8;
		const y = vanishY + t * (H - vanishY);
		// Calcul de la largeur à cette profondeur (perspective linéaire)
		const tt = (y - vanishY) / (H - vanishY);
		return { y, xMin: VX - tt * VX, xMax: VX + tt * (W - VX) };
	});

	return (
		<svg
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				opacity,
			}}
			viewBox={`0 0 ${W} ${H}`}
			preserveAspectRatio="xMidYMid slice"
		>
			<defs>
				{/* Masque : la grille s'efface vers le haut (horizon) */}
				<linearGradient
					id="pgMaskGrad"
					x1="0"
					y1="0"
					x2="0"
					y2="1"
					gradientUnits="objectBoundingBox"
				>
					<stop offset="0%" stopColor="white" stopOpacity="0" />
					<stop offset="30%" stopColor="white" stopOpacity="0.6" />
					<stop offset="100%" stopColor="white" stopOpacity="0.15" />
				</linearGradient>
				<mask id="pgMask">
					<rect
						x="0"
						y={vanishY}
						width={W}
						height={H - vanishY}
						fill="url(#pgMaskGrad)"
					/>
				</mask>
			</defs>

			<g mask="url(#pgMask)">
				{/* Lignes radiantes (verticales en perspective) */}
				{vLines.map(({ x1, y1, x2, y2 }, i) => (
					<line
						key={`v${i}`}
						x1={x1}
						y1={y1}
						x2={x2}
						y2={y2}
						stroke={color}
						strokeWidth={0.6}
						opacity={0.3}
					/>
				))}

				{/* Lignes horizontales */}
				{hLines.map(({ y, xMin, xMax }, i) => (
					<line
						key={`h${i}`}
						x1={xMin}
						y1={y}
						x2={xMax}
						y2={y}
						stroke={color}
						strokeWidth={0.6}
						opacity={0.22 + (i / rows) * 0.08}
					/>
				))}

				{/* Point de fuite — glow subtil */}
				<circle cx={VX} cy={vanishY} r={60} fill={color} opacity={0.04} />
				<circle cx={VX} cy={vanishY} r={20} fill={color} opacity={0.06} />
			</g>
		</svg>
	);
};
