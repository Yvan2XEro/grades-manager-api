import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Funnel_Display, JetBrains_Mono, Montserrat } from "next/font/google";
import { draftMode } from "next/headers";
import type React from "react";

import { AdminBar } from "@/components/AdminBar";
import { Providers } from "@/providers";
import { InitTheme } from "@/providers/Theme/InitTheme";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";
import { cn } from "@/utilities/ui";

import "./globals.css";
import { getLocale, hasChosenLocale } from "@/i18n";
import { CookieNotice } from "@/marketing/CookieNotice";
import { FloatingActions } from "@/marketing/FloatingActions";
import { Footer } from "@/marketing/Footer";
import { Nav } from "@/marketing/Nav";
import { NavigationProgress } from "@/marketing/NavigationProgress";
import { getServerSideURL } from "@/utilities/getURL";

/**
 * Headings and figures.
 *
 * Funnel Display replaces Sora: it is narrower and more sharply cut, so the
 * long French headlines this site carries fit on fewer lines without dropping
 * a size step, and its figures read more decisively in the estimator and the
 * pricing tables.
 */
const funnelDisplay = Funnel_Display({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-display-family",
	display: "swap",
});

/**
 * Body and interface text.
 *
 * Montserrat is geometric where Inter is neutral, which gives the running text
 * the same constructed feel as the Funnel Display headings instead of the
 * default-UI look Inter carries. Weight 700 is loaded because Montserrat's 600
 * is noticeably lighter than Inter's at the same nominal weight.
 *
 * `latin-ext` is needed for the French copy.
 */
const montserrat = Montserrat({
	subsets: ["latin", "latin-ext"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-body-family",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-jetbrains-mono",
	display: "swap",
});

async function getDraft(): Promise<boolean> {
	try {
		const { isEnabled } = await draftMode();
		return isEnabled;
	} catch {
		return false;
	}
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const isEnabled = await getDraft();
	const locale = await getLocale();
	// Read by the disabled LanguagePrompt below; kept so re-enabling it is a
	// one-line change rather than a re-derivation.
	const _localeChosen = await hasChosenLocale();

	return (
		<html
			className={cn(
				GeistSans.variable,
				GeistMono.variable,
				funnelDisplay.variable,
				montserrat.variable,
				jetbrainsMono.variable,
			)}
			lang={locale}
			// Marks this tree as the public site: globals.css steps the root type
			// scale to 80 % behind this attribute, while the customer dashboard —
			// which imports the same stylesheet — keeps the browser default.
			data-site="marketing"
			suppressHydrationWarning
		>
			<head>
				<InitTheme />
				<link href="/favicon.ico" rel="icon" sizes="32x32" />
				<link href="/favicon.svg" rel="icon" type="image/svg+xml" />
			</head>
			<body suppressHydrationWarning>
				<Providers>
					<AdminBar
						adminBarProps={{
							preview: isEnabled,
						}}
					/>
					<NavigationProgress />
					<Nav locale={locale} />
					{children}
					<Footer locale={locale} />
					{/*
					 * WhatsApp and back-to-top, above the page on every route.
					 *
					 * In the layout rather than per page: the published WhatsApp line was
					 * reachable only from /contact, one page out of seventeen, and a
					 * back-to-top control is needed on precisely the long pages nobody
					 * remembers to add it to.
					 */}
					<FloatingActions locale={locale} />
					{/*
					 * Cookie notice — information, not a consent gate.
					 *
					 * The site loads no tracker: only a language cookie, the session
					 * cookie once signed in, and two localStorage preferences. Those need
					 * disclosure, not permission, so this states what is set and links to
					 * the detail rather than offering an Accept/Reject choice that would
					 * be fictional. See `CookieNotice.tsx` — and read its note before
					 * adding any analytics, which would change the legal requirement.
					 */}
					<CookieNotice locale={locale} />
					{/*
					 * Language prompt intentionally disabled.
					 *
					 * The locale is inferred from `accept-language` with a French
					 * fallback (see `i18n/index.ts`), and the header carries an FR/EN
					 * switcher on every page, so nothing is unreachable. `LanguagePrompt`
					 * is kept and still works — re-enable it by restoring the line below
					 * along with `hasChosenLocale()`.
					 */}
					{/* {localeChosen ? null : <LanguagePrompt suggested={locale} />} */}
				</Providers>
			</body>
		</html>
	);
}

export const metadata: Metadata = {
	metadataBase: new URL(getServerSideURL()),
	openGraph: mergeOpenGraph(),
	twitter: {
		card: "summary_large_image",
		creator: "@tkams_app",
		title: "TKAMS — Tefoye and Kana Academic Management System",
		description:
			"La plateforme SIS LMD-first pour les universités et IPES d'Afrique francophone. Délibérations en heures, non en semaines.",
		images: ["/og-tkams.png"],
	},
};
