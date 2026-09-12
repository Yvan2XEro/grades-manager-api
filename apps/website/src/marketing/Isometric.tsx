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
 *   - Every face takes its colour from a `--tk-*` token, so a change to the
 *     palette re-tints the whole illustration and a future dark theme would
 *     carry it for free. (The marketing tokens have no dark variant today —
 *     `[data-theme='dark']` in globals.css redefines the shadcn palette used by
 *     the app, not `--tk-*`.) A rendered image would need a second file either
 *     way.
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

/** Which domain screen is drawn on a slab's surface. */
type Scene = "enrolment" | "marks" | "deliberation" | "documents";

type Slab = {
	label: string;
	/** The screen drawn on this slab. */
	scene: Scene;
	/** Accent used for the data marks on this screen. */
	accent: string;
};

/**
 * The screen drawn on each slab's top face.
 *
 * The first attempt drew abstract furniture — translucent blocks and ghost
 * tiles floating on coloured slabs. It read as a generic tech illustration
 * rather than as this product, for three reasons worth recording so the mistake
 * is not repeated: shapes at 20–60% opacity look unfinished rather than light;
 * translucent layers crossing each other turn muddy; and an abstract block says
 * nothing a label was not already saying.
 *
 * The site earns its credibility everywhere else by showing real interface —
 * `app-demo/shell.tsx` reproduces the product's actual chrome down to the
 * measurements. These slabs now follow that: each one is a white card carrying
 * a legible fragment of a real screen — a table with rows, a mark sheet with
 * figures, a decision list, a document with its QR. Opaque, high-contrast, and
 * recognisable at the size it is actually displayed.
 */
function SlabScene({
	scene,
	z,
	cx,
	cy,
	s,
	offset,
	accent,
}: {
	scene: Scene;
	z: number;
	cx: number;
	cy: number;
	s: number;
	/** Ground-plane shift of the slab this scene sits on. */
	offset: number;
	/** Accent for the data marks on this screen. */
	accent: string;
}) {
	/** Slab-local point → screen point, carrying the slab's own offset. */
	const P = (x: number, y: number, lift = 0) =>
		project(x + offset, y + offset, z + lift, cx, cy, s).join(" ");

	/** A rectangle lying flat on the card. */
	const rect = (
		x: number,
		y: number,
		w: number,
		h: number,
		fill: string,
		key: string,
		opacity = 1,
	) => (
		<polygon
			key={key}
			points={`${P(x, y)}, ${P(x + w, y)}, ${P(x + w, y + h)}, ${P(x, y + h)}`}
			fill={fill}
			fillOpacity={opacity}
		/>
	);

	/** A column standing up from the card — deliberation only. */
	const column = (
		x: number,
		y: number,
		w: number,
		hgt: number,
		key: string,
	) => (
		<g key={key}>
			<polygon
				points={`${P(x, y + w, hgt)}, ${P(x + w, y + w, hgt)}, ${P(x + w, y + w)}, ${P(x, y + w)}`}
				fill={accent}
				fillOpacity={0.72}
			/>
			<polygon
				points={`${P(x + w, y, hgt)}, ${P(x + w, y + w, hgt)}, ${P(x + w, y + w)}, ${P(x + w, y)}`}
				fill={accent}
				fillOpacity={0.86}
			/>
			<polygon
				points={`${P(x, y, hgt)}, ${P(x + w, y, hgt)}, ${P(x + w, y + w, hgt)}, ${P(x, y + w, hgt)}`}
				fill={accent}
			/>
		</g>
	);

	const INK = "var(--tk-ink)";
	const LINE = "var(--tk-border)";

	/* A title bar every card shares, so the four read as one product. */
	const header = (
		<>
			{rect(-0.86, -0.86, 1.72, 0.16, "var(--tk-bg-deep)", "hdr")}
			{rect(-0.8, -0.81, 0.44, 0.06, accent, "hdr-t")}
		</>
	);

	if (scene === "enrolment") {
		/* A student list: rows of name + status pill. */
		const rows = [0, 1, 2, 3, 4];
		return (
			<g>
				{header}
				{rows.map((i) => {
					const y = -0.6 + i * 0.28;
					return (
						<g key={i}>
							{i % 2 === 1
								? rect(-0.86, y - 0.05, 1.72, 0.26, LINE, `z${i}`, 0.4)
								: null}
							{/* avatar, name and status share one baseline */}
							{rect(-0.78, y + 0.02, 0.12, 0.12, accent, `a${i}`, 0.9)}
							{rect(-0.6, y + 0.04, 0.56 - i * 0.05, 0.08, INK, `n${i}`, 0.7)}
							{rect(
								0.34,
								y + 0.02,
								0.44,
								0.12,
								accent,
								`s${i}`,
								i < 3 ? 0.85 : 0.22,
							)}
						</g>
					);
				})}
			</g>
		);
	}

	if (scene === "marks") {
		/* A mark sheet: a column of names, a grid of scores, some blank. */
		const rows = [0, 1, 2, 3, 4];
		const cols = [0, 1, 2, 3];
		const entered = [4, 4, 3, 2, 0];
		return (
			<g>
				{header}
				{rows.map((r) => {
					const y = -0.6 + r * 0.28;
					return (
						<g key={r}>
							{r % 2 === 1
								? rect(-0.86, y - 0.05, 1.72, 0.26, LINE, `z${r}`, 0.4)
								: null}
							{rect(-0.78, y + 0.03, 0.5, 0.08, INK, `n${r}`, 0.7)}
							{cols.map((c) =>
								rect(
									-0.16 + c * 0.24,
									y,
									0.17,
									0.14,
									c < entered[r] ? accent : LINE,
									`c${r}-${c}`,
									c < entered[r] ? 0.9 : 0.75,
								),
							)}
						</g>
					);
				})}
			</g>
		);
	}

	if (scene === "deliberation") {
		/* A cohort as columns, cut by the jury threshold. */
		const h = [14, 30, 20, 38, 9, 33, 24, 17];
		const RULE = 22;
		return (
			<g>
				{header}
				{/* threshold plane, drawn before the columns so they stand in front */}
				<polygon
					points={`${P(-0.84, 0.62, RULE)}, ${P(0.84, 0.62, RULE)}, ${P(0.84, 0.66, RULE)}, ${P(-0.84, 0.66, RULE)}`}
					fill={INK}
					fillOpacity={0.28}
				/>
				{h.map((v, i) => column(-0.8 + i * 0.2, 0.12, 0.13, v, `b${i}`))}
			</g>
		);
	}

	/* documents — a sheet with a header block, text lines and a QR square. */
	return (
		<g>
			{header}
			{rect(-0.62, -0.5, 1.24, 1.3, "var(--tk-surface)", "sheet")}
			{rect(-0.54, -0.42, 0.5, 0.1, accent, "doc-title", 0.9)}
			{[0, 1, 2, 3, 4].map((i) =>
				rect(
					-0.54,
					-0.22 + i * 0.14,
					i === 4 ? 0.5 : 1.06,
					0.06,
					INK,
					`l${i}`,
					0.5,
				),
			)}
			{/*
			 * The QR, drawn as a filled block with three corner finders rather than
			 * a checkerboard: a scatter of alternating squares reads as noise at
			 * this size, while the finder pattern is what the eye recognises as a
			 * QR code even when the modules are illegible.
			 */}
			{rect(0.14, 0.34, 0.4, 0.4, INK, "qr", 0.9)}
			{[
				[0.17, 0.37],
				[0.43, 0.37],
				[0.17, 0.63],
			].map(([qx, qy]) => (
				<g key={`f${qx}-${qy}`}>
					{rect(qx, qy, 0.11, 0.11, "var(--tk-surface)", `fo${qx}${qy}`)}
					{rect(qx + 0.03, qy + 0.03, 0.05, 0.05, INK, `fi${qx}${qy}`, 0.9)}
				</g>
			))}
		</g>
	);
}

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

	const S = 88;
	const TH = 20;
	const GAP = 48;
	/** Ground-plane offset per layer, in slab units — what un-hides the scenes. */
	const STEP = 0.34;
	/** Extra separation on hover, on top of the resting cascade. */
	const LIFT = 30;
	/** Room reserved on the right for the leader lines and labels. */
	const LABEL_W = 132;

	const n = slabs.length;
	const spread = (i: number) => (i - (n - 1) / 2) * -LIFT;

	/*
	 * Bounds of the drawn cascade.
	 *
	 * x runs from the leftmost corner of the LAST slab (most offset) to the
	 * rightmost corner of the FIRST. y runs from the top of the highest slab —
	 * including its hover lift and the tallest scene furniture — down to the
	 * bottom corner of the lowest.
	 */
	const lastOff = -(n - 1) * STEP;
	const xMin = (-1 + lastOff - 1 - lastOff) * COS30 * S;
	const xMax = (1 - -1) * COS30 * S;
	const topZ = (n - 1) * GAP + TH + 46;
	const yMin = (-1 + lastOff) * 2 * SIN30 * S - topZ - LIFT * (n - 1) * 0.5;
	const yMax = 2 * SIN30 * S + TH;

	const PAD = 16;
	const W = xMax - xMin + PAD * 2 + LABEL_W;
	const H = yMax - yMin + PAD * 2;
	const CX = -xMin + PAD;
	const CY = -yMin + PAD;

	return (
		<figure className={`m-0 ${className}`}>
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
						const off = -i * STEP;
						const p = (x: number, y: number, zz: number) =>
							project(x + off, y + off, zz, CX, CY, S).join(",");

						const top = `${p(-1, -1, z + TH)} ${p(1, -1, z + TH)} ${p(1, 1, z + TH)} ${p(-1, 1, z + TH)}`;
						const left = `${p(-1, 1, z + TH)} ${p(1, 1, z + TH)} ${p(1, 1, z)} ${p(-1, 1, z)}`;
						const right = `${p(1, -1, z + TH)} ${p(1, 1, z + TH)} ${p(1, 1, z)} ${p(1, -1, z)}`;
						const [lx, ly] = project(1 + off, -1 + off, z + TH, CX, CY, S);

						return (
							<g
								key={slab.label}
								style={{
									transform: `translateY(${dy}px)`,
									transition: "transform 700ms var(--tk-ease)",
								}}
							>
								{/*
								 * A white card, not a coloured slab.
								 *
								 * Colour is carried by the data on the screen, the way it is in
								 * the product itself: the surfaces there are white and the
								 * violet marks the values that matter. Four saturated slabs read
								 * as a chart legend and left no contrast for the screen drawn on
								 * top of them.
								 *
								 * The edges use the same two neutrals as every card on the site,
								 * so the solid reads as lit rather than as three flat greys.
								 */}
								<polygon points={left} fill="var(--tk-sand)" />
								<polygon points={right} fill="var(--tk-bg-deep)" />
								<polygon points={top} fill="var(--tk-surface)" />
								<polygon
									points={top}
									fill="none"
									stroke="var(--tk-border)"
									strokeWidth="1"
								/>

								<SlabScene
									scene={slab.scene}
									z={z + TH}
									cx={CX}
									cy={CY}
									s={S}
									offset={off}
									accent={slab.accent}
								/>

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
					className="absolute bottom-0 left-0 cursor-pointer rounded-md border border-tk-border-strong bg-tk-surface px-3 py-1.5 font-body font-medium text-[length:var(--tk-text-sm)] text-tk-ink-2 transition-colors hover:border-tk-primary hover:text-tk-primary-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-primary focus-visible:outline-offset-2"
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
				<figcaption className="mt-3 font-body text-[length:var(--tk-text-sm)] text-tk-muted italic">
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
				<figcaption className="mt-3 font-body text-[length:var(--tk-text-sm)] text-tk-muted italic">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
