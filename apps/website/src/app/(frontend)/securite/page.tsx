import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import { DomainDemo } from "@/marketing/DomainDemo";
import { PageHero } from "@/marketing/PageHero";
import { Cta } from "@/marketing/sections/Cta";
import {
	AUDIT_TRAILS,
	DEPLOYMENT_NOTE,
	ROLES,
	SECURITY_ITEMS,
} from "@/marketing/security-2026";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

/**
 * Security and governance — the page for the two readers nobody writes for.
 *
 * Every other page on this site addresses a buyer. This one addresses the IT
 * lead who has to approve the tool and the supervising body that may one day
 * audit it. Both ask the same three questions, in this order: who can see
 * what, what is written down when something changes, and how do I get my data
 * out. The page answers them in that order and stops.
 *
 * The approvals demo sits in the audit chapter deliberately: an approval queue
 * is the one place where the access model becomes visible as behaviour rather
 * than as a table of roles.
 */
export default async function SecuritePage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const en = locale === "en";

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			<PageHero
				eyebrow={en ? "Security & governance" : "Sécurité & gouvernance"}
				image="/images/web/etudiant-lecture-band.webp"
				imageAlt={
					en
						? "A student reading in a university library"
						: "Un étudiant en lecture dans une bibliothèque universitaire"
				}
				title={
					en
						? "Who sees what, what gets written down, and how you leave."
						: "Qui voit quoi, ce qui est consigné, et comment vous partez."
				}
				lede={
					en
						? "Written for the IT lead who has to approve this tool and the supervising body that may audit it. Three questions, answered in the order they are usually asked."
						: "Écrit pour le responsable informatique qui doit valider cet outil et la tutelle qui peut le contrôler. Trois questions, dans l'ordre où elles se posent."
				}
			/>

			{/* 01 — Roles */}
			<section
				id="roles"
				className="scroll-mt-[calc(var(--tk-header-h)+1rem)] border-tk-border border-b bg-tk-bg-deep"
			>
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="lg:sticky lg:top-28">
								<span className="font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
									01
								</span>
								<h2 className="mt-3 max-w-[16ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
									{en ? "Who sees what" : "Qui voit quoi"}
								</h2>
								<p className="mt-4 max-w-[38ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
									{en
										? "Eight roles, each inheriting the ones below it. A dean passes every teacher check; a teacher passes none of a dean's. Permissions are computed per request, never assumed from a menu."
										: "Huit rôles, chacun héritant des précédents. Un doyen satisfait tous les contrôles d'un enseignant ; l'inverse est faux. Les droits sont calculés à chaque requête, jamais déduits d'un menu."}
								</p>
							</div>
						</div>

						<div className="min-w-0 lg:col-span-8">
							<ul className="m-0 list-none p-0">
								{ROLES.map((r, i) => {
									const c = en ? r.en : r.fr;
									return (
										<li
											key={c.name}
											className="flex items-baseline gap-5 border-tk-border border-t py-4 last:border-b"
										>
											<span className="w-6 shrink-0 font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
												{String(i + 1).padStart(2, "0")}
											</span>
											<div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-6">
												<p className="font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink tracking-[-0.02em] sm:w-[13rem] sm:shrink-0">
													{c.name}
												</p>
												<p className="mt-1 max-w-[46ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.6] sm:mt-0">
													{c.scope}
												</p>
											</div>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* 02 — Audit */}
			<section
				id="audit"
				className="scroll-mt-[calc(var(--tk-header-h)+1rem)] border-tk-border border-b bg-tk-bg"
			>
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="lg:sticky lg:top-28">
								<span className="font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
									02
								</span>
								<h2 className="mt-3 max-w-[16ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
									{en ? "What gets written down" : "Ce qui est consigné"}
								</h2>
								<p className="mt-4 max-w-[38ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
									{en
										? "Seven separate trails, each recording the action, its author and its timestamp. They are not a single log to sift: each answers one class of question a controller actually asks."
										: "Sept journaux distincts, portant chacun l'action, son auteur et son horodatage. Ce n'est pas un journal unique à éplucher : chacun répond à une question que pose un contrôleur."}
								</p>
							</div>
						</div>

						<div className="min-w-0 lg:col-span-8">
							<ul className="m-0 list-none p-0">
								{AUDIT_TRAILS.map((t) => {
									const c = en ? t.en : t.fr;
									return (
										<li
											key={c.what}
											className="flex items-start gap-3.5 border-tk-border border-t py-4 last:border-b"
										>
											<span
												aria-hidden="true"
												className="mt-[0.55rem] h-1.5 w-1.5 flex-none rounded-full bg-tk-primary"
											/>
											<div className="min-w-0">
												<p className="font-bold font-display text-[length:var(--tk-text-body)] text-tk-ink tracking-[-0.02em]">
													{c.what}
												</p>
												<p className="mt-1 max-w-[56ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.6]">
													{c.detail}
												</p>
											</div>
										</li>
									);
								})}
							</ul>

							<div className="mt-10 min-w-0">
								<DomainDemo which="approvals" dict={dict} />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 03 — Guarantees grid */}
			<section
				id="garanties"
				className="scroll-mt-[calc(var(--tk-header-h)+1rem)] border-tk-border border-b bg-tk-bg-deep"
			>
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<span className="font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
						03
					</span>
					<h2 className="tk-headline tk-gradient-text mt-3 max-w-[24ch]">
						{en
							? "The properties your IT team will ask about."
							: "Les propriétés que votre équipe informatique va demander."}
					</h2>

					<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{SECURITY_ITEMS.map((item) => {
							const c = en ? item.en : item.fr;
							return (
								<div
									key={c.title}
									className="rounded-xl border border-tk-border bg-tk-surface p-6"
								>
									<h3 className="font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink leading-snug tracking-[-0.02em]">
										{c.title}
									</h3>
									<p className="mt-3 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.65]">
										{c.desc}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Hosting note */}
			<section className="relative overflow-hidden bg-tk-dark text-tk-on-dark">
				<div
					aria-hidden="true"
					className="tk-field-weave--on-dark pointer-events-none absolute inset-0 opacity-60"
				/>
				<div className="tk-section relative mx-auto max-w-[86rem] px-6 lg:px-10">
					<div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<p className="font-code text-[length:var(--tk-text-xs)] text-tk-on-dark-muted uppercase tracking-[0.16em]">
								{en ? "Said precisely" : "Dit avec précision"}
							</p>
							<h2 className="tk-headline mt-4 max-w-[20ch]">
								{en
									? "What depends on hosting, not on the software."
									: "Ce qui dépend de l'hébergement, pas du logiciel."}
							</h2>
						</div>
						<div className="lg:col-span-7">
							<p className="max-w-[62ch] font-body text-[length:var(--tk-text-lead)] text-tk-on-dark-soft leading-[1.75]">
								{en ? DEPLOYMENT_NOTE.en : DEPLOYMENT_NOTE.fr}
							</p>
							<p className="mt-8 font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft">
								{en
									? "Full written commitments — support times, reversibility, contract clauses — are on the "
									: "Les engagements écrits — délais de support, réversibilité, clauses — figurent sur la page "}
								<Link
									href="/engagements"
									className="font-semibold text-tk-on-dark underline underline-offset-4"
								>
									{en ? "commitments page" : "Engagements"}
								</Link>
								.
							</p>
						</div>
					</div>
				</div>
			</section>

			<Cta dict={dict} />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const en = locale === "en";

	return {
		title: en
			? "Security & governance — TKAMS"
			: "Sécurité & gouvernance — TKAMS",
		description: en
			? "Access control across eight roles, seven audit trails, per-institution isolation, reversible bulk operations and full data export. Written for IT leads and supervising bodies."
			: "Contrôle d'accès sur huit rôles, sept journaux d'audit, cloisonnement par établissement, traitements en masse réversibles et export complet. Écrit pour les DSI et les tutelles.",
		// Mirrors this page's own title and description. Without it every
		// page inherited the site-wide default, so sharing /tarifs showed
		// the home page's text and image.
		openGraph: mergeOpenGraph({
			title: en
				? "Security & governance — TKAMS"
				: "Sécurité & gouvernance — TKAMS",
			description: en
				? "Access control across eight roles, seven audit trails, per-institution isolation, reversible bulk operations and full data export. Written for IT leads and supervising bodies."
				: "Contrôle d'accès sur huit rôles, sept journaux d'audit, cloisonnement par établissement, traitements en masse réversibles et export complet. Écrit pour les DSI et les tutelles.",
		}),
	};
}
