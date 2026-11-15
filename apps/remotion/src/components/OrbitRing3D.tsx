/**
 * OrbitRing3D — Tilted orbiting ring, simulated in SVG with an ellipse.
 * ry/rx < 1 → ring seen in perspective (flattened). Axial rotation via transform.
 */
import type React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../lib/theme";

interface Props {
	cx?: number;
	cy?: number;
	rx?: number;
	/** Flattening ratio (0 = segment, 1 = circle). < 0.35 = steeply tilted */
	flatness?: number;
	/** Rotation of the ring's plane in degrees (0 = horizontal, 90 = vertical) */
	tiltDeg?: number;
	color?: string;
	opacity?: number;
	strokeWidth?: number;
	/** Number of satellite dots in orbit */
	dots?: number;
	/** Rotation speed (frames per revolution) */
	period?: number;
	/** Initial phase in radians */
	phase?: number;
	/** Disable motion (static) */
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
			{/* Tilted ring */}
			<g transform={`rotate(${tiltDeg}, ${cx}, ${cy})`}>
				{/* Shadow/trail */}
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
				{/* Main ring */}
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

				{/* Satellite dots */}
				{Array.from({ length: dots }).map((_, i) => {
					const a = dotAngle + (i / dots) * Math.PI * 2;
					const dx = cx + rx * Math.cos(a);
					const dy = cy + ry * Math.sin(a);
					return (
						<g key={i}>
							{/* Glowing trail */}
							<circle cx={dx} cy={dy} r={10} fill={color} opacity={0.12} />
							{/* Dot */}
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
