import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Funnel_Display, JetBrains_Mono, Montserrat } from "next/font/google";
import { cn } from "@/utilities/ui";
import "../(frontend)/globals.css";

const funnelDisplay = Funnel_Display({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-display-family",
	display: "swap",
});

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="fr"
			data-theme="light"
			className={cn(
				GeistSans.variable,
				GeistMono.variable,
				funnelDisplay.variable,
				montserrat.variable,
				jetbrainsMono.variable,
			)}
		>
			<body>{children}</body>
		</html>
	);
}

export const metadata: Metadata = {
	title: "TKAMS — Espace client",
};
