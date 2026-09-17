import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { Locale } from "../i18n";
import { t } from "../i18n";
import { colors, LOGO_URL, WEBSITE_URL } from "./brand";

interface LayoutProps {
	preview: string;
	locale?: Locale;
	unsubscribeUrl?: string;
	children: React.ReactNode;
}

export function Layout({
	preview,
	locale = "fr",
	unsubscribeUrl,
	children,
}: LayoutProps) {
	const tr = t(locale);
	return (
		<Html lang={locale}>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={body}>
				{/* Top accent bar */}
				<div style={accentBar} />

				<Container style={container}>
					{/* Header */}
					<Section style={header}>
						<Img
							src={LOGO_URL}
							alt="TKAMS"
							width={155}
							height={40}
							style={{ display: "block" }}
						/>
					</Section>

					{/* Content slot */}
					{children}

					{/* Divider */}
					<Hr style={divider} />

					{/* Footer */}
					<Section style={footer}>
						<Text style={footerTagline}>{tr.common.footer_tagline}</Text>
						<Text style={footerMeta}>
							{unsubscribeUrl ? (
								<Link href={unsubscribeUrl} style={footerLink}>
									{tr.common.unsubscribe}
								</Link>
							) : (
								tr.common.footer_unsubscribe
							)}
							{"  ·  "}
							<Link href={WEBSITE_URL} style={footerLink}>
								tkams.com
							</Link>
							{"  ·  "}
							<Link href={`${WEBSITE_URL}/contact`} style={footerLink}>
								{tr.common.help_link}
							</Link>
						</Text>
						<Text style={footerRights}>{tr.common.footer_rights}</Text>
						<Text style={footerCredit}>
							{"Crafted by "}
							<Link href="https://www.overbrand.net" style={footerCreditLink}>
								Overbrand
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
	backgroundColor: colors.bgDeep,
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
	margin: 0,
	padding: "12px 0 20px",
};

const accentBar: React.CSSProperties = {
	height: 4,
	background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
};

const container: React.CSSProperties = {
	backgroundColor: colors.white,
	borderRadius: 12,
	margin: "10px auto 0",
	maxWidth: 560,
	overflow: "hidden",
	boxShadow: "0 2px 16px rgba(97, 96, 255, 0.08)",
};

const header: React.CSSProperties = {
	backgroundColor: colors.bgDeep,
	borderBottom: `1px solid ${colors.border}`,
	padding: "12px 24px",
};

const divider: React.CSSProperties = {
	borderColor: colors.border,
	margin: "0 24px",
};

const footer: React.CSSProperties = {
	padding: "12px 24px 16px",
};

const footerTagline: React.CSSProperties = {
	color: colors.muted,
	fontSize: 12,
	lineHeight: "18px",
	margin: "0 0 8px",
};

const footerMeta: React.CSSProperties = {
	color: colors.muted,
	fontSize: 11,
	lineHeight: "16px",
	margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
	color: colors.muted,
	textDecoration: "underline",
};

const footerRights: React.CSSProperties = {
	color: colors.border,
	fontSize: 10,
	margin: "8px 0 0",
};

const footerCredit: React.CSSProperties = {
	color: colors.border,
	fontSize: 10,
	margin: "2px 0 0",
};

const footerCreditLink: React.CSSProperties = {
	color: colors.border,
	textDecoration: "none",
};
