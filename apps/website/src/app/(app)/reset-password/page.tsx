import type { Metadata } from "next";
import { ResetPasswordForm } from "@/auth/ResetPasswordForm";
import { getDict, getLocale } from "@/i18n";

export const metadata: Metadata = { title: "Nouveau mot de passe — TKAMS" };

export default async function ResetPasswordPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	return <ResetPasswordForm dict={dict} />;
}
