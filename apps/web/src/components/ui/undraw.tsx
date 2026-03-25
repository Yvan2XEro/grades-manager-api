/**
 * Inline undraw-style SVG illustrations for empty states.
 * Colors use CSS custom properties so they adapt to light/dark mode.
 */

interface IllustrationProps {
	className?: string;
	primaryColor?: string;
}

export function UndrawCalendar({
	className = "h-40 w-auto",
}: IllustrationProps) {
	return (
		<svg
			viewBox="0 0 400 300"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Background card */}
			<rect
				x="60"
				y="30"
				width="280"
				height="230"
				rx="16"
				fill="oklch(0.97 0.002 264)"
			/>
			{/* Header bar */}
			<rect
				x="60"
				y="30"
				width="280"
				height="60"
				rx="16"
				fill="oklch(0.48 0.2 277)"
			/>
			<rect x="60" y="70" width="280" height="20" fill="oklch(0.48 0.2 277)" />
			{/* Calendar icon circles */}
			<circle cx="110" cy="30" r="12" fill="oklch(0.38 0.18 277)" />
			<circle cx="290" cy="30" r="12" fill="oklch(0.38 0.18 277)" />
			<rect x="107" y="18" width="6" height="24" rx="3" fill="white" />
			<rect x="287" y="18" width="6" height="24" rx="3" fill="white" />
			{/* Month label */}
			<rect
				x="140"
				y="42"
				width="120"
				height="12"
				rx="6"
				fill="white"
				opacity="0.9"
			/>
			{/* Grid lines */}
			{[0, 1, 2, 3, 4, 5, 6].map((i) => (
				<rect
					key={`v${i}`}
					x={80 + i * 37}
					y="100"
					width="1"
					height="140"
					fill="oklch(0.91 0.004 264)"
				/>
			))}
			{[0, 1, 2, 3, 4].map((i) => (
				<rect
					key={`h${i}`}
					x="80"
					y={110 + i * 28}
					width="240"
					height="1"
					fill="oklch(0.91 0.004 264)"
				/>
			))}
			{/* Day abbreviations */}
			{[0, 1, 2, 3, 4, 5, 6].map((i) => (
				<rect
					key={`d${i}`}
					x={85 + i * 37}
					y="95"
					width="24"
					height="8"
					rx="4"
					fill="oklch(0.7 0.01 264)"
				/>
			))}
			{/* Day cells - some highlighted */}
			<rect
				x="228"
				y="115"
				width="28"
				height="22"
				rx="6"
				fill="oklch(0.48 0.2 277)"
			/>
			<rect
				x="265"
				y="115"
				width="28"
				height="22"
				rx="6"
				fill="oklch(0.95 0.006 277)"
			/>
			<rect
				x="154"
				y="143"
				width="28"
				height="22"
				rx="6"
				fill="oklch(0.95 0.006 277)"
			/>
			{/* Regular day dots */}
			{[
				[85, 115],
				[122, 115],
				[159, 115],
				[196, 115],
				[85, 143],
				[122, 143],
				[196, 143],
				[233, 143],
				[270, 143],
				[85, 171],
				[122, 171],
				[159, 171],
				[196, 171],
				[233, 171],
			].map(([x, y], i) => (
				<rect
					key={i}
					x={x}
					y={y}
					width="28"
					height="22"
					rx="6"
					fill="oklch(1 0 0)"
					opacity="0.5"
				/>
			))}
			{/* Star decoration */}
			<circle cx="340" cy="60" r="18" fill="oklch(0.95 0.006 277)" />
			<text x="340" y="65" textAnchor="middle" fontSize="16">
				✦
			</text>
		</svg>
	);
}

export function UndrawEmpty({ className = "h-40 w-auto" }: IllustrationProps) {
	return (
		<svg
			viewBox="0 0 400 280"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Box */}
			<rect
				x="120"
				y="120"
				width="160"
				height="120"
				rx="8"
				fill="oklch(0.97 0.002 264)"
				stroke="oklch(0.91 0.004 264)"
				strokeWidth="2"
			/>
			{/* Box flaps */}
			<path
				d="M120 120 L200 150 L280 120"
				stroke="oklch(0.91 0.004 264)"
				strokeWidth="2"
				fill="none"
			/>
			<path
				d="M150 120 L150 90 L250 90 L250 120"
				fill="oklch(0.95 0.006 277)"
				stroke="oklch(0.91 0.004 264)"
				strokeWidth="2"
			/>
			<path
				d="M170 90 L200 105 L230 90"
				fill="oklch(0.48 0.2 277 / 20%)"
				stroke="oklch(0.91 0.004 264)"
				strokeWidth="1.5"
			/>
			{/* Dotted lines on box */}
			<line
				x1="120"
				y1="160"
				x2="280"
				y2="160"
				stroke="oklch(0.91 0.004 264)"
				strokeWidth="1.5"
				strokeDasharray="6 4"
			/>
			{/* Shadow */}
			<ellipse cx="200" cy="250" rx="80" ry="10" fill="oklch(0 0 0 / 6%)" />
			{/* Stars */}
			<circle cx="100" cy="80" r="5" fill="oklch(0.48 0.2 277 / 40%)" />
			<circle cx="310" cy="100" r="4" fill="oklch(0.58 0.17 149 / 40%)" />
			<circle cx="320" cy="60" r="6" fill="oklch(0.48 0.2 277 / 30%)" />
			<circle cx="80" cy="140" r="4" fill="oklch(0.72 0.16 86 / 40%)" />
		</svg>
	);
}

export function UndrawStudents({
	className = "h-40 w-auto",
}: IllustrationProps) {
	return (
		<svg
			viewBox="0 0 400 280"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Person 1 */}
			<circle cx="150" cy="90" r="30" fill="oklch(0.95 0.006 277)" />
			<circle cx="150" cy="78" r="16" fill="oklch(0.48 0.2 277)" />
			<path
				d="M110 170 Q150 145 190 170 L190 220 Q150 230 110 220Z"
				fill="oklch(0.48 0.2 277)"
			/>
			{/* Person 2 */}
			<circle cx="250" cy="90" r="30" fill="oklch(0.95 0.006 277)" />
			<circle cx="250" cy="78" r="16" fill="oklch(0.58 0.17 149)" />
			<path
				d="M210 170 Q250 145 290 170 L290 220 Q250 230 210 220Z"
				fill="oklch(0.58 0.17 149)"
			/>
			{/* Books */}
			<rect
				x="130"
				y="195"
				width="40"
				height="8"
				rx="2"
				fill="oklch(0.48 0.2 277 / 70%)"
			/>
			<rect
				x="133"
				y="188"
				width="34"
				height="8"
				rx="2"
				fill="oklch(0.65 0.17 254 / 80%)"
			/>
			<rect
				x="230"
				y="195"
				width="40"
				height="8"
				rx="2"
				fill="oklch(0.58 0.17 149 / 70%)"
			/>
			<rect
				x="233"
				y="188"
				width="34"
				height="8"
				rx="2"
				fill="oklch(0.72 0.16 86 / 80%)"
			/>
			{/* Stars */}
			<circle cx="200" cy="50" r="6" fill="oklch(0.72 0.16 86 / 60%)" />
			<circle cx="80" cy="120" r="5" fill="oklch(0.48 0.2 277 / 30%)" />
			<circle cx="330" cy="80" r="4" fill="oklch(0.58 0.17 149 / 40%)" />
		</svg>
	);
}

export function UndrawGrades({ className = "h-40 w-auto" }: IllustrationProps) {
	return (
		<svg
			viewBox="0 0 400 280"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Document */}
			<rect
				x="100"
				y="40"
				width="200"
				height="220"
				rx="12"
				fill="oklch(1 0 0)"
				stroke="oklch(0.91 0.004 264)"
				strokeWidth="2"
			/>
			<rect
				x="100"
				y="40"
				width="200"
				height="50"
				rx="12"
				fill="oklch(0.48 0.2 277)"
			/>
			<rect x="100" y="70" width="200" height="20" fill="oklch(0.48 0.2 277)" />
			{/* Title line */}
			<rect
				x="130"
				y="52"
				width="140"
				height="10"
				rx="5"
				fill="white"
				opacity="0.8"
			/>
			{/* Grade rows */}
			{[0, 1, 2, 3, 4].map((i) => (
				<g key={i}>
					<rect
						x="120"
						y={112 + i * 26}
						width="100"
						height="8"
						rx="4"
						fill="oklch(0.91 0.004 264)"
					/>
					<rect
						x="240"
						y={110 + i * 26}
						width="36"
						height="12"
						rx="6"
						fill={
							i === 0
								? "oklch(0.58 0.17 149)"
								: i === 2
									? "oklch(0.55 0.22 27)"
									: "oklch(0.95 0.006 277)"
						}
					/>
				</g>
			))}
			{/* Checkmark badge */}
			<circle cx="280" cy="55" r="20" fill="oklch(0.58 0.17 149)" />
			<path
				d="M271 55 L277 62 L290 48"
				stroke="white"
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="none"
			/>
		</svg>
	);
}

export function UndrawSearch({ className = "h-40 w-auto" }: IllustrationProps) {
	return (
		<svg
			viewBox="0 0 400 280"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Magnifying glass */}
			<circle
				cx="175"
				cy="130"
				r="70"
				fill="oklch(0.97 0.002 264)"
				stroke="oklch(0.48 0.2 277)"
				strokeWidth="10"
			/>
			<line
				x1="225"
				y1="180"
				x2="290"
				y2="245"
				stroke="oklch(0.48 0.2 277)"
				strokeWidth="14"
				strokeLinecap="round"
			/>
			{/* Question marks inside */}
			<circle cx="175" cy="115" r="18" fill="oklch(0.95 0.006 277)" />
			<text
				x="175"
				y="121"
				textAnchor="middle"
				fontSize="20"
				fill="oklch(0.48 0.2 277)"
				fontWeight="700"
			>
				?
			</text>
			<rect
				x="155"
				y="140"
				width="40"
				height="8"
				rx="4"
				fill="oklch(0.91 0.004 264)"
			/>
			{/* Stars */}
			<circle cx="90" cy="80" r="6" fill="oklch(0.72 0.16 86 / 50%)" />
			<circle cx="310" cy="100" r="5" fill="oklch(0.48 0.2 277 / 30%)" />
			<circle cx="80" cy="200" r="4" fill="oklch(0.58 0.17 149 / 40%)" />
		</svg>
	);
}
