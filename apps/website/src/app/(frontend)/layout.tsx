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

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isEnabled } = await draftMode();
	const locale = await getLocale();
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
					{/* Language prompt disabled — locale defaults to French */}
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
		images: ["/logo-tkams.png"],
	},
};
