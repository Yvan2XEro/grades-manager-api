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

/** Which domain scene is drawn on a slab's surface. */
type Scene = "enrolment" | "marks" | "deliberation" | "documents";

type Slab = {
	/** Token name without the `--` prefix, e.g. "tk-primary". */
	token: string;
	label: string;
	/** Multiplies the top-face opacity, to separate two slabs on one token. */
	tint?: number;
	/** The picture drawn on the slab. Omit for a plain surface. */
	scene?: Scene;
};

/**
 * The furniture drawn on each slab's top face.
 *
 * A coloured rectangle with a label floating beside it is a diagram of nothing:
 * the reader has to be told what the layer is, which defeats the point of
 * drawing it. Each layer therefore carries a small scene of its own domain,
 * laid out in the same isometric grid as the slab it sits on — so the stack
 * reads as four floors of one building, each visibly doing different work.
 *
 * Every scene is built from the same two primitives (a filled tile and an
 * upright bar) placed on slab-local coordinates in the range -1..1, so a scene
 * is a short list of positions rather than hand-authored path data.
 *
 * What each one shows, and why that shape:
 *
 *   enrolment    a queue of student rows arriving at a register — the domain is
 *                people entering the system, so it is drawn as a line of them.
 *   marks        a grid of cells, some filled: a mark sheet mid-entry, which is
 *                exactly what `GradeEntryDemo` shows elsewhere on the page.
 *   deliberation bars of differing height crossing a threshold line — the jury
 *                rule applied to a cohort, the one picture the rules engine
 *                deserves.
 *   documents    stacked sheets with a corner fold and a QR square, the objects
 *                the platform actually emits.
 */
function SlabScene({
	scene,
	z,
	cx,
	cy,
	s,
	offset,
	on,
}: {
	scene: Scene;
	z: number;
	cx: number;
	cy: number;
	s: number;
	/** Ground-plane shift of the slab this scene sits on. */
	offset: number;
	/** Ink colour for marks drawn on this surface. */
	on: string;
}) {
	/** Slab-local point → screen point, carrying the slab's own offset. */
	const P = (x: number, y: number, lift = 0) =>
		project(x + offset, y + offset, z + lift, cx, cy, s).join(",");

	/** A flat tile lying on the surface. */
	const tile = (
		x: number,
		y: number,
		w: number,
		h: number,
		opacity: number,
		key: string,
	) => (
		<polygon
			key={key}
			points={`${P(x, y)} ${P(x + w, y)} ${P(x + w, y + h)} ${P(x, y + h)}`}
			fill={on}
			fillOpacity={opacity}
		/>
	);

	/** A box standing up from the surface — used for the deliberation bars. */
	const bar = (x: number, y: number, w: number, hgt: number, key: string) => {
		const top = `${P(x, y, hgt)} ${P(x + w, y, hgt)} ${P(x + w, y + w, hgt)} ${P(x, y + w, hgt)}`;
		const left = `${P(x, y + w, hgt)} ${P(x + w, y + w, hgt)} ${P(x + w, y + w)} ${P(x, y + w)}`;
		const right = `${P(x + w, y, hgt)} ${P(x + w, y + w, hgt)} ${P(x + w, y + w)} ${P(x + w, y)}`;
		return (
			<g key={key}>
				<polygon points={left} fill={on} fillOpacity={0.62} />
				<polygon points={right} fill={on} fillOpacity={0.8} />
				<polygon points={top} fill={on} fillOpacity={1} />
			</g>
		);
	};

	if (scene === "enrolment") {
		/*
		 * Four application files queueing toward the register.
		 *
		 * Each row is a marker block (the applicant) followed by a bar whose
		 * length is how complete their file is — the shortest one is still
		 * being assembled. The tall block on the right is the register they
		 * are being admitted into.
		 */
		const rows = [-0.38, -0.06, 0.26, 0.58];
		const fill = [0.78, 0.62, 0.9, 0.4];
		return (
			<g>
				{rows.map((y, i) => (
					<g key={y}>
						{bar(-0.72, y, 0.22, 11, `p${y}`)}
						{tile(-0.42, y + 0.03, 0.82 * fill[i], 0.14, 0.72, `r${y}`)}
					</g>
				))}
				{bar(0.5, -0.34, 0.3, 22, "reg")}
			</g>
		);
	}

	if (scene === "marks") {
		/* A 6x4 mark sheet, two thirds filled — entry in progress. */
		const cells = [];
		for (let r = 0; r < 4; r++) {
			for (let c = 0; c < 6; c++) {
				const filled = r * 6 + c < 16;
				cells.push(
					tile(
						-0.7 + c * 0.26,
						-0.3 + r * 0.3,
						0.22,
						0.24,
						filled ? 0.95 : 0.28,
						`c${r}-${c}`,
					),
				);
			}
		}
		return <g>{cells}</g>;
	}

	if (scene === "deliberation") {
		/* Seven bars against a threshold rule: the cohort, re-decided. */
		const heights = [8, 26, 15, 34, 5, 29, 19];
		return (
			<g>
				{/* threshold line running across the plane */}
				<line
					x1={project(-0.74 + offset, 0.44 + offset, z + 20, cx, cy, s)[0]}
					y1={project(-0.74 + offset, 0.44 + offset, z + 20, cx, cy, s)[1]}
					x2={project(0.74 + offset, 0.44 + offset, z + 20, cx, cy, s)[0]}
					y2={project(0.74 + offset, 0.44 + offset, z + 20, cx, cy, s)[1]}
					stroke={on}
					strokeOpacity="0.5"
					strokeWidth="1.5"
					strokeDasharray="5 4"
				/>
				{heights.map((h, i) => bar(-0.7 + i * 0.23, 0.16, 0.18, h, `b${i}`))}
			</g>
		);
	}

	/* documents — three sheets, the top one with a QR square. */
	return (
		<g>
			{[0, 1, 2].map((i) => (
				<polygon
					key={i}
					points={`${P(-0.44 + i * 0.1, -0.24 + i * 0.1, i * 5)} ${P(0.34 + i * 0.1, -0.24 + i * 0.1, i * 5)} ${P(0.34 + i * 0.1, 0.7 + i * 0.1, i * 5)} ${P(-0.44 + i * 0.1, 0.7 + i * 0.1, i * 5)}`}
					fill={on}
					fillOpacity={0.18 + i * 0.14}
				/>
			))}
			{/* text lines on the top sheet */}
			{[0, 1, 2].map((i) => (
				<polygon
					key={`l${i}`}
					points={`${P(-0.16, 0.0 + i * 0.18, 10)} ${P(0.4, 0.0 + i * 0.18, 10)} ${P(0.4, 0.04 + i * 0.18, 10)} ${P(-0.16, 0.04 + i * 0.18, 10)}`}
					fill={on}
					fillOpacity={0.5}
				/>
			))}
			{/* the QR square */}
			<polygon
				points={`${P(-0.16, 0.56, 10)} ${P(0.08, 0.56, 10)} ${P(0.08, 0.8, 10)} ${P(-0.16, 0.8, 10)}`}
				fill={on}
				fillOpacity="0.85"
			/>
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

								{/*
								 * The domain's own picture, drawn on the slab's surface in the
								 * same projection. Ink is the on-primary token so it reads on
								 * every slab colour, including the dark one.
								 */}
								{slab.scene ? (
									<SlabScene
										scene={slab.scene}
										z={z + TH}
										cx={CX}
										cy={CY}
										s={S}
										offset={off}
										on="var(--tk-on-primary)"
									/>
								) : null}

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
