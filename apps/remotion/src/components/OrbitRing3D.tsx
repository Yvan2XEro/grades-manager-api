/**
 * OrbitRing3D — Anneau en orbite incliné, simulé en SVG par une ellipse.
 * ry/rx < 1 → anneau vu en perspective (aplati). Rotation axiale via transform.
 */
import type React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../lib/theme";

interface Props {
	cx?: number;
	cy?: number;
	rx?: number;
	/** Rapport d'aplatissement (0 = segment, 1 = cercle). < 0.35 = très incliné */
	flatness?: number;
	/** Rotation du plan de l'anneau en degrés (0 = horizontal, 90 = vertical) */
	tiltDeg?: number;
	color?: string;
	opacity?: number;
	strokeWidth?: number;
	/** Nombre de points satellites en orbite */
	dots?: number;
	/** Vitesse de rotation (frames par tour) */
	period?: number;
	/** Phase initiale en radians */
	phase?: number;
	/** Désactiver le mouvement (statique) */
	static?: boolean;
}

export const OrbitRing3D: React.FC<Props> = ({
	cx = 960,
	cy = 540,
	rx = 300,
	flatness = 0.28,
	tiltDeg = 0,
	color = C.primary,
	opacity = 0.5,
	strokeWidth = 1.5,
	dots = 1,
	period = 150,
	phase = 0,
	static: isStatic = false,
}) => {
	const frame = useCurrentFrame();
	const ry = rx * flatness;

	const dotAngle = isStatic
		? phase
		: ((frame + phase * (period / (2 * Math.PI))) / period) * Math.PI * 2;

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
			{/* Anneau incliné */}
			<g transform={`rotate(${tiltDeg}, ${cx}, ${cy})`}>
				{/* Ombre/traîne */}
				<ellipse
					cx={cx}
					cy={cy}
					rx={rx}
					ry={ry}
					fill="none"
					stroke={color}
					strokeWidth={strokeWidth + 6}
					opacity={opacity * 0.06}
				/>
				{/* Anneau principal */}
				<ellipse
					cx={cx}
					cy={cy}
					rx={rx}
					ry={ry}
					fill="none"
					stroke={color}
					strokeWidth={strokeWidth}
					opacity={opacity}
				/>

				{/* Points satellites */}
				{Array.from({ length: dots }).map((_, i) => {
					const a = dotAngle + (i / dots) * Math.PI * 2;
					const dx = cx + rx * Math.cos(a);
					const dy = cy + ry * Math.sin(a);
					return (
						<g key={i}>
							{/* Traîne lumineuse */}
							<circle cx={dx} cy={dy} r={10} fill={color} opacity={0.12} />
							{/* Point */}
							<circle cx={dx} cy={dy} r={4} fill={color} opacity={0.95} />
							{/* Halo */}
							<circle
								cx={dx}
								cy={dy}
								r={7}
								fill="none"
								stroke={color}
								strokeWidth={1}
								opacity={0.4}
							/>
						</g>
					);
				})}
			</g>
		</svg>
	);
};
