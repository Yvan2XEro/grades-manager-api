import Image from "next/image";
import Link from "next/link";
import type { Dict, Locale } from "@/i18n";
import { Calculateur } from "../estimator/Calculateur";

/**
 * Home hero.
 *
 * A photograph carries the top, a solid violet block overlaps it holding one
 * sentence, and the estimator sits beside it so the visitor's first interaction
 * returns a number about their own institution rather than a paragraph about
 * ours.
 *
 * The headline is borrowed from the commercial proposal's own cover — "Vous
 * saurez sur quoi vous vous engagez" — because that promise of radical
 * transparency is the strongest thing OverBrand says about itself, and the
 * estimator immediately makes good on it.
 *
 * The violet is the logo's #6160FF at full strength on a white ground; the band
 * closing the block is a woven chevron, the African motif used as structure
 * rather than as a 5%-opacity watermark.
 */
export function HomeHero({ dict: d, locale }: { dict: Dict; locale: Locale }) {
	const en = locale === "en";

	return (
		<section className="relative overflow-hidden bg-tk-bg pt-[68px]">
			<div className="relative h-[240px] sm:h-[320px] lg:h-[420px]">
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
				 * is re-encoded to 1800px WebP (212 KB) before shipping. Nobody on a
				 * Douala connection should download a hero image measured in megabytes.
				 */}
				<Image
					src="/images/web/etudiante-drapeaux.webp"
					alt={
						en
							? "A student carrying her books across a university campus"
							: "Une étudiante traversant le campus, ses livres à la main"
					}
					fill
					priority
					sizes="100vw"
					className="object-cover object-[center_42%]"
				/>
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-r from-tk-ink/60 via-tk-ink/25 to-transparent"
				/>
			</div>

			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="-mt-20 lg:-mt-[18rem] relative grid gap-8 lg:grid-cols-[minmax(0,29rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
					<div>
						{/*
						 * Load sequence, four beats 90ms apart, in reading order. The
						 * steps are declared here rather than in the CSS so the order is
						 * visible next to the content it moves.
						 */}
						<div className="bg-tk-primary px-7 py-9 lg:px-9 lg:py-11">
							<p
								data-hero-step
								style={{ ["--tk-hero-step" as string]: 0 }}
								className="font-code text-[0.7rem] text-tk-on-primary/75 uppercase tracking-[0.16em]"
							>
								{en
									? "Academic management software · LMD"
									: "Logiciel de gestion académique · LMD"}
							</p>
							<h1
								data-hero-step
								style={{ ["--tk-hero-step" as string]: 1 }}
								className="mt-5 font-display font-extrabold text-[clamp(2rem,1.3rem+2.5vw,3rem)] text-tk-on-primary leading-[1.03] tracking-[-0.035em]"
							>
								{/*
								 * The pivot phrase is underlined rather than recoloured: on this
								 * violet ground a second hue would either vanish or read as a
								 * warning, and warm type is out of the palette entirely.
								 */}
								{en ? (
									<>
										You will know exactly what you are{" "}
										<span className="underline decoration-[0.09em] decoration-tk-on-primary/45 underline-offset-[0.18em]">
											signing up for.
										</span>
									</>
								) : (
									<>
										Vous saurez sur quoi vous{" "}
										<span className="underline decoration-[0.09em] decoration-tk-on-primary/45 underline-offset-[0.18em]">
											vous engagez.
										</span>
									</>
								)}
							</h1>
							<p
								data-hero-step
								style={{ ["--tk-hero-step" as string]: 2 }}
								className="mt-5 max-w-[38ch] font-body text-[0.98rem] text-tk-on-primary/85 leading-relaxed"
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
									className="rounded-md bg-tk-surface px-6 py-3.5 font-body font-semibold text-[0.9375rem] text-tk-primary-deep transition-colors hover:bg-tk-primary-soft"
								>
									{en ? "Request a demo" : "Demander une démo"}
								</Link>
								<Link
									href="#produit"
									className="rounded-md border border-tk-on-primary/40 px-6 py-3.5 font-body font-semibold text-[0.9375rem] text-tk-on-primary transition-colors hover:bg-tk-on-primary/10"
								>
									{en ? "See the software" : "Voir le logiciel"}
								</Link>
							</div>
						</div>
						<div
							aria-hidden="true"
							className="tk-band-chevron"
							style={{ ["--tk-motif" as string]: "var(--tk-accent)" }}
						/>
					</div>

					{/* Fourth beat: the estimator, the thing the hero exists for. */}
					<div
						data-hero-step
						style={{ ["--tk-hero-step" as string]: 3 }}
						className="lg:pt-2"
					>
						<Calculateur locale={locale} />
					</div>
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
							className="inline-flex items-center gap-2 font-body font-medium text-[0.875rem] text-tk-ink-2"
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
