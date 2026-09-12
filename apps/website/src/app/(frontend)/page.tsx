import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { Cta } from "@/marketing/sections/Cta";
import { Deployment } from "@/marketing/sections/Deployment";
import {
	EducationPaths,
	HigherEducationScope,
} from "@/marketing/sections/EducationPaths";
import { Faq } from "@/marketing/sections/Faq";
import { Features } from "@/marketing/sections/Features";
import { Hero } from "@/marketing/sections/Hero";
import { Modules } from "@/marketing/sections/Modules";
import { Pain } from "@/marketing/sections/Pain";
import { Pricing } from "@/marketing/sections/Pricing";
import { Stats } from "@/marketing/sections/Stats";
import { Trust } from "@/marketing/sections/Trust";
import { Workflow } from "@/marketing/sections/Workflow";

export default async function HomePage() {
	const locale = await getLocale();
	const dict = getDict(locale);

	return (
		<main style={{ paddingTop: 0 }}>
			<Hero dict={dict} />
			<EducationPaths dict={dict} />
			<HigherEducationScope dict={dict} />
			<Stats dict={dict} />
			<Pain dict={dict} />
			<Features dict={dict} />
			<Modules dict={dict} />
			<Workflow dict={dict} />
			<Pricing dict={dict} />
			<Deployment dict={dict} />
			<Trust dict={dict} locale={locale} />
			<Faq dict={dict} />
			<Cta dict={dict} />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const t = getDict(await getLocale()).hero;
	const title = `TKAMS — ${t.headline_1} ${t.headline_2}`;
	return {
		title,
		description: t.sub,
		openGraph: {
			title,
			description: t.sub,
			type: "website",
			siteName: "TKAMS",
			images: [{ url: "/logo-tkams.png" }],
		},
	};
}
