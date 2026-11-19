import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { funnelDisplay, jetbrainsMono, montserrat } from "@/fonts";
import { cn } from "@/utilities/ui";
import "../(frontend)/globals.css";

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
