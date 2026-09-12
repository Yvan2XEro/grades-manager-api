"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n";

/**
 * Isometric illustration primitives.
 *
 * Three-dimensional depth drawn as vector, not rendered as pixels and not
 * computed on the GPU. The reasoning is the same one the hero already applies
 * to its photograph: this site sells a promise about weight and honesty, so an
 * illustration that costs 281 KB of WebGL runtime would contradict the page
 * carrying it. A stack here is roughly 4 KB of markup.
 *
 * Two properties follow from staying in SVG, and both matter more than realism:
 *
 *   - Every face takes its colour from a `--tk-*` token, so the whole
 *     illustration re-tints itself when the theme flips. A rendered image would
 *     need a second file.
 *   - The labels are real text: readable by a screen reader, translatable, and
 *     searchable.
 *
 * The geometry is generated from one projection function rather than authored
 * as path data. Long hand-written `points` attributes are unreviewable and
 * silently wrong when a value drifts; here a slab is four numbers.
 */

/** Isometric projection: the standard 30° axonometric axes. */
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

function project(
	x: number,
	y: number,
	z: number,
	cx: number,
	cy: number,
	s: number,
) {
	return [cx + (x - y) * COS30 * s, cy + (x + y) * SIN30 * s - z] as const;
}

type Slab = {
	/** Token name without the `--` prefix, e.g. "tk-primary". */
	token: string;
	label: string;
	/** Multiplies the top-face opacity, to separate two slabs on one token. */
	tint?: number;
};

/**
 * A stack of labelled slabs — the "one database, several domains" picture.
 *
 * Hovering (or focusing) separates the layers and reveals the labels, which is
 * the whole argument made physical: the domains are distinct, and they sit in
 * one object.
 */
export function IsoStack({
	slabs,
	caption,
	locale,
	className = "",
}: {
	slabs: Slab[];
	caption?: string;
	locale: Locale;
	className?: string;
}) {
	const en = locale === "en";
	const id = useId();
	const [open, setOpen] = useState(false);

	const W = 620;
	const H = 300 + slabs.length * 52;
	const CX = W * 0.42;
	const CY = H * 0.56;
	const S = 104;
	const TH = 24;
	const GAP = 44;

	/** How far each slab travels when the stack opens, in SVG units. */
	const spread = (i: number) => (i - (slabs.length - 1) / 2) * -26;

	return (
		<figure className={`m-0 ${className}`}>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: pointer affordance only — the same state is reachable by keyboard through the button below. */}
			<div
				className="group relative"
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
			>
				<svg
					viewBox={`0 0 ${W} ${H}`}
					className="h-auto w-full"
					role="img"
					aria-labelledby={`${id}-t`}
				>
					<title id={`${id}-t`}>
						{caption ??
							(en
								? `Isometric stack: ${slabs.map((s) => s.label).join(", ")}`
								: `Pile isométrique : ${slabs.map((s) => s.label).join(", ")}`)}
					</title>

					{slabs.map((slab, i) => {
						const z = i * GAP;
						const dy = open ? spread(i) : 0;
						const p = (x: number, y: number, zz: number) =>
							project(x, y, zz, CX, CY, S).join(",");

						const top = `${p(-1, -1, z + TH)} ${p(1, -1, z + TH)} ${p(1, 1, z + TH)} ${p(-1, 1, z + TH)}`;
						const left = `${p(-1, 1, z + TH)} ${p(1, 1, z + TH)} ${p(1, 1, z)} ${p(-1, 1, z)}`;
						const right = `${p(1, -1, z + TH)} ${p(1, 1, z + TH)} ${p(1, 1, z)} ${p(1, -1, z)}`;
						const [lx, ly] = project(1, -1, z + TH, CX, CY, S);
						const fill = `var(--${slab.token})`;
						const t = slab.tint ?? 1;

						return (
							<g
								key={slab.label}
								style={{
									transform: `translateY(${dy}px)`,
									transition: "transform 700ms var(--tk-ease)",
								}}
							>
								{/* Sides are the same token at lower opacity, so one colour
								    change re-lights the whole solid. */}
								<polygon points={left} fill={fill} fillOpacity={0.5 * t} />
								<polygon points={right} fill={fill} fillOpacity={0.74 * t} />
								<polygon points={top} fill={fill} fillOpacity={t} />

								<g
									style={{
										opacity: open ? 1 : 0,
										transition: "opacity 400ms var(--tk-ease) 160ms",
									}}
								>
									<line
										x1={lx + 6}
										y1={ly}
										x2={lx + 26}
										y2={ly}
										stroke="var(--tk-border-strong)"
										strokeWidth="1"
									/>
									<text
										x={lx + 34}
										y={ly + 4}
										className="font-code"
										fontSize="13"
										fill="var(--tk-ink-2)"
									>
										{slab.label}
									</text>
								</g>
							</g>
						);
					})}
				</svg>

				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					onFocus={() => setOpen(true)}
					onBlur={() => setOpen(false)}
					aria-pressed={open}
					className="absolute bottom-0 left-0 cursor-pointer rounded-md border border-tk-border-strong bg-tk-surface px-3 py-1.5 font-body font-medium text-[0.78rem] text-tk-ink-2 transition-colors hover:border-tk-primary hover:text-tk-primary-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-primary focus-visible:outline-offset-2"
				>
					{open
						? en
							? "Close"
							: "Refermer"
						: en
							? "Separate the layers"
							: "Séparer les couches"}
				</button>
			</div>

			{caption ? (
				<figcaption className="mt-3 font-body text-[0.8125rem] text-tk-muted italic">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}

/**
 * A single isometric plane carrying a grid of tiles — the "hours lost" picture.
 *
 * Each tile is one unit of the quantity being counted, so the reader sees the
 * magnitude as an area before reading the figure. `filled` tiles take the
 * accent; the rest stay as faint outlines.
 */
export function IsoField({
	cols = 10,
	rows = 8,
	filled,
	caption,
	className = "",
}: {
	cols?: number;
	rows?: number;
	/** How many tiles are "spent" — filled in the accent. */
	filled: number;
	caption?: string;
	className?: string;
}) {
	const id = useId();
	/*
	 * The viewBox is derived from the grid, not fixed: an isometric plane of
	 * cols x rows is (cols+rows) half-widths across and half that tall, so a
	 * hardcoded height left a band of empty space above the tiles.
	 */
	const S = 30;
	const W = (cols + rows) * S * COS30 + 24;
	const H = (cols + rows) * S * SIN30 + 24;
	/* Origin sits where tile (0,0) must land: the leftmost point is x=0,y=rows. */
	const CX = rows * S * COS30 + 12;
	const CY = 12;

	const tiles: React.ReactNode[] = [];
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const n = y * cols + x;
			const on = n < filled;
			const pts = [
				project(x, y, 0, CX, CY, S),
				project(x + 0.92, y, 0, CX, CY, S),
				project(x + 0.92, y + 0.92, 0, CX, CY, S),
				project(x, y + 0.92, 0, CX, CY, S),
			]
				.map((p) => p.join(","))
				.join(" ");

			tiles.push(
				<polygon
					key={n}
					points={pts}
					fill={on ? "var(--tk-accent)" : "var(--tk-surface)"}
					fillOpacity={on ? 0.9 : 1}
					stroke="var(--tk-border)"
					strokeWidth="1"
					style={{
						transition: `opacity 400ms var(--tk-ease) ${Math.min(n * 8, 900)}ms`,
					}}
				/>,
			);
		}
	}

	return (
		<figure className={`m-0 ${className}`}>
			<svg
				viewBox={`0 0 ${W} ${H}`}
				className="h-auto w-full"
				role="img"
				aria-labelledby={`${id}-t`}
			>
				<title id={`${id}-t`}>
					{caption ?? `${filled} unités sur ${cols * rows}`}
				</title>
				{tiles}
			</svg>
			{caption ? (
				<figcaption className="mt-3 font-body text-[0.8125rem] text-tk-muted italic">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
