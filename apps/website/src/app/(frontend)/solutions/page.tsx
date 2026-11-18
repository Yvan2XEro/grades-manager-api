import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import { DeliberationDemo } from "@/marketing/app-demo/DeliberationDemo";
import { GradeEntryDemo } from "@/marketing/app-demo/GradeEntryDemo";
import { PageHero } from "@/marketing/PageHero";
import { Cta } from "@/marketing/sections/Cta";
import { PhotoBand } from "@/marketing/sections/PhotoBand";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

/**
 * Solutions — the product seen from each role's desk.
 *
 * The role copy in `dict.solutions.roles` is good and is kept; what changed is
 * the surrounding layout (moved onto the current design system and off the old
 * editorial scaffolding) and two removals:
 *
 *   - the `Testimonials` block, whose two quotes are placeholders attributed to
 *     named people at unnamed institutions. Publishing invented endorsements on
 *     a site whose whole argument is written-down honesty would undercut every
 *     other page.
 *   - the legacy demo components, replaced by the two live screens that
 *     reproduce the real product chrome.
 *
 * A role without a demo of its own renders copy only, rather than borrowing a
 * screen that illustrates someone else's work.
 */
export default async function SolutionsPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const s = dict.solutions;
	const en = locale === "en";

	/** Which live screen belongs to which role, by index. */
	const demoForRole = (i: number) => {
		if (i === 0)
			return (
				<GradeEntryDemo
					locale={locale}
					caption={
						en
							? "Grade entry · change a mark, the weighted average follows."
							: "Saisie des notes · modifiez une note, la moyenne pondérée suit."
					}
				/>
			);
		if (i === 1)
			return (
				<DeliberationDemo
					locale={locale}
					caption={
						en
							? "Deliberation · move the rules, the cohort is re-decided."
							: "Délibération · déplacez les règles, la cohorte est réévaluée."
					}
				/>
			);
		return null;
	};

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			<PageHero
				eyebrow={s.label}
				image="/images/web/etudiante-livres-band.webp"
				imageAlt={
					en
						? "A student carrying her books"
						: "Une étudiante, ses livres à la main"
				}
				title={s.title}
				lede={s.sub}
			>
				{/* Jump links — the page is long and role-indexed. */}
				<nav
					className="mt-8 flex flex-wrap gap-2.5"
					aria-label={en ? "Roles" : "Rôles"}
				>
					{s.roles.map((role) => (
						<a
							key={role.role}
							href={`#${slug(role.role)}`}
							className="rounded-full border border-tk-border-strong bg-tk-surface px-3.5 py-1.5 font-body font-medium text-[length:var(--tk-text-sm)] text-tk-ink-2 no-underline transition-colors hover:border-tk-primary hover:text-tk-eyebrow"
						>
							{role.role}
						</a>
					))}
				</nav>
			</PageHero>

			{/* One chapter per role */}
			{s.roles.map((role, i) => {
				const demo = demoForRole(i);
				const alt = i % 2 === 1;
				return (
					<section
						key={role.role}
						id={slug(role.role)}
						className={`scroll-mt-[calc(var(--tk-header-h)+1rem)] border-tk-border border-b ${
							alt ? "bg-tk-bg-deep" : "bg-tk-bg"
						}`}
					>
						<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
							{/*
							 * The copy sits in two columns; the demo gets the full width
							 * underneath, on its own line.
							 *
							 * It used to share a row with the text, which squeezed the
							 * application frame into a ~26rem column — far too narrow for a
							 * screen that carries a sidebar, three counters and a roster, and
							 * the labels inside it collided. Giving it the whole line lets it
							 * render at the width it was designed for.
							 *
							 * `min-w-0` stays load-bearing: a grid track is `minmax(auto, …)`
							 * by default, so a wide table would otherwise push the column
							 * past the viewport instead of scrolling inside its own box.
							 */}
							<div className="grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start">
								<div className="min-w-0">
									<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
										{role.role}
									</p>
									<h2 className="mt-4 max-w-[20ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.6vw,2.2rem)] text-tk-title leading-[1.1] tracking-[-0.03em]">
										{role.title}
									</h2>

									{/* The pain, set as the quotation it is. */}
									<p className="mt-5 border-tk-primary border-l-[3px] pl-4 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 italic leading-relaxed">
										{role.pain}
									</p>

									<p className="mt-5 max-w-[50ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
										{role.desc}
									</p>
								</div>

								{/* Second column: what the role gets, as a checklist. */}
								<ul className="grid min-w-0 gap-2.5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-1 xl:grid-cols-2">
									{role.points.map((point) => (
										<li key={point} className="flex gap-2.5">
											<span
												aria-hidden="true"
												className="mt-[0.55rem] h-1.5 w-1.5 flex-none rounded-full bg-tk-primary"
											/>
											<span className="font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
												{point}
											</span>
										</li>
									))}
								</ul>
							</div>

							{/* The screen, full width, on its own line. */}
							{demo ? <div className="mt-12 min-w-0">{demo}</div> : null}
						</div>
					</section>
				);
			})}

			{/*
			 * Closes the four role chapters before the pioneer section. Each role
			 * above is a desk; this is what all four of them are working towards.
			 */}
			<PhotoBand
				src="/images/web/diplomees-band.webp"
				alt={
					en
						? "Two graduates embracing after the ceremony"
						: "Deux diplômées s'étreignant après la cérémonie"
				}
				caption={
					en
						? "Four desks, one year, one outcome."
						: "Quatre bureaux, une année, un même aboutissement."
				}
				align="right"
			/>
			{/* Pioneer programme — honest proof in place of invented testimonials */}
			<section className="relative overflow-hidden bg-tk-dark text-tk-on-dark">
				<div
					aria-hidden="true"
					className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
				/>
				<div className="relative mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-14">
						<div>
							<p className="font-code text-[length:var(--tk-text-xs)] text-tk-primary-bright uppercase tracking-[0.16em]">
								{en ? "Pioneer programme" : "Programme pionniers"}
							</p>
							<h2 className="tk-headline mt-4 max-w-[22ch]">
								{en
									? "Built with institutions, not for them."
									: "Construit avec les établissements, pas pour eux."}
							</h2>
							<p className="mt-4 max-w-[56ch] font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft leading-relaxed">
								{en
									? "TKAMS is developed in direct contact with LMD institutions in francophone Africa, on their real deliberation rules. Early signatories get a 10 % discount, priority handling, and their field requests go to the head of the roadmap."
									: "TKAMS est développé au contact direct des institutions LMD d'Afrique francophone, sur leurs règles de délibération réelles. Les premiers signataires bénéficient de 10 % de remise, d'un traitement prioritaire, et leurs demandes d'évolution passent en tête de feuille de route."}
							</p>
							<p className="mt-4 max-w-[56ch] font-body text-[length:var(--tk-text-sm)] text-tk-on-dark-muted leading-relaxed">
								{en
									? "We publish no client testimonials for now, because we would rather name no one than invent someone."
									: "Nous ne publions pas encore de témoignages clients : nous préférons ne citer personne plutôt que d'inventer quelqu'un."}
							</p>
						</div>

						<div className="flex flex-wrap gap-3">
							<Link
								href="/contact"
								className="rounded-md bg-tk-primary px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-primary transition-colors hover:bg-tk-primary-bright hover:text-tk-dark"
							>
								{en ? "Join the programme" : "Rejoindre le programme"}
							</Link>
							<Link
								href="/engagements"
								className="rounded-md border border-white/30 px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-dark transition-colors hover:bg-white/10"
							>
								{en ? "Our commitments" : "Nos engagements"}
							</Link>
						</div>
					</div>
				</div>
			</section>

			<Cta dict={dict} />
		</main>
	);
}

/**
 * Accent-insensitive anchor id: "Doyens & Direction des études" becomes
 * "doyens-direction-des-etudes".
 *
 * The combining-marks range is written as an escape rather than as literal
 * diacritics, which are invisible in source and easy to mangle on edit.
 */
function slug(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const s = getDict(locale).solutions;
	return {
		title: `${s.title} — TKAMS`,
		description: s.sub,
		// Mirrors this page's own title and description, so sharing /solutions
		// does not show the home page's text and image.
		openGraph: mergeOpenGraph({
			title: `${s.title} — TKAMS`,
			description: s.sub,
		}),
	};
}
