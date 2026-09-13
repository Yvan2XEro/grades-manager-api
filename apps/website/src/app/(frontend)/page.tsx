import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { Cta } from "@/marketing/sections/Cta";
import { Deployment } from "@/marketing/sections/Deployment";
import { Domains } from "@/marketing/sections/Domains";
import { Faq } from "@/marketing/sections/Faq";
import { HomeHero } from "@/marketing/sections/HomeHero";
import { PhotoBand } from "@/marketing/sections/PhotoBand";
import { ProductProof } from "@/marketing/sections/ProductProof";
import { TheCost } from "@/marketing/sections/TheCost";
import { Transparency } from "@/marketing/sections/Transparency";
import { Trust } from "@/marketing/sections/Trust";
import { TwoSolutions } from "@/marketing/sections/TwoSolutions";
import { Workflow } from "@/marketing/sections/Workflow";

/**
 * Home.
 *
 * The order follows the commercial proposal's own argument, because that
 * document is a far better sales narrative than the site ever had:
 *
 *   1. Hero + estimator   — what will this cost me? (answered on first drag)
 *   2. The cost           — what does doing nothing already cost me?
 *   3. Two solutions      — urgent answer vs structural investment
 *   4. Domains            — what the platform covers
 *   5. Product proof      — the software, operable, right here
 *   6. Workflow           — how a year runs through it
 *   7. Transparency       — what is NOT included, and what we guarantee
 *   8. Deployment / Trust / FAQ / CTA
 *
 * `Stats`, `Features` and `Pricing` were dropped from this page: the figures
 * they carried are now inside the estimator and the cost section, the four
 * "differentiators" are stated by the domain grid and the live demos, and the
 * pricing table belongs on /tarifs where every line can be explained properly.
 */
export default async function HomePage() {
	const locale = await getLocale();
	const dict = getDict(locale);

	return (
		/*
		 * The dot grid runs continuously behind the whole page rather than being
		 * applied per section. That is what lets every section share one white
		 * ground without the page reading as empty — the texture does the work the
		 * background alternation and the section borders were failing to do.
		 */
		<main className="tk-dotgrid bg-tk-bg">
			<HomeHero dict={dict} locale={locale} />

			<TheCost locale={locale} />
			<TwoSolutions locale={locale} />

			{/*
			 * First interlude — closes the "what it costs you" argument and opens
			 * the product itself. Without it the page runs from the hero to the
			 * demos through four sections of type and flat colour.
			 */}
			<PhotoBand
				src="/images/web/amphitheatre-band.webp"
				alt={
					locale === "en"
						? "A student studying in a lecture hall"
						: "Une étudiante en train de travailler dans un amphithéâtre"
				}
				caption={
					locale === "en"
						? "The rules the platform applies are the ones your own regulations already set."
						: "Les règles que la plateforme applique sont celles que votre règlement fixe déjà."
				}
			/>

			<Domains dict={dict} locale={locale} />

			<ProductProof locale={locale} />
			<Workflow dict={dict} locale={locale} />

			{/*
			 * Second interlude — between how a year runs and what we refuse to
			 * promise, which is the page's most demanding passage of reading.
			 */}
			<PhotoBand
				src="/images/web/diplomation-band.webp"
				alt={
					locale === "en"
						? "Graduates celebrating at a degree ceremony"
						: "Des diplômés lors d'une cérémonie de remise"
				}
				caption={
					locale === "en"
						? "Every rule, every mark and every signature leads here."
						: "Chaque règle, chaque note et chaque signature mènent ici."
				}
				align="right"
			/>

			<Transparency locale={locale} />

			{/*
			 * Third interlude — after the exclusions, before the practical chapters.
			 * The page has just spent a long dark section saying what it will not
			 * do; this is the beat that returns it to the people it is for.
			 */}
			<PhotoBand
				src="/images/web/campus-groupe-band.webp"
				alt={
					locale === "en"
						? "Students working together in a university yard"
						: "Des étudiants travaillant ensemble dans une cour d'université"
				}
				caption={
					locale === "en"
						? "Built with the institutions that use it, on their own rules."
						: "Construit avec les établissements qui l'utilisent, sur leurs propres règles."
				}
				attribution={
					locale === "en" ? "Douala · Cameroon" : "Douala · Cameroun"
				}
			/>

			<Deployment dict={dict} />
			<Trust dict={dict} locale={locale} />
			<Faq dict={dict} />
			<Cta dict={dict} />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const dict = getDict(await getLocale());
	const title = `TKAMS — ${dict.secondary.higher_title} · ${dict.secondary.secondary_title}`;
	return {
		title,
		description: dict.secondary.intro,
		openGraph: {
			title,
			description: dict.secondary.intro,
			type: "website",
			siteName: "TKAMS",
			images: [{ url: "/og-tkams.png", width: 1200, height: 630 }],
		},
	};
}
