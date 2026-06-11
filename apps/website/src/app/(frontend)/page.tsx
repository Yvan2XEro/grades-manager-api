import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { Cta } from "@/marketing/sections/Cta";
import { Deployment } from "@/marketing/sections/Deployment";
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
			<Stats dict={dict} />
			<Pain dict={dict} />
			<Features dict={dict} />
			<Modules dict={dict} />
			<Workflow dict={dict} />
			<Pricing dict={dict} />
			<Deployment dict={dict} />
			<Trust dict={dict} />
			<Cta dict={dict} />
		</main>
	);
}

export const metadata: Metadata = {
	title: "TKAMS — Le SIS qui transforme vos délibérations",
	description:
		"TKAMS est une plateforme intégrée de gestion académique LMD pour les institutions africaines. Délibérations automatiques, exports officiels, RBAC, DIPLOMATION native.",
	openGraph: {
		title: "TKAMS — Tefoye and Kana Academic Management System",
		description:
			"La plateforme SIS LMD-first pour les universités et IPES d'Afrique francophone. Délibérations en heures, non en semaines.",
		type: "website",
		siteName: "TKAMS",
		images: [{ url: "/logo-tkams.png" }],
	},
};
