import Image from "next/image";
import type React from "react";

/**
 * The masthead every page other than the home page opens with.
 *
 * The home hero earns its size — a full-bleed photograph, the headline beneath
 * it, then the estimator. Repeating that on twelve inner pages would be wrong:
 * a visitor who has clicked through to /tarifs wants the prices, not another
 * 440px banner. So this is the same *language* at a quieter volume.
 *
 * What it keeps from the home hero:
 *   - a photographic band, but a third of the height
 *   - the two diffuse colour washes, so the ground has depth rather than a flat
 *     coloured panel
 *   - the eyebrow / display headline / lede sequence, at the same scale
 *   - the dot grid showing through
 *
 * What it drops: the overlap, the estimator, and the full-bleed height.
 *
 * Every page passes its own photograph, so the imagery is specific rather than
 * one stock banner reused twelve times. The `-band` variants are pre-cropped
 * wide and re-encoded to WebP — the originals are 5-14 MB JPEGs and must never
 * be served.
 */
export function PageHero({
	eyebrow,
	title,
	lede,
	image,
	imageAlt,
	children,
	/** Pulls the copy up over the band, as the home hero does. */
	overlap = true,
}: {
	/** A string, or a node when the page needs a badge beside the label. */
	eyebrow: React.ReactNode;
	title: React.ReactNode;
	lede?: React.ReactNode;
	/** Path under /images/web/. Prefer a `-band` variant. */
	image?: string;
	imageAlt?: string;
	/** Chips, buttons or anything that belongs under the lede. */
	children?: React.ReactNode;
	overlap?: boolean;
}) {
	return (
		<section className="tk-dotgrid relative overflow-hidden">
			{/* The same two washes as the home hero, scaled to this band. */}
			<div
				aria-hidden="true"
				className="tk-wash tk-wash--primary -top-32 -left-24 h-[420px] w-[420px]"
			/>
			<div
				aria-hidden="true"
				className="tk-wash tk-wash--accent -right-28 top-4 h-[360px] w-[360px]"
			/>

			{image ? (
				<div className="relative aspect-[32/9] max-h-[260px] w-full">
					<Image
						src={image}
						alt={imageAlt ?? ""}
						aria-hidden={imageAlt ? undefined : "true"}
						fill
						priority
						sizes="100vw"
						className="object-cover object-center"
					/>
					{/*
					 * Fades into the page ground so the band has no hard bottom edge —
					 * the same treatment as the home hero.
					 */}
					<div
						aria-hidden="true"
						className="absolute inset-0 bg-gradient-to-b from-tk-ink/20 via-transparent to-tk-bg"
					/>
				</div>
			) : null}

			<div className="relative mx-auto max-w-[86rem] px-6 lg:px-10">
				<div
					className={`max-w-[54rem] ${
						image && overlap ? "-mt-10 lg:-mt-16" : "pt-14 lg:pt-20"
					} pb-14 lg:pb-20`}
				>
					{/*
					 * A div, not a p: pages that need a badge beside the label pass a
					 * node here, and a <span> badge inside a <p> is fine but a nested
					 * block is not. The mono/uppercase treatment is inherited by any
					 * plain string passed in.
					 */}
					<div className="flex flex-wrap items-center gap-3 font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
						{eyebrow}
					</div>
					<h1 className="tk-display tk-gradient-text mt-4">{title}</h1>
					{lede ? (
						<p className="mt-5 max-w-[58ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed">
							{lede}
						</p>
					) : null}
					{children ? <div className="mt-8">{children}</div> : null}
				</div>
			</div>
		</section>
	);
}
