const BRAND_COLOR = "#4f6ef7";
const WEBSITE_URL = process.env.WEBSITE_URL ?? "https://tkams.com";

function emailShell(body: string): string {
	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Inter,Helvetica Neue,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:${BRAND_COLOR};padding:32px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TKAMS</span>
          </td>
        </tr>
        <tr><td style="padding:40px 40px 32px;">${body}</td></tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} TKAMS</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
	return `<table cellpadding="0" cellspacing="0">
  <tr>
    <td style="border-radius:8px;background:${BRAND_COLOR};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
    </td>
  </tr>
</table>`;
}

export function verificationEmailHTML({
	token,
	userName,
}: {
	token: string;
	userName: string;
}): string {
	const verifyUrl = `${WEBSITE_URL}/verify?token=${token}`;
	return emailShell(`
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Hello ${userName} 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Thanks for signing up for TKAMS. Please confirm your email address to activate your account.
    </p>
    ${ctaButton(verifyUrl, "Verify my email")}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
      This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
      Or copy this link: <a href="${verifyUrl}" style="color:${BRAND_COLOR};text-decoration:none;">${verifyUrl}</a>
    </p>
  `);
}

export function instanceApprovedEmailHTML({
	userName,
	orgName,
	subdomain,
}: {
	userName: string;
	orgName: string;
	subdomain: string;
}): string {
	const baseDomain = process.env.TKAMS_BASE_DOMAIN ?? "tkams.com";
	const dashboardUrl = `${WEBSITE_URL}/dashboard/instances`;
	return emailShell(`
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Your instance is being set up 🚀</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${userName},<br/><br/>
      Your TKAMS instance request for <strong>${orgName}</strong> has been approved.<br/>
      We are now provisioning your platform at <strong>${subdomain}.${baseDomain}</strong>.<br/><br/>
      This usually takes 2–3 minutes. Track the progress from your dashboard.
    </p>
    ${ctaButton(dashboardUrl, "Track my instance →")}
  `);
}

export function instanceRejectedEmailHTML({
	userName,
	orgName,
}: {
	userName: string;
	orgName: string;
}): string {
	const contactUrl = `${WEBSITE_URL}/contact`;
	return emailShell(`
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Your request could not be processed</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${userName},<br/><br/>
      After review, your TKAMS instance request for <strong>${orgName}</strong> could not be approved at this time.<br/><br/>
      Our team will be happy to discuss your needs and find the right solution for your institution.
    </p>
    ${ctaButton(contactUrl, "Contact the team →")}
  `);
}

export function instanceFailedEmailHTML({
	userName,
	orgName,
	errorMessage,
}: {
	userName: string;
	orgName: string;
	errorMessage?: string;
}): string {
	const dashboardUrl = `${WEBSITE_URL}/dashboard/instances`;
	return emailShell(`
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Instance provisioning failed</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${userName},<br/><br/>
      We encountered an error while setting up your TKAMS instance for <strong>${orgName}</strong>.
      Our team has been notified and will investigate.<br/><br/>
      ${errorMessage ? `<em style="color:#9ca3af;font-size:13px;">${errorMessage}</em><br/><br/>` : ""}
      If the issue persists, please contact us so we can resolve it quickly.
    </p>
    ${ctaButton(dashboardUrl, "View my instance →")}
  `);
}

export function paymentConfirmedEmailHTML({
	userName,
	orgName,
	amount,
	currency,
	invoiceNumber,
}: {
	userName: string;
	orgName: string;
	amount: number;
	currency: string;
	invoiceNumber: string;
}): string {
	const billingUrl = `${WEBSITE_URL}/dashboard/billing`;
	return emailShell(`
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Payment confirmed ✓</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${userName},<br/><br/>
      We have received your payment of <strong>${amount.toLocaleString()} ${currency}</strong>
      for invoice <strong>${invoiceNumber}</strong> — <em>${orgName}</em>.<br/><br/>
      Your subscription is now active. Thank you for trusting TKAMS.
    </p>
    ${ctaButton(billingUrl, "View billing →")}
  `);
}

export function forgotPasswordEmailHTML({
	token,
	userName,
}: {
	token: string;
	userName: string;
}): string {
	const resetUrl = `${WEBSITE_URL}/reset-password?token=${token}`;
	return emailShell(`
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Password reset</p>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${userName},<br/><br/>
      You requested a password reset for your TKAMS account. Click the button below to choose a new password.
    </p>
    ${ctaButton(resetUrl, "Reset my password")}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
      This link expires in <strong>1 hour</strong>. If you did not request a reset, ignore this email — your password remains unchanged.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
      Or copy this link: <a href="${resetUrl}" style="color:${BRAND_COLOR};text-decoration:none;">${resetUrl}</a>
    </p>
  `);
}
