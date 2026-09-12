/**
 * Flags — drawn, not written.
 *
 * Flag emoji are not an option here: Windows ships no colour glyphs for
 * regional indicator pairs, so 🇫🇷 renders as the letters "FR" in a box on a
 * large share of this site's desktop audience. These are inline SVG instead —
 * crisp at any size, identical on every platform, no image request.
 *
 * Each flag is decorative: it sits beside a text label that already names the
 * language, so it carries `aria-hidden` and the accessible name comes from the
 * surrounding control. A flag is never the only indication of language — the
 * code (FR / EN) is always present too, because a flag names a country, not a
 * language, and the two are not the same thing.
 *
 * Drawn at a 4:3 ratio with a hairline border, so a white field (France's third
 * band) stays visible against a white menu.
 */

import { useId } from "react";

type FlagProps = {
	/** Rendered width in px; height follows the 4:3 ratio. */
	size?: number;
	className?: string;
};

/** France — vertical tricolour. */
export function FlagFR({ size = 18, className = "" }: FlagProps) {
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			width={size}
			height={(size * 3) / 4}
			viewBox="0 0 16 12"
			className={`shrink-0 ${className}`}
		>
			<rect width="16" height="12" rx="1.5" fill="#F5F5F5" />
			<path
				d="M0 1.5A1.5 1.5 0 011.5 0H6v12H1.5A1.5 1.5 0 010 10.5z"
				fill="#22357F"
			/>
			<path
				d="M10 0h4.5A1.5 1.5 0 0116 1.5v9a1.5 1.5 0 01-1.5 1.5H10z"
				fill="#C1272D"
			/>
			<rect
				x="0.4"
				y="0.4"
				width="15.2"
				height="11.2"
				rx="1.2"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.22"
				strokeWidth="0.8"
			/>
		</svg>
	);
}

/**
 * United Kingdom — Union Flag.
 *
 * Used for English because the language selector offers British/International
 * English. The saltires are clipped to the field so the diagonals stop at the
 * rounded corners instead of poking past them.
 */
export function FlagEN({ size = 18, className = "" }: FlagProps) {
	// The clip id must be unique per instance: the switcher renders this flag in
	// both the trigger and the menu, and two identical ids would make the second
	// clip resolve against the first element.
	const clipId = `tk-flag-en-${useId().replace(/:/g, "")}`;
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			width={size}
			height={(size * 3) / 4}
			viewBox="0 0 16 12"
			className={`shrink-0 ${className}`}
		>
			<defs>
				<clipPath id={clipId}>
					<rect width="16" height="12" rx="1.5" />
				</clipPath>
			</defs>
			<g clipPath={`url(#${clipId})`}>
				<rect width="16" height="12" fill="#22357F" />
				{/* White saltire */}
				<path d="M0 0l16 12M16 0L0 12" stroke="#F5F5F5" strokeWidth="2.6" />
				{/* Red saltire, thinner, offset into the white */}
				<path d="M0 0l16 12M16 0L0 12" stroke="#C1272D" strokeWidth="1.1" />
				{/* White cross */}
				<path d="M8 0v12M0 6h16" stroke="#F5F5F5" strokeWidth="4" />
				{/* Red cross */}
				<path d="M8 0v12M0 6h16" stroke="#C1272D" strokeWidth="2.2" />
			</g>
			<rect
				x="0.4"
				y="0.4"
				width="15.2"
				height="11.2"
				rx="1.2"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.22"
				strokeWidth="0.8"
			/>
		</svg>
	);
}

/** Flag for a locale code, so callers never branch on the locale themselves. */
export function LocaleFlag({
	locale,
	size = 18,
	className = "",
}: FlagProps & { locale: string }) {
	return locale === "en" ? (
		<FlagEN size={size} className={className} />
	) : (
		<FlagFR size={size} className={className} />
	);
}
