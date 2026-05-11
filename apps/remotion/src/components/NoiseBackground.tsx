/**
 * NoiseBackground — Blobs de lumière organique animés par noise2D.
 * Mouvement déterministe, fluide, cinématique — sans pattern périodique.
 */

import { noise2D } from "@remotion/noise";
import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
	color?: string;
	opacity?: number;
	speed?: number;
	count?: number;
}

export const NoiseBackground: React.FC<Props> = ({
	color = "#5B4AD4",
	opacity = 0.04,
	speed = 0.0015,
	count = 4,
}) => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();
	const t = frame * speed;

	return (
		<AbsoluteFill style={{ pointerEvents: "none" }}>
			<svg
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
				}}
				viewBox={`0 0 ${width} ${height}`}
				preserveAspectRatio="xMidYMid slice"
			>
				<defs>
					<filter id="nb-blur" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="90" />
					</filter>
				</defs>
				<g filter="url(#nb-blur)">
					{Array.from({ length: count }, (_, i) => {
						const nx = noise2D(`blob-x-${i}`, t, i * 13.7);
						const ny = noise2D(`blob-y-${i}`, i * 9.3, t);
						const ns = noise2D(`blob-s-${i}`, t + i, i * 5.1);
						const cx = (nx * 0.5 + 0.5) * width;
						const cy = (ny * 0.5 + 0.5) * height;
						const r = 200 + ns * 90;
						return (
							<circle
								key={i}
								cx={cx}
								cy={cy}
								r={Math.max(120, r)}
								fill={color}
								opacity={opacity}
							/>
						);
					})}
				</g>
			</svg>
		</AbsoluteFill>
	);
};
