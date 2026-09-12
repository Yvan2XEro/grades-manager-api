import type { Metadata } from "next";
import { getServerSideURL } from "./getURL";

const defaultOpenGraph: Metadata["openGraph"] = {
	type: "website",
	description: "TKAMS — Gestion académique pour le supérieur et le secondaire.",
	images: [
		{
			url: `${getServerSideURL()}/logo-tkams.png`,
		},
	],
	siteName: "TKAMS",
	title: "TKAMS",
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
