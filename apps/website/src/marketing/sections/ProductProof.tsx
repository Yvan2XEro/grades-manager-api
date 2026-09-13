import type { Locale } from "@/i18n";
import { DeliberationDemo } from "../app-demo/DeliberationDemo";
import { GradeEntryDemo } from "../app-demo/GradeEntryDemo";

/**
 * Product proof — the software, live and operable.
 *
 * These are not screenshots and not mockups: they reproduce the real product
 * chrome from `apps/web` (see `app-demo/shell.tsx` for the measurements) and
 * they respond to input. The visitor moves the jury's threshold and watches a
 * cohort be re-decided; that is the only honest way to demonstrate a rules
 * engine, and it is the claim the commercial proposal leads with.
 *
 * Screenshots were rejected deliberately: the seeded demo database holds two
 * students and no deliberation, the product chrome is still in English, and
 * unresolved i18n placeholders are visible on screen. A PNG would advertise an
 * unfinished product; this shows a working one.
 *
 * Two classes on the section carry its surface:
 *
 *   `tk-glow`    a wide, very diffuse wash of the brand violet behind the top
 *                of the section. It gives the product screen something to sit
 *                on without a border, a gradient bar or a pattern — none of
 *                which survive being looked at twice.
 *   `tk-dotgrid` repeated here rather than inherited. The page paints the grid
 *                once on <main>, but this section fills its own opaque ground
 *                and then draws the glow over it, so both hid the texture
 *                underneath.
 */
export function ProductProof({ locale }: { locale: Locale }) {
	const en = locale === "en";

	return (
		<section
			id="produit"
			className="tk-dotgrid tk-glow relative overflow-hidden bg-tk-bg-deep"
		>
			<div className="tk-section relative mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="max-w-[48rem]">
					<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
						{en ? "Live demonstration" : "Démonstration en direct"}
					</p>
					<h2 className="tk-headline tk-gradient-text mt-4">
						{en
							? "Move the jury's rules. Watch the cohort follow."
							: "Déplacez les règles du jury. La cohorte suit."}
					</h2>
					<p className="mt-4 font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed">
						{en
							? "This is the real interface, with demonstration data. Change a threshold and every file is re-decided instantly — no reload, no recalculation by hand."
							: "C'est l'interface réelle, avec des données de démonstration. Changez un seuil et chaque dossier est réévalué instantanément — sans rechargement, sans recalcul à la main."}
					</p>
				</div>

				<div className="mt-10">
					<DeliberationDemo
						locale={locale}
						caption={
							en
								? "Deliberation · move the threshold, the eliminating mark or compensation."
								: "Délibération · déplacez le seuil, la note éliminatoire ou la compensation."
						}
					/>
				</div>

				<div className="mt-14">
					<h3 className="max-w-[36rem] font-bold font-display text-[clamp(1.25rem,1rem+1vw,1.6rem)] text-tk-title leading-snug tracking-[-0.025em]">
						{en
							? "Upstream: the teacher enters marks, averages follow."
							: "En amont : l'enseignant saisit, les moyennes suivent."}
					</h3>
					<div className="mt-6">
						<GradeEntryDemo
							locale={locale}
							caption={
								en
									? "Grade entry · change a mark, the weighted average and the status recompute."
									: "Saisie des notes · modifiez une note, la moyenne pondérée et le statut se recalculent."
							}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
