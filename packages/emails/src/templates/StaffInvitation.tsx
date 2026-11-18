import { Section, Text } from "@react-email/components";
import { Button } from "../components/Button";
import { colors } from "../components/brand";
import { Layout } from "../components/Layout";
import type { Locale } from "../i18n";
import { t } from "../i18n";

interface StaffInvitationProps {
	name: string;
	role: string;
	institution: string;
	invitedBy: string;
	url: string;
	locale?: Locale;
}

export default function StaffInvitation({
	name = "Jean Dupont",
	role = "Enseignant",
	institution = "Université de Yaoundé I",
	invitedBy = "Dr. Mbarga",
	url = "https://tkams.com",
	locale = "fr",
}: StaffInvitationProps) {
	const tr = t(locale);
	const r = tr.staffInvitation;

	return (
		<Layout preview={r.subject(institution)} locale={locale}>
			<Section style={content}>
				{/* Badge */}
				<div style={badge}>
					<span style={badgeText}>✉ {r.title}</span>
				</div>

				<Text style={greeting}>{tr.common.greeting(name)}</Text>
				<Text
					style={body}
					dangerouslySetInnerHTML={{ __html: r.intro(role, institution) }}
				/>

				{/* Institution card */}
				<Section style={card}>
					<Text style={cardLabel}>
						{locale === "fr" ? "Établissement" : "Institution"}
					</Text>
					<Text style={cardValue}>{institution}</Text>
					<Text style={cardLabel}>{locale === "fr" ? "Rôle" : "Role"}</Text>
					<Text style={cardValue}>{role}</Text>
					<Text style={cardLabel}>
						{locale === "fr" ? "Invité par" : "Invited by"}
					</Text>
					<Text style={cardValue}>{invitedBy}</Text>
				</Section>

				<Section style={ctaWrapper}>
					<Button href={url}>{r.cta}</Button>
				</Section>

				<Text style={expiry}>{r.expiry}</Text>
			</Section>
		</Layout>
	);
}

const content: React.CSSProperties = { padding: "20px 24px 16px" };

const badge: React.CSSProperties = {
	backgroundColor: colors.primarySoft,
	borderRadius: 20,
	display: "inline-block",
	marginBottom: 20,
	padding: "6px 14px",
};

const badgeText: React.CSSProperties = {
	color: colors.primaryDeep,
	fontSize: 12,
	fontWeight: 600,
	letterSpacing: "0.05em",
	textTransform: "uppercase",
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
	margin: "0 0 24px",
};

const card: React.CSSProperties = {
	backgroundColor: colors.bgDeep,
	borderLeft: `3px solid ${colors.primary}`,
	borderRadius: 8,
	margin: "0 0 32px",
	padding: "20px 24px",
};

const cardLabel: React.CSSProperties = {
	color: colors.muted,
	fontSize: 11,
	fontWeight: 600,
	letterSpacing: "0.06em",
	margin: "0 0 2px",
	textTransform: "uppercase",
};

const cardValue: React.CSSProperties = {
	color: colors.ink,
	fontSize: 14,
	fontWeight: 500,
	margin: "0 0 14px",
};

const ctaWrapper: React.CSSProperties = { margin: "0 0 24px" };

const expiry: React.CSSProperties = {
	backgroundColor: colors.bgDeep,
	borderRadius: 8,
	color: colors.muted,
	fontSize: 13,
	margin: "0 0 24px",
	padding: "12px 16px",
};
