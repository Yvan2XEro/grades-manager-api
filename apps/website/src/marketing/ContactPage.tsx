import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import Link from "next/link";
import type { Dict, Locale } from "@/i18n";
import { ContactFormDynamic } from "./ContactFormDynamic";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "./FloatingActions";
import { StaticContactForm } from "./StaticContactForm";

interface ContactPageProps {
	dict: Dict;
	locale: Locale;
	form?: FormType | null;
}

/**
 * Contact — rebuilt onto the current design language.
 *
 * The old page was the last one still written in the `Editorial` vocabulary
 * (`SectionLabel number="✶"`, `Rule`, `Lede`), which every redesigned page has
 * left behind. It also had a structural problem no amount of restyling fixes:
 * a two-column split where the left column held an email address, a city and
 * one small panel, so roughly half the viewport was empty while the form sat
 * alone on the right with nothing supporting it.
 *
 * The rebuild answers the three questions a director actually has with their
 * hand on the form, in the order they arrive:
 *
 *   1. Is this the right channel for me? — four routes, each with the address
 *      that handles it, so a support request or a press query does not go into
 *      the sales inbox and wait.
 *   2. What happens after I press send? — the first three rows of the
 *      deployment timeline the commercial proposal already commits to, so the
 *      form leads somewhere concrete rather than into silence.
 *   3. What is this going to cost me to find out? — nothing, and the demo
 *      section says so plainly.
 *
 * The form keeps both paths untouched: `ContactFormDynamic` when Payload
 * returns a form record, `StaticContactForm` as the fallback. Only the frame
 * around them changed.
 */

/** The routes, with the address that actually handles each one. */
const ROUTES = [
	{
		key: "demo",
		mail: "contact@tkams.com",
		fr: {
			title: "Voir le logiciel",
			desc: "Une heure, vos propres données, vos propres documents. Gratuit et sans engagement.",
		},
		en: {
			title: "See the software",
			desc: "One hour, your own data, your own documents. Free and with no commitment.",
		},
	},
	{
		key: "quote",
		mail: "contact@tkams.com",
		fr: {
			title: "Demander un devis",
			desc: "Communiquez votre effectif et vos filières : le montant se calcule ligne à ligne.",
		},
		en: {
			title: "Request a quote",
			desc: "Give us your student numbers and programmes: the amount is computed line by line.",
		},
	},
	{
		key: "support",
		mail: "contact@tkams.com",
		fr: {
			title: "Support client",
			desc: "Vous êtes déjà équipé. Réponse sous 2 jours ouvrés, 4 heures en support prioritaire.",
		},
		en: {
			title: "Customer support",
			desc: "You are already a customer. Reply within 2 business days, 4 hours on priority support.",
		},
	},
	{
		key: "onreceipt",
		mail: "cedrictefoye@gmail.com",
		fr: {
			title: "QR Code OnReceipt",
			desc: "Le générateur de documents de bureau est suivi par une équipe distincte.",
		},
		en: {
			title: "QR Code OnReceipt",
			desc: "The desktop document generator is handled by a separate team.",
		},
	},
] as const;

/** First three rows of TIMELINE, phrased from the visitor's side. */
const NEXT_STEPS = [
	{
		when: { fr: "Sous 24 h ouvrables", en: "Within 24 business hours" },
		what: {
			fr: "Nous répondons et proposons un créneau. Pas de séquence automatisée, pas de relance commerciale.",
			en: "We reply and propose a slot. No automated sequence, no sales follow-up.",
		},
	},
	{
		when: { fr: "Jour 0", en: "Day 0" },
		what: {
			fr: "Démonstration gratuite et cadrage : votre effectif réel, vos filières, vos échéances de tutelle.",
			en: "Free demonstration and scoping: your real numbers, your programmes, your supervisory deadlines.",
		},
	},
	{
		when: { fr: "Semaine 1", en: "Week 1" },
		what: {
			fr: "Devis nominatif reprenant exactement les lignes publiées. Rien ne vous engage avant signature.",
			en: "A named quote restating exactly the published lines. Nothing binds you before signature.",
		},
	},
] as const;

export function ContactPage({ dict: d, locale, form }: ContactPageProps) {
	const en = locale === "en";

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			{/*
			 * Masthead + form, side by side — the form is the point of the page, so
			 * this one keeps its two columns instead of taking the `PageHero` band:
			 * pushing the form below a photograph would bury the thing a visitor
			 * came here to use.
			 *
			 * It does take the rest of the language — the washes, the dot grid, the
			 * display scale — so it belongs to the same site.
			 */}
			<section className="relative overflow-hidden">
				<div
					aria-hidden="true"
					className="tk-wash tk-wash--primary -top-32 -left-24 h-[420px] w-[420px]"
				/>
				<div
					aria-hidden="true"
					className="tk-wash tk-wash--accent -right-28 top-4 h-[360px] w-[360px]"
				/>
				{/* `relative` lifts the content above the absolutely-placed washes. */}
				<div className="relative mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
								Contact
							</p>
							<h1 className="tk-display tk-gradient-text mt-4 max-w-[16ch]">
								{d.contact.title}
							</h1>
							<p className="mt-5 max-w-[46ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed">
								{d.contact.sub}
							</p>

							{/* Direct coordinates — for the visitor who will not fill a form */}
							<dl className="m-0 mt-10">
								<div className="border-tk-border border-t py-4">
									<dt className="font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
										{d.contact.info.email_label}
									</dt>
									<dd className="m-0 mt-1.5">
										<a
											href="mailto:contact@tkams.com"
											className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-primary-deep no-underline underline-offset-4 hover:underline"
										>
											contact@tkams.com
										</a>
									</dd>
								</div>
								<div className="border-tk-border border-t py-4">
									<dt className="font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
										{en ? "Phone & WhatsApp" : "Téléphone & WhatsApp"}
									</dt>
									<dd className="m-0 mt-1.5">
										{/*
										 * Same line the floating WhatsApp button dials — read from
										 * one constant so the two cannot drift apart.
										 */}
										<a
											href={`tel:+${WHATSAPP_NUMBER}`}
											className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-ink no-underline"
										>
											{WHATSAPP_DISPLAY}
										</a>
									</dd>
								</div>
								<div className="border-tk-border border-t border-b py-4">
									<dt className="font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
										{d.contact.info.location_label}
									</dt>
									<dd className="m-0 mt-1.5 font-body text-[length:var(--tk-text-body)] text-tk-ink">
										{d.contact.info.location}
									</dd>
								</div>
							</dl>
						</div>

						{/*
						 * The form itself.
						 *
						 * No card wrapper here on purpose: `ContactFormDynamic` and
						 * `StaticContactForm` each carry their own border and padding,
						 * and nesting them in a second card draws a double outline.
						 */}
						<div className="min-w-0 lg:col-span-7">
							{form ? (
								<ContactFormDynamic form={form} dict={d} />
							) : (
								<StaticContactForm dict={d} />
							)}
							<p className="mt-4 max-w-[52ch] font-body text-[length:var(--tk-text-sm)] text-tk-muted leading-[1.6]">
								{en
									? "Your details are used to answer you and for nothing else. They are never resold, and you can ask for them to be deleted at any time."
									: "Vos coordonnées servent à vous répondre, à rien d'autre. Elles ne sont jamais revendues, et vous pouvez en demander la suppression à tout moment."}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Routes — the right desk, first time */}
			<section className="bg-tk-bg-deep">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<h2 className="tk-headline tk-gradient-text max-w-[22ch]">
						{en ? "Who you will reach." : "Qui va vous répondre."}
					</h2>
					<p className="mt-4 max-w-[54ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
						{en
							? "Four reasons to write, so a support request does not queue behind a sales enquiry."
							: "Quatre raisons d'écrire, pour qu'une demande de support ne fasse pas la queue derrière une question commerciale."}
					</p>

					<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{ROUTES.map((r) => {
							const c = en ? r.en : r.fr;
							return (
								<div
									key={r.key}
									className="flex flex-col rounded-xl border border-tk-border bg-tk-surface p-6"
								>
									<h3 className="font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink leading-snug tracking-[-0.02em]">
										{c.title}
									</h3>
									<p className="mt-3 flex-1 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.65]">
										{c.desc}
									</p>
									<a
										href={`mailto:${r.mail}`}
										className="mt-4 break-all font-code text-[length:var(--tk-text-xs)] text-tk-primary-deep no-underline underline-offset-4 hover:underline"
									>
										{r.mail}
									</a>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* What happens next */}
			<section>
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="lg:sticky lg:top-28">
								<h2 className="tk-headline tk-gradient-text max-w-[16ch]">
									{en
										? "What happens after you press send."
										: "Ce qui se passe après l'envoi."}
								</h2>
								<p className="mt-4 max-w-[38ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
									{en
										? "The same three steps we commit to in writing in every proposal."
										: "Les trois mêmes étapes que nous engageons par écrit dans chaque proposition."}
								</p>

								{/*
								 * The sticky column is otherwise a heading and one line, which
								 * leaves a tall empty block beside the steps on desktop. This
								 * answers the objection a director raises at exactly this
								 * point — "and then I am stuck with you" — so the space earns
								 * its keep instead of being padded out.
								 */}
								<div className="mt-8 border-tk-primary border-l-2 pl-5">
									<p className="font-bold font-display text-[length:var(--tk-text-body)] text-tk-ink tracking-[-0.02em]">
										{en
											? "Nothing here commits you."
											: "Rien de tout cela ne vous engage."}
									</p>
									<p className="mt-2 max-w-[36ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.65]">
										{en
											? "The demonstration is free and unlimited. The quote is written before any work starts. No amount that is not on the pricing page can ever be invoiced to you without a signed amendment."
											: "La démonstration est gratuite et illimitée. Le devis est écrit avant tout travail. Aucun montant absent de la page tarifs ne pourra vous être facturé sans avenant signé."}
									</p>
								</div>
							</div>
						</div>

						<div className="min-w-0 lg:col-span-8">
							<ol className="m-0 list-none p-0">
								{NEXT_STEPS.map((s, i) => (
									<li
										key={s.when.en}
										className="flex items-start gap-5 border-tk-border border-t py-5 last:border-b"
									>
										<span className="w-6 shrink-0 pt-0.5 font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
											{String(i + 1).padStart(2, "0")}
										</span>
										<div className="min-w-0">
											<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.14em]">
												{en ? s.when.en : s.when.fr}
											</p>
											<p className="mt-2 max-w-[58ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.65]">
												{en ? s.what.en : s.what.fr}
											</p>
										</div>
									</li>
								))}
							</ol>

							<p className="mt-8 font-body text-[length:var(--tk-text-body)] text-tk-ink-2">
								{en
									? "Every amount and every commitment above is published: "
									: "Chaque montant et chaque engagement ci-dessus est publié : "}
								<Link
									href="/tarifs"
									className="font-semibold text-tk-primary-deep underline underline-offset-4"
								>
									{en ? "pricing" : "les tarifs"}
								</Link>
								{en ? " and " : " et "}
								<Link
									href="/engagements"
									className="font-semibold text-tk-primary-deep underline underline-offset-4"
								>
									{en ? "commitments" : "les engagements"}
								</Link>
								.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pioneers — the one offer worth a dark chapter */}
			<section className="relative overflow-hidden bg-tk-dark text-tk-on-dark">
				<div
					aria-hidden="true"
					className="tk-field-weave--on-dark pointer-events-none absolute inset-0 opacity-60"
				/>
				<div className="relative mx-auto max-w-[86rem] px-6 py-16 lg:px-10 lg:py-24">
					<div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<p className="font-code text-[length:var(--tk-text-xs)] text-tk-on-dark-muted uppercase tracking-[0.16em]">
								{en ? "Pioneer programme" : "Programme pionniers"}
							</p>
							<h2 className="tk-headline mt-4 max-w-[18ch]">
								{d.contact.info.charter_title}
							</h2>
						</div>
						<div className="lg:col-span-7">
							<p className="max-w-[60ch] font-body text-[length:var(--tk-text-lead)] text-tk-on-dark-soft leading-[1.75]">
								{d.contact.info.charter_desc}
							</p>
							<p className="mt-5 max-w-[60ch] font-body text-[length:var(--tk-text-body)] text-tk-on-dark-muted leading-[1.7]">
								{en
									? "A 10% discount on every amount in the proposal, held for the whole of the first commitment. Written into the quote, not promised out loud."
									: "Une remise de 10 % sur l'ensemble des montants de la proposition, acquise pour toute la durée du premier engagement. Écrite dans le devis, pas promise à l'oral."}
							</p>
							<div className="mt-8 flex flex-wrap gap-3">
								<a href="mailto:contact@tkams.com" className="tk-btn-ghost">
									{en ? "Write to us" : "Nous écrire"}
								</a>
								<Link href="/tarifs" className="tk-btn-ghost">
									{en ? "See the pricing" : "Voir les tarifs"}
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
