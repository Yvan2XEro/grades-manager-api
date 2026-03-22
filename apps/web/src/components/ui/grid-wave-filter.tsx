/**
 * Hidden SVG that defines the animated grid-wave displacement filter.
 * Must be rendered in the DOM before any element uses filter: url(#grid-wave).
 */
export function GridWaveFilter() {
	return (
		<svg
			width="0"
			height="0"
			className="pointer-events-none absolute overflow-hidden"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<filter
					id="grid-wave"
					x="-8%"
					y="-8%"
					width="116%"
					height="116%"
					colorInterpolationFilters="linearRGB"
				>
					{/* Turbulence lente — génère le champ de déplacement */}
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.013 0.022"
						numOctaves="2"
						seed="5"
						result="noise"
					>
						{/* Animation : la fréquence ondule lentement → vagues organiques */}
						<animate
							attributeName="baseFrequency"
							values="0.010 0.018;0.016 0.030;0.013 0.024;0.010 0.018"
							dur="16s"
							repeatCount="indefinite"
							calcMode="spline"
							keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
						/>
					</feTurbulence>
					{/* Déplacement : max ±3 px sur une grille de 10 px = ondulation subtile */}
					<feDisplacementMap
						in="SourceGraphic"
						in2="noise"
						scale="3"
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
			</defs>
		</svg>
	);
}
