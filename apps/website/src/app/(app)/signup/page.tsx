import type { Metadata } from "next";
import { SignupForm } from "@/auth/SignupForm";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
	await getMeUser({ validUserRedirect: "/dashboard" });
	const locale = await getLocale();
	const dict = getDict(locale);
	return <SignupForm dict={dict} />;
}

export const metadata: Metadata = { title: "Créer un compte — TKAMS" };
