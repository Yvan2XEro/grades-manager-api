import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import { PageHero } from "@/marketing/PageHero";
import { Cta } from "@/marketing/sections/Cta";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

/**
 * Integrations — the interoperability argument, which the site never made.
 *
 * The functional audit flagged this as the largest under-sold asset in the
 * product: a documented external API with hashed keys, signed webhooks and
 * per-key usage statistics, plus Excel/YAML ingestion for every structural
 * entity. An institution that already runs something — a document generator, a
 * finance tool, a ministry portal — reads "closed platform" into silence.
 *
 * The endpoint list is real and was read off `apps/server/src/index.ts`. It is
 * shown as a table rather than prose because the reader for this page scans
 * for the resource they need and leaves.
 */

const ENDPOINTS = [
	{
		method: "GET",
		path: "/deliberations",
		fr: "Liste paginée des délibérations",
		en: "Paginated list of deliberations",
	},
	{
		method: "GET",
		path: "/deliberations/:id",
		fr: "Export complet d'une délibération",
		en: "Full export of one deliberation",
	},
	{
		method: "GET",
		path: "/deliberations/:id/status",
		fr: "État d'avancement d'une délibération",
		en: "Progress state of a deliberation",
	},
	{
		method: "GET",
		path: "/deliberations/:id/transcript",
		fr: "Relevés issus d'une délibération",
		en: "Transcripts from a deliberation",
	},
	{
		method: "GET",
		path: "/transcripts/class/:classId",
		fr: "Relevés d'une classe, par semestre",
		en: "Transcripts for a class, by semester",
	},
	{
		method: "GET",
		path: "/config",
		fr: "Établissement, filières et années — pour auto-configurer le client",
		en: "Institution, programmes and years — to self-configure the client",
	},
	{
		method: "GET",
		path: "/classes",
		fr: "Classes disponibles",
		en: "Available classes",
	},
	{
		method: "GET",
		path: "/logo",
		fr: "Logo de l'établissement, de la tutelle ou de la tutelle supérieure",
		en: "Logo of the institution, its parent or its grandparent",
	},
	{
		method: "POST",
		path: "/documents",
		fr: "Journalisation d'un document généré côté client",
		en: "Log a document generated on the client side",
	},
] as const;

const IMPORTS = [
	{
		fr: {
			what: "Structure académique",
			detail: "Filières, cycles, niveaux, UE, EC, crédits, coefficients",
		},
		en: {
			what: "Academic structure",
			detail:
				"Programmes, cycles, levels, units, components, credits, coefficients",
		},
	},
	{
		fr: {
			what: "Personnes",
			detail: "Étudiants, enseignants, personnels et leurs profils",
		},
		en: {
			what: "People",
			detail: "Students, teachers, staff and their profiles",
		},
	},
	{
		fr: {
			what: "Inscriptions",
			detail: "Affectation en classe et en cours, par année",
		},
		en: { what: "Enrolments", detail: "Class and course assignment, per year" },
	},
	{
		fr: { what: "Notes", detail: "Reprise de notes existantes, en masse" },
		en: { what: "Marks", detail: "Bulk load of existing marks" },
	},
	{
		fr: {
			what: "Relevés bancaires",
			detail: "Rapprochement des encaissements",
		},
		en: {
			what: "Bank statements",
			detail: "Reconciliation of incoming payments",
		},
	},
	{
		fr: {
			what: "Emplois du temps",
			detail: "Import en masse et recopie d'une année sur l'autre",
		},
		en: { what: "Timetables", detail: "Bulk import and year-to-year copy" },
	},
] as const;

export default async function IntegrationsPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const en = locale === "en";

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			<PageHero
				eyebrow={en ? "Integrations & data" : "Intégrations & données"}
				image="/images/web/amphitheatre-band.webp"
				imageAlt={
					en
						? "A lecture hall during a class"
						: "Un amphithéâtre pendant un cours"
				}
				title={
					en
						? "Your data comes in. Your data goes out."
						: "Vos données entrent. Vos données ressortent."
				}
				lede={
					en
						? "An institution already runs tools it intends to keep. TKAMS ingests what you have in Excel or YAML, and exposes what it produces through a documented API with signed webhooks."
						: "Un établissement fait déjà tourner des outils qu'il compte garder. TKAMS ingère ce que vous avez en Excel ou YAML, et expose ce qu'il produit par une API documentée à webhooks signés."
				}
			/>

			{/* 01 — Imports */}
			<section
				id="imports"
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
									{en ? "What comes in" : "Ce qui entre"}
								</h2>
								<p className="mt-4 max-w-[38ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
									{en
										? "Six kinds of import, in Excel or YAML, each with a downloadable template and a preview of exactly what will be written before anything is."
										: "Six types d'import, en Excel ou YAML, chacun avec un gabarit téléchargeable et une prévisualisation de ce qui sera écrit, avant que rien ne le soit."}
								</p>
							</div>
						</div>

						<div className="min-w-0 lg:col-span-8">
							<ul className="m-0 list-none p-0">
								{IMPORTS.map((imp) => {
									const c = en ? imp.en : imp.fr;
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

							<p className="mt-8 max-w-[58ch] font-body text-[length:var(--tk-text-body)] text-tk-muted leading-[1.65]">
								{en
									? "Every import runs as a batch job: preview first, step-by-step progress while it runs, and a roll back afterwards if the result is not what you expected."
									: "Chaque import s'exécute comme un traitement par lots : prévisualisation d'abord, avancement pas à pas pendant l'exécution, et annulation après coup si le résultat ne convient pas."}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* 02 — API */}
			<section
				id="api"
				className="scroll-mt-[calc(var(--tk-header-h)+1rem)] border-tk-border border-b bg-tk-bg"
			>
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<span className="font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
						02
					</span>
					<h2 className="tk-headline tk-gradient-text mt-3 max-w-[24ch]">
						{en ? "What goes out — the API" : "Ce qui sort — l'API"}
					</h2>
					<p className="mt-4 max-w-[58ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed">
						{en
							? "Nine endpoints, authenticated by an API key sent as a header. Keys are stored hashed, revocable at any moment, and each one carries its own usage statistics."
							: "Neuf points d'entrée, authentifiés par une clé d'API passée en en-tête. Les clés sont stockées hachées, révocables à tout instant, et chacune porte ses propres statistiques d'usage."}
					</p>

					<div className="mt-10 overflow-x-auto">
						<table className="w-full min-w-[38rem] border-collapse text-left">
							<thead>
								<tr className="border-tk-border-strong border-b">
									<th className="py-3 pr-4 font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
										{en ? "Method" : "Méthode"}
									</th>
									<th className="py-3 pr-4 font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
										{en ? "Resource" : "Ressource"}
									</th>
									<th className="py-3 font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
										{en ? "Returns" : "Retourne"}
									</th>
								</tr>
							</thead>
							<tbody>
								{ENDPOINTS.map((e) => (
									<tr key={e.path} className="border-tk-border border-b">
										<td className="py-3.5 pr-4 align-top">
											<span
												className={`inline-block rounded px-2 py-0.5 font-code font-medium text-[length:var(--tk-text-xs)] ${
													e.method === "POST"
														? "bg-tk-primary-soft text-tk-primary-deep"
														: "bg-tk-bg-deep text-tk-ink-2"
												}`}
											>
												{e.method}
											</span>
										</td>
										<td className="py-3.5 pr-4 align-top font-code text-[length:var(--tk-text-sm)] text-tk-ink">
											{e.path}
										</td>
										<td className="py-3.5 align-top font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.6]">
											{en ? e.en : e.fr}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* 03 — Webhooks */}
			<section
				id="webhooks"
				className="scroll-mt-[calc(var(--tk-header-h)+1rem)] border-tk-border border-b bg-tk-bg-deep"
			>
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<span className="font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
								03
							</span>
							<h2 className="mt-3 max-w-[18ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
								{en
									? "Events, pushed to you"
									: "Des événements, poussés vers vous"}
							</h2>
							<p className="mt-4 max-w-[42ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
								{en
									? "Rather than polling, register a URL and receive the event when it happens. Each delivery carries an HMAC-SHA256 signature computed with your own secret, so you can verify the payload came from us."
									: "Plutôt que d'interroger en boucle, déclarez une URL et recevez l'événement quand il se produit. Chaque envoi porte une signature HMAC-SHA256 calculée avec votre secret, vérifiable de votre côté."}
							</p>
						</div>

						<div className="lg:col-span-7">
							<div className="grid gap-5 sm:grid-cols-2">
								<div className="rounded-xl border border-tk-border bg-tk-surface p-6">
									<p className="font-code text-[length:var(--tk-text-sm)] text-tk-primary-deep">
										deliberation.signed
									</p>
									<p className="mt-3 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.65]">
										{en
											? "A deliberation has been signed off. Carries the deliberation reference, so the receiving system can pull the full export."
											: "Une délibération vient d'être signée. Porte sa référence, pour que le système récepteur en tire l'export complet."}
									</p>
								</div>
								<div className="rounded-xl border border-tk-border bg-tk-surface p-6">
									<p className="font-code text-[length:var(--tk-text-sm)] text-tk-primary-deep">
										semester.grades_locked
									</p>
									<p className="mt-3 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.65]">
										{en
											? "Every mark for a semester is locked and final. The signal that downstream document production can begin."
											: "Toutes les notes d'un semestre sont verrouillées et définitives. Le signal que la production de documents peut commencer."}
									</p>
								</div>
							</div>

							<p className="mt-6 max-w-[58ch] font-body text-[length:var(--tk-text-body)] text-tk-muted leading-[1.65]">
								{en
									? "Delivery is fire-and-forget: a webhook that fails is logged, but it never rolls back the academic transaction that triggered it. Do not treat delivery as confirmation."
									: "L'envoi est non bloquant : un webhook en échec est journalisé, mais il n'annule jamais l'opération académique qui l'a déclenché. Ne considérez pas la réception comme une confirmation."}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* OnReceipt bridge */}
			<section className="relative overflow-hidden bg-tk-dark text-tk-on-dark">
				<div
					aria-hidden="true"
					className="tk-field-weave--on-dark pointer-events-none absolute inset-0 opacity-60"
				/>
				<div className="tk-section relative mx-auto max-w-[86rem] px-6 lg:px-10">
					<div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<p className="font-code text-[length:var(--tk-text-xs)] text-tk-on-dark-muted uppercase tracking-[0.16em]">
								{en ? "The ecosystem" : "L'écosystème"}
							</p>
							<h2 className="tk-headline mt-4 max-w-[20ch]">
								{en
									? "TKAMS produces the data. OnReceipt prints it."
									: "TKAMS produit la donnée. OnReceipt l'imprime."}
							</h2>
						</div>
						<div className="lg:col-span-7">
							<p className="max-w-[62ch] font-body text-[length:var(--tk-text-lead)] text-tk-on-dark-soft leading-[1.75]">
								{en
									? "The desktop document generator reads this same API: it self-configures from /config, pulls institution logos at the right level of the supervision chain, and logs every document it produces back into TKAMS. An establishment running both never keys a transcript twice."
									: "Le générateur de documents de bureau consomme cette même API : il s'auto-configure depuis /config, récupère les logos au bon niveau de la chaîne de tutelle, et journalise dans TKAMS chaque document produit. Un établissement qui exploite les deux ne saisit jamais deux fois un relevé."}
							</p>
							<div className="mt-8 flex flex-wrap gap-3">
								<Link href="/onreceipt" className="tk-btn-ghost">
									{en ? "See OnReceipt" : "Voir OnReceipt"}
								</Link>
								<Link href="/comparatif" className="tk-btn-ghost">
									{en ? "Compare the two" : "Comparer les deux"}
								</Link>
							</div>
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
			? "Integrations & data — TKAMS"
			: "Intégrations & données — TKAMS",
		description: en
			? "Excel and YAML import for six kinds of data, a nine-endpoint external API with hashed keys, and HMAC-signed webhooks. How TKAMS connects to what you already run."
			: "Import Excel et YAML sur six types de données, une API externe à neuf points d'entrée à clés hachées, et des webhooks signés HMAC. Comment TKAMS se connecte à ce que vous exploitez déjà.",
		// Mirrors this page's own title and description. Without it every
		// page inherited the site-wide default, so sharing /tarifs showed
		// the home page's text and image.
		openGraph: mergeOpenGraph({
			title: en
				? "Integrations & data — TKAMS"
				: "Intégrations & données — TKAMS",
			description: en
				? "Excel and YAML import for six kinds of data, a nine-endpoint external API with hashed keys, and HMAC-signed webhooks. How TKAMS connects to what you already run."
				: "Import Excel et YAML sur six types de données, une API externe à neuf points d'entrée à clés hachées, et des webhooks signés HMAC. Comment TKAMS se connecte à ce que vous exploitez déjà.",
		}),
	};
}
