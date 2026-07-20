import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/auth/ForgotPasswordForm";
import { getDict, getLocale } from "@/i18n";

export const metadata: Metadata = { title: "Mot de passe oublié — TKAMS" };

export default async function ForgotPasswordPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	return <ForgotPasswordForm dict={dict} />;
}
