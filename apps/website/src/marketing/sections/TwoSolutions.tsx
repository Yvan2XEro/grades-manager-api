import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n";
import { fcfa } from "../pricing-2026";

/**
 * The two solutions (proposal p. 04).
 *
 * OverBrand sells an urgent answer and a structural one, and the proposal is
 * unusually direct about which is which — it even says outright when the
 * cheaper product is the better buy. Reproducing that candour on the public
 * site is the point: an establishment under a compliance deadline next month
 * needs OnReceipt, not a six-week platform migration, and saying so is what
 * makes the TKAMS recommendation credible when it comes.
 *
 * TKAMS is presented as the recommended, structural choice; OnReceipt as the
 * entry door. Neither requires the other.
 */
export function TwoSolutions({ locale }: { locale: Locale }) {
	const en = locale === "en";

	return (
		<section className="bg-tk-bg-deep">
			<div className="mx-auto max-w-[86rem] px-6 py-16 lg:px-10 lg:py-24">
				<div className="max-w-[46rem]">
					<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
						{en ? "Two solutions" : "Les deux solutions"}
					</p>
					<h2 className="mt-4 font-display font-extrabold text-[clamp(1.75rem,1.1rem+2.2vw,2.75rem)] text-tk-title leading-[1.06] tracking-[-0.032em]">
						{en
							? "An urgent answer, and a structural investment."
							: "Une réponse d'urgence, un investissement structurel."}
					</h2>
					<p className="mt-4 font-body text-[1rem] text-tk-ink-2 leading-relaxed">
						{en
							? "Choose according to your deadline and your budget. They are sold separately; neither obliges you to take the other."
							: "Vous choisissez selon votre échéance et votre budget. Les deux se vendent séparément ; aucune n'oblige à souscrire l'autre."}
					</p>
				</div>

				<div className="mt-10 grid gap-5 lg:grid-cols-2">
					{/* OnReceipt */}
					<div className="flex flex-col overflow-hidden rounded-xl border border-tk-border bg-tk-bg-deep">
						<div className="flex-1 p-6 lg:p-8">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<Image
									src="/onreceipt/logo-onreceipt.png"
									alt="QR Code OnReceipt"
									width={256}
									height={256}
									className="size-11 object-contain"
								/>
								<span className="rounded-full border border-tk-border-strong bg-tk-surface px-3 py-1 font-body font-medium text-[0.72rem] text-tk-ink-2">
									{en ? "Urgent answer" : "Réponse d'urgence"}
								</span>
							</div>
							<h3 className="mt-5 font-bold font-display text-[1.4rem] text-tk-ink tracking-[-0.025em]">
								QR Code OnReceipt
							</h3>
							<p className="mt-3 max-w-[44ch] font-body text-[0.9375rem] text-tk-ink-2 leading-relaxed">
								{en
									? "Desktop software that produces compliant transcripts and certificates in batches, from an Excel file. Built to the document standards of state universities."
									: "Application de bureau qui produit en lot des relevés et attestations conformes aux standards des universités d'État, à partir d'un fichier Excel."}
							</p>

							<dl className="mt-7 grid grid-cols-2 gap-5">
								<div>
									<dt className="font-code text-[0.62rem] text-tk-muted uppercase tracking-[0.12em]">
										{en ? "Go-live" : "Mise en service"}
									</dt>
									<dd className="mt-1 font-bold font-display text-[1.05rem] text-tk-ink">
										{en ? "Same day to 48 h" : "Le jour même à 48 h"}
									</dd>
								</div>
								<div>
									<dt className="font-code text-[0.62rem] text-tk-muted uppercase tracking-[0.12em]">
										{en ? "Entry ticket" : "Ticket d'entrée"}
									</dt>
									<dd className="mt-1 font-bold font-display text-[1.05rem] text-tk-ink tabular-nums">
										{fcfa.format(130_000)} FCFA
									</dd>
								</div>
							</dl>
						</div>
						<div className="border-tk-border border-t px-6 py-4 lg:px-8">
							<Link
								href="/onreceipt"
								className="font-body font-semibold text-[0.9rem] text-tk-eyebrow underline-offset-4 hover:underline"
							>
								{en ? "Discover OnReceipt →" : "Découvrir OnReceipt →"}
							</Link>
						</div>
					</div>

					{/* TKAMS */}
					<div className="relative flex flex-col overflow-hidden rounded-xl bg-tk-primary-deep text-tk-on-primary">
						<div
							aria-hidden="true"
							className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
						/>
						<div className="relative flex-1 p-6 lg:p-8">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<span className="flex h-11 items-center rounded-lg bg-white px-2.5">
									<Image
										src="/logo-tkams.png"
										alt="TKAMS"
										width={775}
										height={200}
										className="h-5 w-auto object-contain"
									/>
								</span>
								<span className="rounded-full bg-tk-primary px-3 py-1 font-body font-medium text-[0.72rem] text-tk-on-primary">
									{en ? "Recommended — structural" : "Recommandé — structurel"}
								</span>
							</div>
							<h3 className="mt-5 font-bold font-display text-[1.4rem] tracking-[-0.025em]">
								TKAMS
							</h3>
							<p className="mt-3 max-w-[44ch] font-body text-[0.9375rem] text-tk-on-primary/85 leading-relaxed">
								{en
									? "Integrated LMD academic management platform: admissions, student records, fees, marks, deliberations, official documents. Managed cloud or your own servers."
									: "Plateforme intégrée de gestion académique LMD : admissions, scolarité, frais, notes, délibérations, documents officiels. Cloud managé ou vos serveurs."}
							</p>

							<dl className="mt-7 grid grid-cols-2 gap-5">
								<div>
									<dt className="font-code text-[0.62rem] text-tk-on-primary/75 uppercase tracking-[0.12em]">
										{en ? "Go-live" : "Mise en service"}
									</dt>
									<dd className="mt-1 font-bold font-display text-[1.05rem]">
										{en ? "2 to 6 weeks" : "2 à 6 semaines"}
									</dd>
								</div>
								<div>
									<dt className="font-code text-[0.62rem] text-tk-on-primary/75 uppercase tracking-[0.12em]">
										{en ? "Price" : "Prix"}
									</dt>
									<dd className="mt-1 font-bold font-display text-[1.05rem] tabular-nums">
										{fcfa.format(2_800)} F{" "}
										<span className="font-body font-normal text-[0.8rem] text-tk-on-primary/85">
											{en ? "/ student / year" : "/ étudiant / an"}
										</span>
									</dd>
								</div>
							</dl>
						</div>
						<div className="relative border-white/15 border-t px-6 py-4 lg:px-8">
							<Link
								href="/produit"
								className="font-body font-semibold text-[0.9rem] text-tk-primary-bright underline-offset-4 hover:underline"
							>
								{en ? "Explore TKAMS →" : "Explorer TKAMS →"}
							</Link>
						</div>
					</div>
				</div>

				{/* The recommendation, said plainly */}
				<div className="mt-6 grid gap-5 rounded-xl border border-tk-border bg-tk-primary-soft p-6 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:p-8">
					<div>
						<p className="font-body font-semibold text-[0.9rem] text-tk-primary-deep">
							{en
								? "Our recommendation, said plainly"
								: "Notre recommandation, dite franchement"}
						</p>
						<p className="mt-3 max-w-[62ch] font-body text-[0.9375rem] text-tk-ink-2 leading-relaxed">
							{en
								? "We recommend TKAMS, because it removes the cause and not only the symptom. OnReceipt is the right entry door if a compliance deadline is pressing — and the right permanent choice if your only need is producing compliant documents."
								: "Nous recommandons TKAMS, parce qu'il supprime la cause et pas seulement le symptôme. OnReceipt est la bonne porte d'entrée si une échéance de tutelle vous presse — et le bon choix définitif si votre seul besoin est de produire des documents conformes."}
						</p>
					</div>
					<Link
						href="/comparatif"
						className="inline-flex w-fit items-center rounded-md border border-tk-primary px-5 py-3 font-body font-semibold text-[0.9rem] text-tk-primary-deep transition-colors hover:bg-tk-primary hover:text-tk-on-primary"
					>
						{en
							? "Compare the twelve differences"
							: "Comparer les douze différences"}
					</Link>
				</div>
			</div>
		</section>
	);
}
