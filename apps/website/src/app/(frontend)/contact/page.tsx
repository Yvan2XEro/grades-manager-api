import configPromise from "@payload-config";
import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { getDict, getLocale } from "@/i18n";
import { ContactPage } from "@/marketing/ContactPage";

export default async function Page() {
	const [locale, payload] = await Promise.all([
		getLocale(),
		getPayload({ config: configPromise }),
	]);
	const dict = getDict(locale);

	let contactForm: FormType | null = null;
	try {
		const result = await payload.find({
			collection: "forms",
			where: { title: { equals: "Contact Form" } },
			limit: 1,
		});
		contactForm = (result.docs[0] as unknown as FormType) ?? null;
	} catch {
		// Payload unavailable — fallback to email link
	}

	return <ContactPage dict={dict} form={contactForm} />;
}

export const metadata: Metadata = {
	title: "Contact — TKAMS",
	description:
		"Contactez l'équipe TKAMS pour une démo ou des renseignements sur votre établissement.",
};
