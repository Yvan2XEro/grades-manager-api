import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
	? new Resend(process.env.RESEND_API_KEY)
	: null;

export const emailFrom = process.env.EMAIL_FROM ?? "noreply@example.com";

export type EmailSendFn = (
	to: string,
	subject: string,
	html: string,
) => Promise<void>;

export const defaultEmailSend: EmailSendFn = async (to, subject, html) => {
	if (!resend) {
		return;
	}
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
