import { Section, Text } from "@react-email/components";
import type { Locale } from "../i18n";
import { Button } from "./Button";
import { colors, WEBSITE_URL } from "./brand";
import { Layout } from "./Layout";

export interface LaunchFeature {
	title: string;
	body: string;
}

export interface LaunchCopy {
	subject: string;
	eyebrow: string;
	title: string;
	subtitle: string;
	greeting: string;
	intro: string;
	features: readonly LaunchFeature[];
	cta: string;
	closing: string;
}

interface ProductLaunchEmailProps {
	copy: LaunchCopy;
	ctaUrl?: string;
	unsubscribeUrl?: string;
	locale: Locale;
	secondary?: boolean;
}

export function ProductLaunchEmail({
	copy,
	ctaUrl = WEBSITE_URL,
	unsubscribeUrl,
	locale,
	secondary = false,
}: ProductLaunchEmailProps) {
	return (
		<Layout
			locale={locale}
			preview={copy.subject}
			unsubscribeUrl={unsubscribeUrl}
		>
			<Section style={secondary ? heroSecondary : hero}>
				<Text style={eyebrow}>{copy.eyebrow}</Text>
				<Text style={heroTitle}>{copy.title}</Text>
				<Text style={heroSubtitle}>{copy.subtitle}</Text>
			</Section>

			<Section style={content}>
				<Text style={greeting}>{copy.greeting}</Text>
				<Text style={body}>{copy.intro}</Text>

				<Section style={featureList}>
					{copy.features.map((feature, index) => (
						<Section key={feature.title} style={featureRow}>
							<div style={featureNumber}>
								{String(index + 1).padStart(2, "0")}
							</div>
							<div style={featureCopy}>
								<Text style={featureTitle}>{feature.title}</Text>
								<Text style={featureBody}>{feature.body}</Text>
							</div>
						</Section>
					))}
				</Section>

				<Section style={ctaWrapper}>
					<Button href={ctaUrl}>{copy.cta}</Button>
				</Section>
				<Text style={closing}>{copy.closing}</Text>
			</Section>
		</Layout>
	);
}

const hero: React.CSSProperties = {
	background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.darkSecondary} 100%)`,
	padding: "34px 24px 38px",
	textAlign: "center",
};

const heroSecondary: React.CSSProperties = {
	...hero,
	background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primaryDeep} 100%)`,
};

const eyebrow: React.CSSProperties = {
	color: colors.accent,
	fontSize: 11,
	fontWeight: 700,
	letterSpacing: "0.12em",
	margin: "0 0 12px",
	textTransform: "uppercase",
};

const heroTitle: React.CSSProperties = {
	color: colors.white,
	fontSize: 30,
	fontWeight: 700,
	letterSpacing: "-0.03em",
	lineHeight: "36px",
	margin: 0,
};

const heroSubtitle: React.CSSProperties = {
	color: "#D9D8EF",
	fontSize: 16,
	lineHeight: "24px",
	margin: "14px auto 0",
	maxWidth: 430,
};

const content: React.CSSProperties = { padding: "28px 24px 22px" };

const greeting: React.CSSProperties = {
	color: colors.ink,
	fontSize: 19,
	fontWeight: 700,
	lineHeight: "26px",
	margin: "0 0 12px",
};

const body: React.CSSProperties = {
	color: colors.inkSoft,
	fontSize: 15,
	lineHeight: "24px",
	margin: "0 0 24px",
};

const featureList: React.CSSProperties = {
	borderTop: `1px solid ${colors.border}`,
	margin: "0 0 26px",
};

const featureRow: React.CSSProperties = {
	borderBottom: `1px solid ${colors.border}`,
	padding: "16px 0",
};

const featureNumber: React.CSSProperties = {
	backgroundColor: colors.primarySoft,
	borderRadius: 7,
	color: colors.primaryDeep,
	fontSize: 11,
	fontWeight: 700,
	height: 28,
	lineHeight: "28px",
	textAlign: "center",
	width: 28,
};

const featureCopy: React.CSSProperties = { paddingLeft: 12 };

const featureTitle: React.CSSProperties = {
	color: colors.ink,
	fontSize: 15,
	fontWeight: 700,
	lineHeight: "20px",
	margin: "0 0 4px",
};

const featureBody: React.CSSProperties = {
	color: colors.muted,
	fontSize: 14,
	lineHeight: "21px",
	margin: 0,
};

const ctaWrapper: React.CSSProperties = {
	margin: "0 0 18px",
	textAlign: "center",
};

const closing: React.CSSProperties = {
	color: colors.muted,
	fontSize: 13,
	fontStyle: "italic",
	lineHeight: "20px",
	margin: 0,
	textAlign: "center",
};
