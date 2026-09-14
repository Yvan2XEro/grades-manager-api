import { Section, Text } from "@react-email/components";
import { Button } from "../components/Button";
import { APP_URL, colors } from "../components/brand";
import { Layout } from "../components/Layout";
import type { Locale } from "../i18n";
import { t } from "../i18n";

interface WelcomeInstitutionProps {
	name: string;
	institution: string;
	appUrl?: string;
	locale?: Locale;
}

export default function WelcomeInstitution({
	name = "Dr. Mbarga",
	institution = "Université de Yaoundé I",
	appUrl = APP_URL,
	locale = "fr",
}: WelcomeInstitutionProps) {
	const tr = t(locale);
	const r = tr.welcomeInstitution;

	return (
		<Layout preview={r.subject} locale={locale}>
			{/* Hero band */}
			<Section style={hero}>
				<Text style={heroTitle}>{r.title}</Text>
			</Section>

			<Section style={content}>
				<Text style={greeting}>{tr.common.greeting(name)}</Text>
				<Text
					style={body}
					dangerouslySetInnerHTML={{ __html: r.intro(institution) }}
				/>

				<Section style={ctaWrapper}>
					<Button href={appUrl}>{r.cta}</Button>
				</Section>

				{/* Steps */}
				<Text style={stepsTitle}>{r.steps_title}</Text>
				{r.steps.map((step, i) => (
					<Section key={step} style={stepRow}>
						<div style={stepNumber}>{i + 1}</div>
						<Text style={stepText}>{step}</Text>
					</Section>
				))}
			</Section>
		</Layout>
	);
}

const hero: React.CSSProperties = {
	background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.darkSecondary} 100%)`,
	padding: "36px 40px",
	textAlign: "center",
};

const heroTitle: React.CSSProperties = {
	color: colors.white,
	fontSize: 26,
	fontWeight: 700,
	letterSpacing: "-0.02em",
	margin: 0,
};

const content: React.CSSProperties = { padding: "36px 40px 32px" };

const greeting: React.CSSProperties = {
	color: colors.ink,
	fontSize: 17,
	fontWeight: 600,
	margin: "0 0 12px",
};

const body: React.CSSProperties = {
	color: colors.inkSoft,
	fontSize: 15,
	lineHeight: "24px",
	margin: "0 0 32px",
};

const ctaWrapper: React.CSSProperties = { margin: "0 0 40px" };

const stepsTitle: React.CSSProperties = {
	color: colors.ink,
	fontSize: 13,
	fontWeight: 700,
	letterSpacing: "0.06em",
	margin: "0 0 16px",
	textTransform: "uppercase",
};

const stepRow: React.CSSProperties = {
	alignItems: "flex-start",
	display: "flex",
	gap: 12,
	marginBottom: 12,
};

const stepNumber: React.CSSProperties = {
	backgroundColor: colors.primarySoft,
	borderRadius: "50%",
	color: colors.primaryDeep,
	flexShrink: 0,
	fontSize: 12,
	fontWeight: 700,
	height: 24,
	lineHeight: "24px",
	textAlign: "center",
	width: 24,
};

const stepText: React.CSSProperties = {
	color: colors.inkSoft,
	fontSize: 14,
	lineHeight: "22px",
	margin: 0,
};
