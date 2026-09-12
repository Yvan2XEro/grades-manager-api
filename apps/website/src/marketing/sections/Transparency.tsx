import Link from "next/link";
import type { Locale } from "@/i18n";
import { GUARANTEES, NOT_INCLUDED_DETAIL } from "../pricing-2026";
import { Reveal } from "../Reveal";

/**
 * Transparency — the section that carries the brand.
 *
 * The commercial proposal calls its exclusions page « la page la plus
 * importante du document », and builds its whole argument on one commitment:
 * no amount outside those pages can be billed. Most software sites bury that
 * list; putting it on the homepage is the single most distinctive thing this
 * site can do.
 *
 * Rebuilt from a flat bullet list, which had one weight of grey text on a dark
 * field and read as empty. Three things give it density now:
 *
 *   1. Each exclusion carries who owns it instead ("À votre charge", "Import,
 *      pas ressaisie"). That is the fact a reader wants, and it turns one
 *      column of refusals into two columns of answers.
 *   2. The guarantees are numbered and sit in a bordered grid, so the eye has
 *      a structure to scan rather than six equal paragraphs.
 *   3. The commitment line is promoted to a full-width statement between the
 *      two halves — it is the sentence the whole section exists to make.
 */
export function Transparency({ locale }: { locale: Locale }) {
	const en = locale === "en";

	const guarantees = en
		? [
				{
					name: "Compliance",
					detail:
						"Documents compliant with state university standards. A rejection on formal grounds attributable to the software is corrected free of charge.",
				},
				{
					name: "Money back",
					detail:
						"30 days on OnReceipt licences, full refund, no justification required.",
				},
				{
					name: "Updates",
					detail:
						"Continuous on TKAMS; included for 3, 5 or 7 years on perpetual licences.",
				},
				{
					name: "Data security",
					detail:
						"TLS, role-based access control, audit trail, hashed API keys. AES-128 encrypted QR on OnReceipt.",
				},
				{
					name: "Support times",
					detail:
						"Standard: 2 working days. Priority: 4 working hours. Mon–Fri, 8am–5pm, Douala.",
				},
				{
					name: "Reversibility",
					detail:
						"Full export at any time. After a TKAMS contract ends: read and export kept open for 90 days.",
				},
			]
		: [...GUARANTEES];

	return (
		<section className="relative overflow-hidden bg-tk-primary-deep text-tk-on-primary">
			<div
				aria-hidden="true"
				className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
			/>

			<div className="tk-section relative mx-auto max-w-[86rem] px-6 lg:px-10">
				{/* Masthead */}
				<div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-14">
					<div>
						<p className="font-code text-[length:var(--tk-text-xs)] text-tk-on-primary/75 uppercase tracking-[0.16em]">
							{en ? "Commitment" : "Engagement"}
						</p>
						<h2 className="tk-headline mt-4 max-w-[20ch]">
							{en
								? "What we will not do, said before you sign."
								: "Ce que nous ne ferons pas, dit avant que vous signiez."}
						</h2>
					</div>
					<p className="font-body text-[length:var(--tk-text-body)] text-tk-on-primary/85 leading-relaxed lg:pb-1">
						{en
							? "Our commercial proposal devotes its most important page to what is not included, and to who carries it instead. It belongs here too — an institution that discovers an exclusion after signature costs far more than one that walks away before."
							: "Notre proposition commerciale consacre sa page la plus importante à ce qui n'est pas inclus, et à qui le porte à la place. Elle a aussi sa place ici — un établissement qui découvre une exclusion après signature coûte bien plus cher qu'un établissement qui renonce avant."}
					</p>
				</div>

				{/* Exclusions — item, owner, consequence */}
				<Reveal
					as="ul"
					stagger={50}
					className="mt-12 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-2"
				>
					{NOT_INCLUDED_DETAIL.map((row) => {
						const c = en ? row.en : row.fr;
						return (
							<li
								key={c.item}
								className="bg-tk-primary-deep p-5 transition-colors hover:bg-white/[0.07] lg:p-6"
							>
								<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
									<h3 className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-primary leading-snug">
										{c.item}
									</h3>
									{/*
									 * The owner chip is set in white on a filled accent, not in
									 * accent on the violet: warm type on this ground measures
									 * 2.11:1 and is unreadable. Filling the chip keeps the
									 * accent visible while the label stays legible.
									 */}
									<span className="whitespace-nowrap rounded-full bg-tk-accent-deep px-2.5 py-0.5 font-body font-medium text-[length:var(--tk-text-xs)] text-tk-on-primary">
										{c.owner}
									</span>
								</div>
								<p className="mt-2.5 max-w-[52ch] font-body text-[length:var(--tk-text-sm)] text-tk-on-primary/85 leading-relaxed">
									{c.note}
								</p>
							</li>
						);
					})}
				</Reveal>

				{/* The commitment, promoted to its own statement */}
				<div className="mt-10 border-tk-accent border-l-[3px] bg-white/[0.04] px-6 py-7 lg:px-8">
					<p className="max-w-[60ch] font-bold font-display text-[clamp(1.1rem,0.95rem+0.7vw,1.5rem)] leading-snug tracking-[-0.02em]">
						{en
							? "Any amount not written on this page cannot be billed to you without a written amendment, signed by you."
							: "Tout montant qui ne figure pas sur cette page ne pourra pas vous être facturé sans un avenant écrit et signé par vous."}
					</p>
					<p className="mt-3 max-w-[62ch] font-body text-[length:var(--tk-text-body)] text-tk-on-primary/85 leading-relaxed">
						{en
							? "We also refuse to promise that any software will make your supervising body accept wrong marks or unvalidated course structures."
							: "Nous refusons également de promettre qu'un logiciel fera accepter par votre tutelle des notes erronées ou des maquettes non validées."}
					</p>
				</div>

				{/* Guarantees — numbered, so six items read as a set */}
				<div className="mt-14">
					<div className="flex flex-wrap items-baseline justify-between gap-4 border-white/12 border-b pb-4">
						<h3 className="font-bold font-display text-[1.35rem] tracking-[-0.025em]">
							{en
								? "What we guarantee in return"
								: "Ce que nous garantissons en retour"}
						</h3>
						<span className="font-code text-[length:var(--tk-text-xs)] text-tk-on-primary/85 uppercase tracking-[0.14em]">
							{en ? "Written into the quote" : "Écrit dans le devis"}
						</span>
					</div>

					<Reveal
						as="dl"
						stagger={40}
						className="grid gap-x-10 md:grid-cols-2 lg:grid-cols-3"
					>
						{guarantees.map((g, i) => (
							<div
								key={g.name}
								className="flex gap-4 border-white/10 border-b py-5"
							>
								<span className="font-display font-extrabold text-[length:var(--tk-text-lead)] text-tk-on-primary/75 tabular-nums leading-none">
									{String(i + 1).padStart(2, "0")}
								</span>
								<div className="min-w-0">
									<dt className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-primary">
										{g.name}
									</dt>
									<dd className="mt-1.5 font-body text-[length:var(--tk-text-sm)] text-tk-on-primary/85 leading-relaxed">
										{g.detail}
									</dd>
								</div>
							</div>
						))}
					</Reveal>
				</div>

				<div className="mt-10 flex flex-wrap items-center gap-4">
					<Link
						href="/tarifs"
						className="rounded-md bg-tk-surface px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-primary-deep transition-colors hover:bg-tk-primary-soft"
					>
						{en ? "See every price" : "Voir tous les tarifs"}
					</Link>
					<Link
						href="/engagements"
						className="rounded-md border border-white/25 px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-primary transition-colors hover:bg-white/10"
					>
						{en ? "Guarantees and terms" : "Garanties et conditions"}
					</Link>
					<Link
						href="/documents/Proposition commerciale TKAMS et QRCode 2026.pdf"
						className="font-body font-medium text-[length:var(--tk-text-body)] text-tk-on-primary/85 underline-offset-4 hover:text-tk-on-primary hover:underline"
					>
						{en
							? "Download the full proposal (PDF, 19 pages)"
							: "Télécharger la proposition (PDF, 19 pages)"}
					</Link>
				</div>
			</div>
		</section>
	);
}
