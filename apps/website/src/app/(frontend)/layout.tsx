import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { draftMode } from "next/headers";
import type React from "react";

import { AdminBar } from "@/components/AdminBar";
import { Providers } from "@/providers";
import { InitTheme } from "@/providers/Theme/InitTheme";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";
import { cn } from "@/utilities/ui";

import "./globals.css";
import { getLocale } from "@/i18n";
import { Footer } from "@/marketing/Footer";
import { Nav } from "@/marketing/Nav";
import { getServerSideURL } from "@/utilities/getURL";

const sora = Sora({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-sora",
	display: "swap",
});

const inter = Inter({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-inter",
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

	return (
		<html
			className={cn(
				GeistSans.variable,
				GeistMono.variable,
				sora.variable,
				inter.variable,
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
			<body>
				<Providers>
					<AdminBar
						adminBarProps={{
							preview: isEnabled,
						}}
					/>
					<Nav locale={locale} />
					{children}
					<Footer locale={locale} />
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
	},
};
