import type { Metadata } from "next";
import { getServerSideURL } from "./getURL";

const defaultOpenGraph: Metadata["openGraph"] = {
	type: "website",
	description:
		"La plateforme SIS LMD-first pour les universités et IPES d'Afrique francophone. Délibérations en heures, non en semaines.",
	images: [
		{
			url: `${getServerSideURL()}/logo-tkams.png`,
		},
	],
	siteName: "TKAMS",
	title: "TKAMS — Tefoye and Kana Academic Management System",
};

export const mergeOpenGraph = (
	og?: Metadata["openGraph"],
): Metadata["openGraph"] => {
	return {
		...defaultOpenGraph,
		...og,
		images: og?.images ? og.images : defaultOpenGraph.images,
	};
};
