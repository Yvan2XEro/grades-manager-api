import Image from "next/image";

/**
 * A full-bleed photographic interlude between chapters.
 *
 * The homepage carried imagery in its first three sections and then ran eight
 * consecutive sections of type and flat colour. That is what made it read as
 * flat: not a shortage of decoration, but a shortage of *places* — nothing after
 * the hero showed the institutions the product is for.
 *
 * These bands are punctuation, not content. They carry one sentence and they do
 * not compete with the live demos, which remain the page's proof. Their job is
 * to let the reader breathe between two arguments and to keep real classrooms
 * in view while the page talks about deliberation rules.
 *
 * Height was the first thing to get wrong: capped at 320px, a band is tall
 * enough to interrupt the reading but too short to rest it, and it reads as a
 * stray banner. `clamp(24rem, 34vw, 34rem)` gives it enough room to become a
 * place — still well under half a viewport on a laptop, so it punctuates the
 * page rather than taking it over.
 *
 * Constraints, in order:
 *   1. Every photograph is self-hosted. No third-party CDN on a site that sells
 *      sovereign hosting.
 *   2. The scrim is heavy enough for AA on the caption and no heavier. The
 *      earlier treatment in `TheCost` used `bg-tk-dark/82`, which erased the
 *      photograph it was placed over — if the image cannot be seen there is no
 *      reason to pay for it.
 *   3. `loading="lazy"` — these sit far below the fold and must not compete
 *      with the hero for bandwidth.
 *
 * On `object-[center_38%]` rather than `object-center`.
 *
 * Every band file is cut from a 3:2 source, so ~36 % of the original height is
 * already gone before the browser sees it. Those crops are no longer chosen by
 * entropy — entropy picks the busiest region, which on these photographs is
 * clothing and masonry, and it repeatedly sliced faces in half or dropped the
 * one element that identified the setting. Each is now cut around a measured
 * subject position, placing the face at ~38 % of the band.
 *
 * `object-cover` then crops a second time whenever the container is taller than
 * 21:9 — which is every viewport under roughly 1500px. Centring that second
 * crop eats the frame symmetrically and takes the faces with it. Holding 38 %
 * keeps the browser's crop aligned with the one already baked into the file.
 * The two must agree; if the crop anchors change, this changes with them.
 */
export function PhotoBand({
	src,
	alt,
	caption,
	attribution,
	align = "left",
	priority = false,
}: {
	src: string;
	/** Empty only when the band is purely decorative and the caption says everything. */
	alt: string;
	caption: string;
	/** Where the photograph was taken, when we can say. */
	attribution?: string;
	align?: "left" | "right";
	priority?: boolean;
}) {
	return (
		<section className="relative h-[clamp(24rem,34vw,34rem)] w-full overflow-hidden">
			<Image
				src={src}
				alt={alt}
				fill
				sizes="100vw"
				priority={priority}
				loading={priority ? undefined : "lazy"}
				className="object-cover object-[center_38%]"
			/>

			{/*
			 * Directional scrim: dense behind the words, clearing toward the far
			 * edge so the photograph stays visible rather than being flattened to
			 * a coloured rectangle.
			 *
			 * Lightened from 85/55/15 to 68/34/6, and the dense end now stops at
			 * 42 % instead of running to the middle. At 85 % the left half of every
			 * band was effectively a violet rectangle — the photograph was paid for,
			 * shipped, and then hidden. The caption still clears AA at 68 % (see the
			 * measured ratios in globals.css), so nothing is traded for this.
			 */}
			<div
				aria-hidden="true"
				className={`absolute inset-0 ${
					align === "left"
						? "bg-gradient-to-r from-0% from-tk-dark/68 via-42% via-tk-dark/34 to-tk-dark/6"
						: "bg-gradient-to-l from-0% from-tk-dark/68 via-42% via-tk-dark/34 to-tk-dark/6"
				}`}
			/>

			<div className="relative mx-auto flex h-full max-w-[86rem] items-center px-6 lg:px-10">
				<div
					className={`max-w-[34ch] ${align === "right" ? "ml-auto text-right" : ""}`}
				>
					<p className="font-bold font-display text-[clamp(1.15rem,0.9rem+1.1vw,1.75rem)] text-tk-on-dark leading-[1.2] tracking-[-0.022em]">
						{caption}
					</p>
					{attribution ? (
						/*
						 * Full-strength ink, not `on-dark-soft`.
						 *
						 * Measured over the lightened scrim against a blown highlight in
						 * the photograph, the soft grey lands at 2.94:1 — below AA. The
						 * caption survives at 5.12 because it is large; this line is
						 * 10px, so it needs the brighter ink and leans on opacity for
						 * the hierarchy instead of on a darker grey.
						 */
						<p className="mt-2.5 font-code text-[length:var(--tk-text-xs)] text-tk-on-dark/85 uppercase tracking-[0.14em]">
							{attribution}
						</p>
					) : null}
				</div>
			</div>
		</section>
	);
}
