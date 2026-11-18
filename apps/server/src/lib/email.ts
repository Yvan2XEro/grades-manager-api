import {
	type Locale,
	ResetPassword,
	render,
	StaffInvitation,
	WelcomeInstitution,
} from "@tkams/emails";
import nodemailer from "nodemailer";
import { Resend } from "resend";

export const emailFrom = process.env.EMAIL_FROM ?? "noreply@example.com";

export type EmailSendFn = (
	to: string,
	subject: string,
	html: string,
) => Promise<void>;

function buildSendFn(): EmailSendFn {
	if (process.env.RESEND_API_KEY) {
		const resend = new Resend(process.env.RESEND_API_KEY);
		return async (to, subject, html) => {
			const result = await resend.emails.send({
				from: emailFrom,
				to,
				subject,
				html,
			});
			if (result.error) {
				throw new Error(result.error.message ?? "Email delivery failed");
			}
		};
	}

	if (process.env.SMTP_HOST) {
		const transport = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT ?? 587),
			secure: Number(process.env.SMTP_PORT ?? 587) === 465,
			auth: process.env.SMTP_USER
				? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
				: undefined,
			tls: { rejectUnauthorized: false },
		});
		return async (to, subject, html) => {
			await transport.sendMail({ from: emailFrom, to, subject, html });
		};
	}

	return async () => {};
}

export const defaultEmailSend: EmailSendFn = buildSendFn();

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
	await defaultEmailSend(to, subject, html);
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
	await defaultEmailSend(to, subject, html);
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
	await defaultEmailSend(to, subject, html);
}
