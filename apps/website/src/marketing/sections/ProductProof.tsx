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
 */
export function ProductProof({ locale }: { locale: Locale }) {
	const en = locale === "en";

	return (
		<section id="produit" className="relative overflow-hidden bg-tk-bg-deep">
			<div
				aria-hidden="true"
				className="tk-field-weave pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_top,#000,transparent_70%)]"
			/>

			<div className="relative mx-auto max-w-[86rem] px-6 py-16 lg:px-10 lg:py-24">
				<div className="max-w-[48rem]">
					<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
						{en ? "Live demonstration" : "Démonstration en direct"}
					</p>
					<h2 className="mt-4 font-display font-extrabold text-[clamp(1.75rem,1.1rem+2.2vw,2.75rem)] text-tk-title leading-[1.06] tracking-[-0.032em]">
						{en
							? "Move the jury's rules. Watch the cohort follow."
							: "Déplacez les règles du jury. La cohorte suit."}
					</h2>
					<p className="mt-4 font-body text-[1rem] text-tk-ink-2 leading-relaxed">
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
