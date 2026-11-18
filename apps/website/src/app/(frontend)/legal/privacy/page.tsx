import type { Metadata } from "next";
import type React from "react";
import { getDict, getLocale } from "@/i18n";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

export default async function PrivacyPage() {
	const locale = await getLocale();
	const d = getDict(locale);

	const isFr = locale === "fr";

	return (
		<main
			style={{
				// Token, not a literal: the header grew a utility strip above the bar
				// on large screens, and a hard-coded 68px would slide under it.
				paddingTop: "var(--tk-header-h)",
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
							fontFamily:
								"var(--font-display-family), ui-sans-serif, system-ui, sans-serif",
							fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
							fontWeight: 800,
							letterSpacing: "-0.04em",
							color: "var(--tk-ink)",
							marginBottom: "0.75rem",
						}}
					>
						{d.legal.privacy.title}
					</h1>
					<p
						style={{
							color: "var(--tk-muted)",
							fontSize: "0.9rem",
							fontFamily: "var(--font-jetbrains-mono), monospace",
							marginBottom: "2rem",
						}}
					>
						{d.legal.privacy.last_updated}
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
						fontFamily:
							"var(--font-body-family), ui-sans-serif, system-ui, sans-serif",
						lineHeight: 1.75,
					}}
				>
					{isFr ? (
						<>
							<LegalSection title="1. Responsable du traitement">
								<p>
									TKAMS est édité par <strong>OverBrand</strong>, société basée
									à Douala et Yaoundé, Cameroun. Email :{" "}
									<a
										href="mailto:contact@tkams.com"
										style={{ color: "var(--tk-primary)" }}
									>
										contact@tkams.com
									</a>
								</p>
							</LegalSection>

							<LegalSection title="2. Données collectées">
								<p>
									Dans le cadre de l&apos;utilisation de TKAMS, nous collectons
									:
								</p>
								<ul>
									<li>
										Les informations d&apos;identification des administrateurs
										et utilisateurs (nom, email, rôle)
									</li>
									<li>
										Les données académiques des étudiants insérées par les
										établissements clients
									</li>
									<li>
										Les métadonnées de connexion (adresse IP, horodatage des
										sessions)
									</li>
									<li>
										Les données de contact fournies via les formulaires du site
										marketing
									</li>
								</ul>
							</LegalSection>

							<LegalSection title="3. Finalités du traitement">
								<p>Les données collectées sont utilisées pour :</p>
								<ul>
									<li>
										La fourniture du service TKAMS (gestion académique,
										délibérations, exports)
									</li>
									<li>La sécurité et l&apos;audit des accès</li>
									<li>
										Le support et la communication avec les établissements
										clients
									</li>
									<li>L&apos;amélioration continue de la plateforme</li>
								</ul>
							</LegalSection>

							<LegalSection title="4. Base légale">
								<p>
									Le traitement est fondé sur l&apos;exécution du contrat
									(fourniture du service SaaS) et le consentement explicite des
									utilisateurs pour les communications marketing.
								</p>
							</LegalSection>

							<LegalSection title="5. Conservation des données">
								<p>
									Les données académiques sont conservées pendant toute la durée
									du contrat et 12 mois après sa résiliation, sauf obligation
									légale contraire. Les données de contact marketing sont
									supprimées sur demande.
								</p>
							</LegalSection>

							<LegalSection title="6. Partage des données">
								<p>
									OverBrand ne vend ni ne loue vos données à des tiers. Les
									données peuvent être transmises à :
								</p>
								<ul>
									<li>
										L&apos;intégration <strong>DIPLOMATION</strong> (avec
										l&apos;accord explicite de l&apos;établissement)
									</li>
									<li>
										Les prestataires d&apos;hébergement cloud (dans le respect
										des réglementations applicables)
									</li>
								</ul>
							</LegalSection>

							<LegalSection title="7. Droits des personnes concernées">
								<p>
									Toute personne dont les données sont traitées dispose des
									droits d&apos;accès, de rectification, d&apos;effacement, de
									portabilité et d&apos;opposition. Pour exercer ces droits,
									contactez :
									<a
										href="mailto:contact@tkams.com"
										style={{
											color: "var(--tk-primary)",
											marginLeft: "0.25rem",
										}}
									>
										contact@tkams.com
									</a>
								</p>
							</LegalSection>

							<LegalSection title="8. Sécurité">
								<p>
									TKAMS met en œuvre des mesures techniques et
									organisationnelles appropriées : chiffrement en transit (TLS),
									hachage des clés API, contrôle d&apos;accès basé sur les rôles
									(RBAC), journalisation des actions sensibles.
								</p>
							</LegalSection>

							{/*
							 * Section 9 — the one the page was missing entirely, and the
							 * target of the cookie notice's "En savoir plus" link.
							 *
							 * The table is exhaustive as of this writing and was compiled by
							 * auditing the source, not from memory: `tkams_locale` in
							 * `i18n/actions.ts`, `payload-token` from Payload auth,
							 * `payload-theme` and `tkams-demo-sound` in localStorage. If a
							 * measurement or advertising tool is ever added, this section
							 * must list it AND the notice must become a real consent manager
							 * — see the note at the top of `CookieNotice.tsx`.
							 */}
							<LegalSection title="9. Cookies et stockage local" id="cookies">
								<p>
									Ce site ne dépose aucun cookie publicitaire et n&apos;utilise
									aucun outil de mesure d&apos;audience tiers. Seuls les
									éléments strictement nécessaires à son fonctionnement et à vos
									préférences sont enregistrés :
								</p>
								<ul>
									<li>
										<strong>tkams_locale</strong> (cookie) — mémorise la langue
										que vous avez choisie. Durée : 12 mois.
									</li>
									<li>
										<strong>payload-token</strong> (cookie) — maintient votre
										session, uniquement après connexion à votre espace. Durée :
										la session.
									</li>
									<li>
										<strong>payload-theme</strong> (stockage local) — mémorise
										le thème clair ou sombre.
									</li>
									<li>
										<strong>tkams-demo-sound</strong> (stockage local) —
										mémorise si vous avez coupé le son des démonstrations.
									</li>
								</ul>
								<p>
									Ces éléments relèvent des cookies strictement nécessaires ou
									de préférence : ils ne requièrent pas de consentement
									préalable, mais vous pouvez les supprimer à tout moment depuis
									les réglages de votre navigateur. Le site reste utilisable
									sans eux ; seules vos préférences ne seront plus mémorisées.
								</p>
							</LegalSection>

							<LegalSection title="10. Contact">
								<p>
									Pour toute question relative à la protection de vos données :
									<a
										href="mailto:contact@tkams.com"
										style={{
											color: "var(--tk-primary)",
											marginLeft: "0.25rem",
										}}
									>
										contact@tkams.com
									</a>
								</p>
							</LegalSection>
						</>
					) : (
						<>
							<LegalSection title="1. Data Controller">
								<p>
									TKAMS is published by <strong>OverBrand</strong>, a company
									based in Douala and Yaoundé, Cameroon. Email:{" "}
									<a
										href="mailto:contact@tkams.com"
										style={{ color: "var(--tk-primary)" }}
									>
										contact@tkams.com
									</a>
								</p>
							</LegalSection>

							<LegalSection title="2. Data Collected">
								<p>In the course of using TKAMS, we collect:</p>
								<ul>
									<li>
										Identification information for administrators and users
										(name, email, role)
									</li>
									<li>
										Academic data for students entered by client institutions
									</li>
									<li>Connection metadata (IP address, session timestamps)</li>
									<li>Contact information provided via marketing site forms</li>
								</ul>
							</LegalSection>

							<LegalSection title="3. Purpose of Processing">
								<p>Collected data is used for:</p>
								<ul>
									<li>
										Providing the TKAMS service (academic management,
										deliberations, exports)
									</li>
									<li>Security and access auditing</li>
									<li>Support and communication with client institutions</li>
									<li>Continuous improvement of the platform</li>
								</ul>
							</LegalSection>

							<LegalSection title="4. Legal Basis">
								<p>
									Processing is based on contract performance (SaaS service
									delivery) and explicit user consent for marketing
									communications.
								</p>
							</LegalSection>

							<LegalSection title="5. Data Retention">
								<p>
									Academic data is retained for the duration of the contract and
									12 months after termination, unless otherwise required by law.
									Marketing contact data is deleted upon request.
								</p>
							</LegalSection>

							<LegalSection title="6. Data Sharing">
								<p>
									OverBrand does not sell or rent your data to third parties.
									Data may be shared with:
								</p>
								<ul>
									<li>
										The <strong>DIPLOMATION</strong> integration (with explicit
										institutional consent)
									</li>
									<li>
										Cloud hosting providers (in compliance with applicable
										regulations)
									</li>
								</ul>
							</LegalSection>

							<LegalSection title="7. Rights of Data Subjects">
								<p>
									Anyone whose data is processed has rights of access,
									rectification, erasure, portability, and objection. To
									exercise these rights, contact:
									<a
										href="mailto:contact@tkams.com"
										style={{
											color: "var(--tk-primary)",
											marginLeft: "0.25rem",
										}}
									>
										contact@tkams.com
									</a>
								</p>
							</LegalSection>

							<LegalSection title="8. Security">
								<p>
									TKAMS implements appropriate technical and organizational
									measures: in-transit encryption (TLS), API key hashing,
									role-based access control (RBAC), and auditing of sensitive
									actions.
								</p>
							</LegalSection>

							<LegalSection title="9. Cookies and local storage" id="cookies">
								<p>
									This site sets no advertising cookies and uses no third-party
									analytics. Only what is strictly necessary for it to work, and
									what records your own preferences, is stored:
								</p>
								<ul>
									<li>
										<strong>tkams_locale</strong> (cookie) — remembers the
										language you chose. Duration: 12 months.
									</li>
									<li>
										<strong>payload-token</strong> (cookie) — keeps you signed
										in, only once you have logged into your account. Duration:
										the session.
									</li>
									<li>
										<strong>payload-theme</strong> (local storage) — remembers
										the light or dark theme.
									</li>
									<li>
										<strong>tkams-demo-sound</strong> (local storage) —
										remembers whether you muted the demonstrations.
									</li>
								</ul>
								<p>
									These are strictly necessary or preference cookies: they do
									not require prior consent, but you can delete them at any time
									from your browser settings. The site remains usable without
									them — only your preferences will no longer be remembered.
								</p>
							</LegalSection>

							<LegalSection title="10. Contact">
								<p>
									For any questions regarding the protection of your data:
									<a
										href="mailto:contact@tkams.com"
										style={{
											color: "var(--tk-primary)",
											marginLeft: "0.25rem",
										}}
									>
										contact@tkams.com
									</a>
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
	id,
}: {
	title: string;
	children: React.ReactNode;
	/**
	 * Optional anchor target. The cookie notice links to `#cookies`, so that
	 * section needs a real id — `scroll-margin-top` clears the fixed header,
	 * which would otherwise cover the heading it just scrolled to.
	 */
	id?: string;
}) {
	return (
		<div
			id={id}
			style={{
				marginBottom: "2.5rem",
				scrollMarginTop: "calc(var(--tk-header-h) + 1rem)",
			}}
		>
			<h2
				style={{
					fontFamily:
						"var(--font-display-family), ui-sans-serif, system-ui, sans-serif",
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
	title: "Politique de confidentialité — TKAMS",
	description: "Politique de confidentialité de TKAMS par OverBrand.",
	openGraph: mergeOpenGraph({
		title: "Politique de confidentialité — TKAMS",
		description: "Politique de confidentialité de TKAMS par OverBrand.",
	}),
};
