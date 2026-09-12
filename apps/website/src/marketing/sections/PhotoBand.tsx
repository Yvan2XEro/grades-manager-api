import Image from "next/image";

/**
 * A full-bleed photographic interlude between chapters.
 *
 * The homepage carried imagery in its first three sections and then ran eight
 * consecutive sections of type and flat colour. That is what made it read as
 * flat: not a shortage of decoration, but a shortage of *places* — nothing after
 * the hero showed the institutions the product is for.
 *
 * These bands are punctuation, not content. They carry one sentence, they are
 * short (a third of a viewport, never half), and they do not compete with the
 * live demos, which remain the page's proof. Their job is to let the reader
 * breathe between two arguments and to keep real classrooms in view while the
 * page talks about deliberation rules.
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
		<section className="relative h-[220px] overflow-hidden sm:h-[260px] lg:h-[300px]">
			<Image
				src={src}
				alt={alt}
				fill
				sizes="100vw"
				priority={priority}
				loading={priority ? undefined : "lazy"}
				className="object-cover object-center"
			/>

			{/*
			 * Directional scrim: dense behind the words, clearing toward the far
			 * edge so the photograph stays visible rather than being flattened to
			 * a coloured rectangle.
			 */}
			<div
				aria-hidden="true"
				className={`absolute inset-0 ${
					align === "left"
						? "bg-gradient-to-r from-tk-dark/85 via-tk-dark/55 to-tk-dark/15"
						: "bg-gradient-to-l from-tk-dark/85 via-tk-dark/55 to-tk-dark/15"
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
						<p className="mt-2.5 font-code text-[0.68rem] text-tk-on-dark-soft uppercase tracking-[0.14em]">
							{attribution}
						</p>
					) : null}
				</div>
			</div>
		</section>
	);
}
