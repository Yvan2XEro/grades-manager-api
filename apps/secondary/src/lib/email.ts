import {
	type Locale,
	ResetPassword,
	render,
	StaffInvitation,
	WelcomeInstitution,
} from "@tkams/emails";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "TKAMS <no-reply@tkams.com>";

async function sendEmail({
	to,
	subject,
	html,
}: {
	to: string;
	subject: string;
	html: string;
}) {
	const { error } = await resend.emails.send({ from: FROM, to, subject, html });
	if (error) {
		console.error("[email] send error", error);
		throw new Error(error.message);
	}
}

export async function sendResetPassword({
	to,
	name,
	url,
	locale = "fr",
}: {
	to: string;
	name: string;
	url: string;
	locale?: Locale;
}) {
	const html = await render(ResetPassword({ name, url, locale }));
	const subject =
		locale === "en"
			? "Reset your TKAMS password"
			: "Réinitialisez votre mot de passe TKAMS";
	await sendEmail({ to, subject, html });
}

export async function sendStaffInvitation({
	to,
	name,
	role,
	institution,
	invitedBy,
	url,
	locale = "fr",
}: {
	to: string;
	name: string;
	role: string;
	institution: string;
	invitedBy: string;
	url: string;
	locale?: Locale;
}) {
	const html = await render(
		StaffInvitation({ name, role, institution, invitedBy, url, locale }),
	);
	const subject =
		locale === "en"
			? `You're invited to join ${institution} on TKAMS`
			: `Invitation à rejoindre ${institution} sur TKAMS`;
	await sendEmail({ to, subject, html });
}

export async function sendWelcomeInstitution({
	to,
	name,
	institution,
	locale = "fr",
}: {
	to: string;
	name: string;
	institution: string;
	locale?: Locale;
}) {
	const html = await render(WelcomeInstitution({ name, institution, locale }));
	const subject =
		locale === "en" ? "Welcome to TKAMS 🎓" : "Bienvenue sur TKAMS 🎓";
	await sendEmail({ to, subject, html });
}
