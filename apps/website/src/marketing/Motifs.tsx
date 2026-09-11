import type React from "react";
import { useId } from "react";

/**
 * Motifs — the African register of the design, drawn rather than photographed.
 *
 * These are inline SVG patterns in the lineage of West African strip-weaving
 * and adinkra-style geometry: lozenges, chevrons, combs, woven bands. They are
 * abstractions, not reproductions — no single textile is quoted, and nothing
 * here carries a meaning that would be misused by being decorative.
 *
 * Why SVG rather than imagery:
 *   - it stays crisp at any density and costs no image request
 *   - it inherits `currentColor`, so a motif is always in palette
 *   - it can be masked and faded per section without producing new assets
 *
 * House rules, in order:
 *   1. A motif is a WATERMARK. It sits behind headings, in margins, or in a
 *      band between chapters — never behind body copy.
 *   2. It is always `aria-hidden` and pointer-transparent.
 *   3. Opacity is carried by the caller, never baked in, so each placement can
 *      be tuned against its own background.
 */

/**
 * Stable-per-instance id so multiple motifs on one page never collide on their
 * <pattern> ids. `useId` is used rather than a module counter because a counter
 * advances differently on the server and on the client, which would make the
 * ids mismatch on hydration and silently blank the fills.
 */
function usePatternId(prefix: string) {
	return `${prefix}-${useId().replace(/:/g, "")}`;
}

type MotifProps = {
	className?: string;
	/** Pattern tile size in px. Larger reads calmer. */
	scale?: number;
};

/**
 * Kente-style woven lozenge. The workhorse: quiet enough for large fills,
 * structured enough to read as cloth rather than as a generic grid.
 */
export function MotifWeave({ className = "", scale = 48 }: MotifProps) {
	const id = usePatternId("weave");
	return (
		<svg
			aria-hidden="true"
			className={`pointer-events-none ${className}`}
			width="100%"
			height="100%"
		>
			<title>Motif tissé</title>
			<defs>
				<pattern
					id={id}
					width={scale}
					height={scale}
					patternUnits="userSpaceOnUse"
				>
					<path
						d={`M0 ${scale / 2} L${scale / 2} 0 L${scale} ${scale / 2} L${
							scale / 2
						} ${scale} Z`}
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
					/>
					<path
						d={`M${scale / 4} ${scale / 2} L${scale / 2} ${scale / 4} L${
							(scale * 3) / 4
						} ${scale / 2} L${scale / 2} ${(scale * 3) / 4} Z`}
						fill="none"
						stroke="currentColor"
						strokeWidth="0.6"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} />
		</svg>
	);
}

/**
 * Chevron column — reads as a woven selvedge. Used as a narrow vertical or
 * horizontal border strip, not as a field.
 */
export function MotifChevron({ className = "", scale = 24 }: MotifProps) {
	const id = usePatternId("chevron");
	return (
		<svg
			aria-hidden="true"
			className={`pointer-events-none ${className}`}
			width="100%"
			height="100%"
		>
			<title>Motif chevron</title>
			<defs>
				<pattern
					id={id}
					width={scale}
					height={scale}
					patternUnits="userSpaceOnUse"
				>
					<path
						d={`M0 ${scale * 0.75} L${scale / 2} ${scale * 0.25} L${scale} ${
							scale * 0.75
						}`}
						fill="none"
						stroke="currentColor"
						strokeWidth="1.25"
						strokeLinecap="square"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} />
		</svg>
	);
}

/**
 * Comb / ladder motif — dense vertical strokes broken by a rule, in the
 * register of a woven band. Good behind numerals and statistics.
 */
export function MotifComb({ className = "", scale = 18 }: MotifProps) {
	const id = usePatternId("comb");
	return (
		<svg
			aria-hidden="true"
			className={`pointer-events-none ${className}`}
			width="100%"
			height="100%"
		>
			<title>Motif peigne</title>
			<defs>
				<pattern
					id={id}
					width={scale}
					height={scale}
					patternUnits="userSpaceOnUse"
				>
					<path
						d={`M${scale / 2} 0 V${scale}`}
						stroke="currentColor"
						strokeWidth="1"
					/>
					<path
						d={`M0 ${scale / 2} H${scale}`}
						stroke="currentColor"
						strokeWidth="0.5"
						opacity="0.55"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} />
		</svg>
	);
}

/**
 * A full-bleed woven band used to separate two chapters. Fades at both ends so
 * it reads as cloth selvedge rather than as a ruled divider.
 */
export function MotifBand({
	variant = "light",
	className = "",
}: {
	variant?: "light" | "dark";
	className?: string;
}) {
	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none relative h-14 w-full overflow-hidden ${className}`}
			style={{
				maskImage:
					"linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
				WebkitMaskImage:
					"linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
			}}
		>
			<div
				className={
					variant === "dark"
						? "absolute inset-0 text-white/25"
						: "absolute inset-0 text-tk-accent/30"
				}
			>
				<MotifChevron scale={22} />
			</div>
		</div>
	);
}

/**
 * Corner ornament: a quarter of the weave, anchored to one corner of a panel
 * and fading inward. Adds craft to an otherwise plain card without adding
 * noise across its whole surface.
 */
export function MotifCorner({
	position = "top-right",
	variant = "light",
	className = "",
}: {
	position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
	variant?: "light" | "dark";
	className?: string;
}) {
	const anchor = {
		"top-right": "top-0 right-0",
		"top-left": "top-0 left-0",
		"bottom-right": "right-0 bottom-0",
		"bottom-left": "bottom-0 left-0",
	}[position];

	const fade = {
		"top-right": "radial-gradient(circle at top right, #000, transparent 72%)",
		"top-left": "radial-gradient(circle at top left, #000, transparent 72%)",
		"bottom-right":
			"radial-gradient(circle at bottom right, #000, transparent 72%)",
		"bottom-left":
			"radial-gradient(circle at bottom left, #000, transparent 72%)",
	}[position];

	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute h-44 w-44 ${anchor} ${
				variant === "dark" ? "text-white/20" : "text-tk-accent/25"
			} ${className}`}
			style={{ maskImage: fade, WebkitMaskImage: fade }}
		>
			<MotifWeave scale={30} />
		</div>
	);
}

/**
 * Convenience wrapper: a motif layer positioned over a section, masked so it
 * dissolves before it reaches the content.
 */
export function MotifLayer({
	children,
	className = "",
	fade = "top",
}: {
	children: React.ReactNode;
	className?: string;
	fade?: "top" | "bottom" | "none";
}) {
	const mask =
		fade === "top"
			? "linear-gradient(180deg, #000, transparent)"
			: fade === "bottom"
				? "linear-gradient(0deg, #000, transparent)"
				: undefined;

	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
			style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
		>
			{children}
		</div>
	);
}
