/**
 * Grille de points subtile — adaptée au thème clair
 */
import type React from "react";
import { C } from "../lib/theme";

interface DotGridProps {
	opacity?: number;
	size?: number;
	dotSize?: number;
	color?: string;
}

export const DotGrid: React.FC<DotGridProps> = ({
	opacity = 1,
	size = 28,
	dotSize = 1.5,
	color = C.primary,
}) => (
	<svg
		style={{
			position: "absolute",
			inset: 0,
			width: "100%",
			height: "100%",
			opacity,
			pointerEvents: "none",
		}}
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<pattern
				id="dots"
				x="0"
				y="0"
				width={size}
				height={size}
				patternUnits="userSpaceOnUse"
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={dotSize}
					fill={color}
					fillOpacity="0.10"
				/>
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#dots)" />
	</svg>
);
