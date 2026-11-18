import { Link, Section, Text } from "@react-email/components";
import { Button } from "../components/Button";
import { colors } from "../components/brand";
import { Layout } from "../components/Layout";
import type { Locale } from "../i18n";
import { t } from "../i18n";

interface ResetPasswordProps {
	name: string;
	url: string;
	locale?: Locale;
}

export default function ResetPassword({
	name = "Marie",
	url = "https://tkams.com",
	locale = "fr",
}: ResetPasswordProps) {
	const tr = t(locale);
	const r = tr.resetPassword;

	return (
		<Layout preview={r.subject} locale={locale}>
			<Section style={content}>
				<Text style={greeting}>{tr.common.greeting(name)}</Text>
				<Text style={body}>{r.intro}</Text>

				<Section style={ctaWrapper}>
					<Button href={url}>{r.cta}</Button>
				</Section>

				<Text style={expiry}>{r.expiry}</Text>

				<Section style={dividerSection}>
					<div style={softDivider} />
				</Section>

				<Text style={ignoreText}>{r.ignore}</Text>

				<Text style={urlLabel}>{r.url_fallback}</Text>
				<Link href={url} style={urlText}>
					{url}
				</Link>
			</Section>
		</Layout>
	);
}

const content: React.CSSProperties = {
	padding: "20px 24px 16px",
};

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

const ctaWrapper: React.CSSProperties = {
	margin: "0 0 24px",
};

const expiry: React.CSSProperties = {
	backgroundColor: colors.bgDeep,
	borderRadius: 8,
	color: colors.muted,
	fontSize: 13,
	margin: "0 0 32px",
	padding: "12px 16px",
};

const dividerSection: React.CSSProperties = {
	margin: "0 0 24px",
};

const softDivider: React.CSSProperties = {
	borderTop: `1px solid ${colors.border}`,
};

const ignoreText: React.CSSProperties = {
	color: colors.muted,
	fontSize: 13,
	lineHeight: "20px",
	margin: "0 0 16px",
};

const urlLabel: React.CSSProperties = {
	color: colors.muted,
	fontSize: 12,
	margin: "0 0 4px",
};

const urlText: React.CSSProperties = {
	color: colors.primary,
	fontSize: 12,
	wordBreak: "break-all",
};
