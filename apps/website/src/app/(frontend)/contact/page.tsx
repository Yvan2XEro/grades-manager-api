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

	return <ContactPage dict={dict} locale={locale} form={contactForm} />;
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const en = locale === "en";

	return {
		title: en ? "Contact — TKAMS" : "Contact — TKAMS",
		description: en
			? "Talk to the TKAMS team: free demonstration, quote, customer support. Based in Douala and Yaoundé, we reply within 24 business hours."
			: "Parlez à l'équipe TKAMS : démonstration gratuite, devis, support client. Basés à Douala et Yaoundé, nous répondons sous 24 h ouvrables.",
	};
}
