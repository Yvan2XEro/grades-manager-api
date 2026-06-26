import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function NewInstancePage() {
	await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const _dict = getDict(locale);

	return <>Comming soon</>;
	//	return <InstanceWizard dict={dict} />;
}

export const metadata: Metadata = { title: "Nouvelle instance — TKAMS" };
