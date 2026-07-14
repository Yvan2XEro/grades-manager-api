import type { Metadata } from "next";
import { InstanceWizard } from "@/dashboard/InstanceWizard";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function NewInstancePage() {
	await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);

	return <InstanceWizard dict={dict} />;
}

export const metadata: Metadata = { title: "Nouvelle instance — TKAMS" };
