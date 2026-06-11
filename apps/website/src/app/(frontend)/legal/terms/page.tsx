import type { Metadata } from "next";
import type React from "react";
import { getDict, getLocale } from "@/i18n";

export default async function TermsPage() {
	const locale = await getLocale();
	const d = getDict(locale);

	const isFr = locale === "fr";

	return (
		<main
			style={{
				paddingTop: "68px",
				minHeight: "100vh",
				background: "var(--tk-bg)",
			}}
		>
			<section style={{ padding: "3.5rem 1.5rem 0" }}>
				<div style={{ maxWidth: "48rem", margin: "0 auto" }}>
					<p
						style={{
							fontFamily: "var(--font-jetbrains-mono), monospace",
							fontSize: "0.7rem",
							textTransform: "uppercase",
							letterSpacing: "0.14em",
							color: "var(--tk-primary)",
							fontWeight: 600,
							marginBottom: "1rem",
						}}
					>
						Mentions légales
					</p>
					<h1
						style={{
							fontFamily: "var(--font-sora), system-ui, sans-serif",
							fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
							fontWeight: 800,
							letterSpacing: "-0.04em",
							color: "var(--tk-ink)",
							marginBottom: "0.75rem",
						}}
					>
						{d.legal.terms.title}
					</h1>
					<p
						style={{
							color: "var(--tk-muted)",
							fontSize: "0.9rem",
							fontFamily: "var(--font-jetbrains-mono), monospace",
							marginBottom: "2rem",
						}}
					>
						{d.legal.terms.last_updated}
					</p>
					<div
						style={{ height: "1px", background: "var(--tk-border-strong)" }}
					/>
				</div>
			</section>

			<section style={{ padding: "4rem 1.5rem" }}>
				<div
					style={{
						maxWidth: "48rem",
						margin: "0 auto",
						color: "var(--tk-ink)",
						fontFamily: "var(--font-inter), system-ui, sans-serif",
						lineHeight: 1.75,
					}}
				>
					{isFr ? (
						<>
							<LegalSection title="1. Objet">
								<p>
									Les présentes Conditions d&apos;Utilisation régissent
									l&apos;accès et l&apos;utilisation de la plateforme TKAMS
									(Tefoye and Kana Academic Management System), éditée par{" "}
									<strong>OverBrand</strong>.
								</p>
							</LegalSection>

							<LegalSection title="2. Accès au service">
								<p>
									L&apos;accès à TKAMS est réservé aux établissements
									d&apos;enseignement supérieur ayant souscrit un contrat avec
									OverBrand. Chaque établissement est responsable de la gestion
									de ses accès utilisateurs.
								</p>
							</LegalSection>

							<LegalSection title="3. Obligations de l&apos;établissement client">
								<ul>
									<li>
										Utiliser la plateforme conformément aux lois camerounaises
										et CEMAC applicables
									</li>
									<li>
										Ne pas tenter de contourner les mécanismes de sécurité
									</li>
									<li>
										Maintenir la confidentialité des clés d&apos;API et des
										identifiants
									</li>
									<li>
										Informer OverBrand de tout incident de sécurité dans les 48h
									</li>
									<li>Nommer un référent technique pour la coordination</li>
								</ul>
							</LegalSection>

							<LegalSection title="4. Niveaux de service (SLA)">
								<p>
									<strong>Standard :</strong> Disponibilité cible de 99 % sur
									base mensuelle, maintenance planifiée hors heures ouvrables.{" "}
									<strong>Pro / Enterprise :</strong> SLA renforcé défini dans
									le contrat spécifique.
								</p>
							</LegalSection>

							<LegalSection title="5. Propriété intellectuelle">
								<p>
									TKAMS, son code, ses interfaces et ses exports sont la
									propriété exclusive d&apos;OverBrand. L&apos;établissement
									client dispose d&apos;une licence d&apos;utilisation
									non-exclusive pour la durée du contrat. Les données
									académiques restent la propriété de l&apos;établissement.
								</p>
							</LegalSection>

							<LegalSection title="6. Tarification et paiement">
								<p>
									Les tarifs sont ceux définis dans le contrat signé. Le défaut
									de paiement peut entraîner la suspension du service après mise
									en demeure. Les prix sont exprimés HT.
								</p>
							</LegalSection>

							<LegalSection title="7. Résiliation">
								<p>
									Chaque partie peut résilier le contrat avec un préavis de 30
									jours. En cas de résiliation, OverBrand fournit une export
									complète des données de l&apos;établissement dans les 15
									jours.
								</p>
							</LegalSection>

							<LegalSection title="8. Limitation de responsabilité">
								<p>
									OverBrand ne saurait être tenu responsable des pertes
									indirectes, perte de données due à une manipulation incorrecte
									par l&apos;établissement, ou interruptions non imputables à
									OverBrand. La responsabilité totale est limitée aux sommes
									versées sur les 12 derniers mois.
								</p>
							</LegalSection>

							<LegalSection title="9. Droit applicable">
								<p>
									Les présentes conditions sont régies par le droit camerounais.
									Tout litige sera soumis aux tribunaux compétents de Douala,
									Cameroun.
								</p>
							</LegalSection>

							<LegalSection title="10. Contact">
								<p>
									OverBrand ·{" "}
									<a
										href="mailto:contact@tkams.com"
										style={{ color: "var(--tk-primary)" }}
									>
										contact@tkams.com
									</a>
									· Douala &amp; Yaoundé, Cameroun
								</p>
							</LegalSection>
						</>
					) : (
						<>
							<LegalSection title="1. Purpose">
								<p>
									These Terms of Service govern access to and use of the TKAMS
									platform (Tefoye and Kana Academic Management System),
									published by <strong>OverBrand</strong>.
								</p>
							</LegalSection>

							<LegalSection title="2. Access to the Service">
								<p>
									Access to TKAMS is reserved for higher education institutions
									that have signed a contract with OverBrand. Each institution
									is responsible for managing its user access.
								</p>
							</LegalSection>

							<LegalSection title="3. Client Institution Obligations">
								<ul>
									<li>
										Use the platform in compliance with applicable Cameroonian
										and CEMAC laws
									</li>
									<li>Not attempt to circumvent security mechanisms</li>
									<li>Maintain confidentiality of API keys and credentials</li>
									<li>
										Notify OverBrand of any security incident within 48 hours
									</li>
									<li>Designate a technical contact for coordination</li>
								</ul>
							</LegalSection>

							<LegalSection title="4. Service Levels (SLA)">
								<p>
									<strong>Standard:</strong> Target availability of 99% on a
									monthly basis, scheduled maintenance outside business hours.{" "}
									<strong>Pro / Enterprise:</strong> Enhanced SLA defined in the
									specific contract.
								</p>
							</LegalSection>

							<LegalSection title="5. Intellectual Property">
								<p>
									TKAMS, its code, interfaces, and exports are the exclusive
									property of OverBrand. The client institution holds a
									non-exclusive license for the duration of the contract.
									Academic data remains the property of the institution.
								</p>
							</LegalSection>

							<LegalSection title="6. Pricing and Payment">
								<p>
									Prices are those defined in the signed contract. Payment
									default may result in service suspension after formal notice.
									Prices are exclusive of tax.
								</p>
							</LegalSection>

							<LegalSection title="7. Termination">
								<p>
									Either party may terminate the contract with 30 days&apos;
									notice. Upon termination, OverBrand provides a complete data
									export to the institution within 15 days.
								</p>
							</LegalSection>

							<LegalSection title="8. Limitation of Liability">
								<p>
									OverBrand cannot be held liable for indirect losses, data loss
									due to incorrect handling by the institution, or interruptions
									not attributable to OverBrand. Total liability is limited to
									amounts paid in the last 12 months.
								</p>
							</LegalSection>

							<LegalSection title="9. Governing Law">
								<p>
									These terms are governed by Cameroonian law. Any dispute shall
									be submitted to the competent courts of Douala, Cameroon.
								</p>
							</LegalSection>

							<LegalSection title="10. Contact">
								<p>
									OverBrand ·{" "}
									<a
										href="mailto:contact@tkams.com"
										style={{ color: "var(--tk-primary)" }}
									>
										contact@tkams.com
									</a>
									· Douala &amp; Yaoundé, Cameroon
								</p>
							</LegalSection>
						</>
					)}
				</div>
			</section>
		</main>
	);
}

function LegalSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div style={{ marginBottom: "2.5rem" }}>
			<h2
				style={{
					fontFamily: "var(--font-sora), system-ui, sans-serif",
					fontSize: "1.1875rem",
					fontWeight: 700,
					color: "var(--tk-ink)",
					letterSpacing: "-0.02em",
					marginBottom: "0.875rem",
					paddingBottom: "0.625rem",
					borderBottom: "1px solid var(--tk-border)",
				}}
			>
				{title}
			</h2>
			<div style={{ color: "var(--tk-ink-2)", fontSize: "0.9375rem" }}>
				{children}
			</div>
		</div>
	);
}

export const metadata: Metadata = {
	title: "Conditions d'utilisation — TKAMS",
	description: "Conditions générales d'utilisation de TKAMS par OverBrand.",
};
