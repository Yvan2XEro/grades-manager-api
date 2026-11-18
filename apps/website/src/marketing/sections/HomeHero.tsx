import Image from "next/image";
import Link from "next/link";
import type { Dict, Locale } from "@/i18n";
import { Calculateur } from "../estimator/Calculateur";

/**
 * Home hero.
 *
 * A photograph banners the top, the headline runs the full width beneath it,
 * and the estimator sits under that — so the visitor's first interaction
 * returns a number about their own institution rather than a paragraph about
 * ours.
 *
 * The headline is borrowed from the commercial proposal's own cover — "Vous
 * saurez sur quoi vous vous engagez" — because that promise of radical
 * transparency is the strongest thing OverBrand says about itself, and the
 * estimator immediately makes good on it.
 *
 * An earlier version set the headline inside a 29rem violet block beside the
 * estimator. Two problems: at display size that column fits about ten
 * characters a line, so the French headline broke into five lines; and two
 * large violet panels side by side gave the eye no order to read them in.
 */
export function HomeHero({ dict: d, locale }: { dict: Dict; locale: Locale }) {
	const en = locale === "en";

	return (
		/*
		 * The grid is repeated here so it runs behind the hero too. The page paints
		 * it on <main>, but this section's photograph and washes stack above it, so
		 * the texture appeared to start halfway down the page — it read as an
		 * accident rather than as a surface.
		 */
		<section className="tk-dotgrid relative overflow-hidden pt-[var(--tk-header-h)]">
			<Link
				href="/secondaire"
				className="relative z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-tk-primary-deep px-6 py-3 text-center font-body text-[length:var(--tk-text-sm)] text-tk-on-primary no-underline hover:underline"
			>
				<span>{d.secondary.announcement}</span>
				<span className="font-semibold">{d.secondary.discover}</span>
			</Link>
			{/*
			 * Two very diffuse colour washes behind the hero, one brand violet and
			 * one accent. They are the depth device the reference sites use instead
			 * of filled panels: the ground stays white and the colour arrives as
			 * light rather than as a block. Decorative, so aria-hidden.
			 */}
			<div
				aria-hidden="true"
				className="tk-wash tk-wash--primary -top-40 -left-32 h-[620px] w-[620px]"
			/>
			<div
				aria-hidden="true"
				className="tk-wash tk-wash--accent -right-40 top-10 h-[520px] w-[520px]"
			/>

			{/*
			 * Locked aspect ratio rather than stepped fixed heights.
			 *
			 * This was h-[240px] / sm:h-[320px] / lg:h-[420px], so the banner
			 * changed proportion at every breakpoint and the photograph was
			 * cropped differently on each — the reference keeps its product shot
			 * at a constant 2.28:1 from 390px to 1920px. A ratio scales; a height
			 * does not.
			 */}
			<div className="relative aspect-[16/7] max-h-[440px] w-full">
				{/*
				 * Students on a campus, self-hosted.
				 *
				 * Two problems fixed at once. The image was a hotlinked Unsplash
				 * photograph of a Western campus — the most recirculated picture in
				 * education-software marketing, and a live third-party CDN request on
				 * a page that sells sovereign hosting. It then briefly became a
				 * photograph of an Indonesian classroom, which was no better on a site
				 * addressed to francophone African institutions.
				 *
				 * Served from `public/images/web/`: the 4256px source is 8.5 MB, so it
				 * is re-encoded to 1800px WebP before shipping. Nobody on a Douala
				 * connection should download a hero image measured in megabytes.
				 *
				 * Anchored to the top, twice over — and the two must agree.
				 *
				 * The band file is cut from the top edge of the source rather than by
				 * entropy. Entropy chose the busiest region, which is the subject and
				 * the staircase, and it dropped the flagpoles entirely: the one thing
				 * in the frame that reads as *university*, and the reason this
				 * photograph was picked over the others. It also shaved the top of her
				 * head.
				 *
				 * `object-top` then holds the same line in CSS. The file is 21:9 but
				 * the hero is taller than that on any viewport under ~1500px, so
				 * `object-cover` crops a second time at display. Centring would spend
				 * that crop on both edges at once — losing the flags again to keep a
				 * band of empty steps. Let the masonry go instead.
				 */}
				<Image
					src="/images/web/etudiante-drapeaux-band.webp"
					alt={
						en
							? "A student carrying her books across a university campus"
							: "Une étudiante traversant le campus, ses livres à la main"
					}
					fill
					priority
					sizes="100vw"
					className="object-cover object-top"
				/>
				{/*
				 * The scrim now fades downward, not sideways.
				 *
				 * It used to darken the left third because the headline sat on top of
				 * the photograph. The headline has moved below it, so the only job
				 * left is to let the photo settle into the page ground instead of
				 * ending on a hard edge.
				 */}
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-b from-tk-ink/25 via-transparent to-tk-bg"
				/>
			</div>

			<div className="relative mx-auto max-w-[86rem] px-6 lg:px-10">
				{/*
				 * The headline runs the full width; the estimator sits under it.
				 *
				 * It used to share a row with the estimator inside a 29rem column. At the
				 * display size that column is ~408px of usable text, which is about ten
				 * characters a line — so the French headline broke into five lines, two of
				 * them a single word, and the underline meant to mark one phrase split
				 * across two rows and stopped meaning anything.
				 *
				 * Full width the same sentence sets in two lines, and the page stops
				 * showing two large violet panels side by side competing for the eye.
				 */}
				<div className="-mt-16 lg:-mt-28 relative max-w-[54rem]">
					<p
						data-hero-step
						style={{ ["--tk-hero-step" as string]: 0 }}
						className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]"
					>
						{en
							? "Academic management software · LMD"
							: "Logiciel de gestion académique · LMD"}
					</p>
					<h1
						data-hero-step
						style={{ ["--tk-hero-step" as string]: 1 }}
						className="tk-display tk-gradient-text mt-4"
					>
						{en
							? "You will know exactly what you are signing up for."
							: "Vous saurez sur quoi vous vous engagez."}
					</h1>
					<p
						data-hero-step
						style={{ ["--tk-hero-step" as string]: 2 }}
						className="mt-5 max-w-[52ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed"
					>
						{en
							? "Every franc we quote is written down, explained and verifiable — including what is not included."
							: "Chaque franc proposé est écrit, expliqué et vérifiable. Y compris ce qui n'est pas inclus."}
					</p>
					<div
						data-hero-step
						style={{ ["--tk-hero-step" as string]: 2 }}
						className="mt-8 flex flex-wrap gap-3"
					>
						<Link
							href="/contact"
							className="rounded-md bg-tk-primary px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-primary transition-colors hover:bg-tk-primary-deep"
						>
							{en ? "Request a demo" : "Demander une démo"}
						</Link>
						<Link
							href="#produit"
							className="rounded-md border border-tk-border-strong px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-ink transition-colors hover:border-tk-primary hover:text-tk-primary-deep"
						>
							{en ? "See the software" : "Voir le logiciel"}
						</Link>
					</div>
				</div>

				{/* The estimator, the thing the hero exists for. */}
				<div
					data-hero-step
					style={{ ["--tk-hero-step" as string]: 3 }}
					className="relative mx-auto mt-12 max-w-[56rem]"
				>
					<Calculateur locale={locale} />
				</div>

				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-tk-border border-t py-5 lg:mt-12">
					{[
						d.hero.badge_lmd,
						d.hero.badge_bi,
						d.hero.badge_live,
						d.hero.cities,
					].map((badge) => (
						<span
							key={badge}
							className="inline-flex items-center gap-2 font-body font-medium text-[length:var(--tk-text-body)] text-tk-ink-2"
						>
							<span className="h-1.5 w-1.5 rounded-full bg-tk-accent" />
							{badge}
						</span>
					))}
				</div>
			</div>
		</section>
	);
}
