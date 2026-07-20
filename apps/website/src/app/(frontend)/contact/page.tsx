export const dynamic = "force-dynamic";

import configPromise from "@payload-config";
import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { contactForm as contactFormData } from "@/endpoints/seed/contact-form";
import { getDict, getLocale } from "@/i18n";
import { ContactPage } from "@/marketing/ContactPage";

async function getOrCreateContactForm(
	payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<FormType | null> {
	try {
		const result = await payload.find({
			collection: "forms",
			where: { title: { equals: "Contact Form" } },
			limit: 1,
		});

		if (result.docs.length > 0) {
			return result.docs[0] as unknown as FormType;
		}

		// Record missing — create it so the form-builder plugin handles submissions
		const created = await payload.create({
			collection: "forms",
			data: contactFormData,
		});
		return created as unknown as FormType;
	} catch {
		return null;
	}
}

export default async function Page() {
	const [locale, payload] = await Promise.all([
		getLocale(),
		getPayload({ config: configPromise }),
	]);
	const dict = getDict(locale);
	const contactForm = await getOrCreateContactForm(payload);

	return <ContactPage dict={dict} form={contactForm} />;
}

export const metadata: Metadata = {
	title: "Contact — TKAMS",
	description:
		"Contactez l'équipe TKAMS pour une démo ou des renseignements sur votre établissement.",
};
