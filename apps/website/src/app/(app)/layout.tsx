import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { cn } from "@/utilities/ui";
import "../(frontend)/globals.css";

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="fr"
			data-theme="light"
			className={cn(
				GeistSans.variable,
				GeistMono.variable,
				sora.variable,
				inter.variable,
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
