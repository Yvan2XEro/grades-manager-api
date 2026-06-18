import type { Metadata } from "next";
import { LoginForm } from "@/auth/LoginForm";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
	await getMeUser({ validUserRedirect: "/dashboard" });
	const locale = await getLocale();
	const dict = getDict(locale);
	return <LoginForm dict={dict} />;
}

export const metadata: Metadata = { title: "Connexion — TKAMS" };
