import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getServerSideSitemap } from "next-sitemap";
import { getPayload } from "payload";

const getPagesSitemap = unstable_cache(
	async () => {
		const payload = await getPayload({ config });
		const SITE_URL =
			process.env.NEXT_PUBLIC_SERVER_URL ||
			process.env.VERCEL_PROJECT_PRODUCTION_URL ||
			"https://example.com";

		const results = await payload.find({
			collection: "pages",
			overrideAccess: false,
			draft: false,
			depth: 0,
			limit: 1000,
			pagination: false,
			where: {
				_status: {
					equals: "published",
				},
			},
			select: {
				slug: true,
				updatedAt: true,
			},
		});

		const dateFallback = new Date().toISOString();

		/*
		 * The hand-built marketing pages.
		 *
		 * This route only ever queried the Payload `pages` collection, so every
		 * page written in code — the homepage included — was absent from the
		 * sitemap. Those are the pages worth ranking, so they are listed here
		 * explicitly. Add a route to this array when you add a marketing page.
		 */
		const staticRoutes = [
			"/",
			"/produit",
			"/secondaire",
			"/fonctionnalites",
			"/securite",
			"/integrations",
			"/solutions",
			"/tarifs",
			"/engagements",
			"/comparatif",
			"/onreceipt",
			"/about",
			"/contact",
			"/posts",
			"/search",
			"/legal/privacy",
			"/legal/terms",
		];

		const defaultSitemap = staticRoutes.map((route) => ({
			loc: route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`,
			lastmod: dateFallback,
		}));

		const sitemap = results.docs
			? results.docs
					.filter((page) => Boolean(page?.slug))
					.map((page) => {
						return {
							loc:
								page?.slug === "home"
									? `${SITE_URL}/`
									: `${SITE_URL}/${page?.slug}`,
							lastmod: page.updatedAt || dateFallback,
						};
					})
			: [];

		/*
		 * A CMS page slugged "home" — or one sharing a slug with a coded route —
		 * would otherwise emit a second entry for a URL already listed above.
		 * The static entry wins: it is the page that actually renders.
		 */
		const staticLocs = new Set(defaultSitemap.map((e) => e.loc));

		return [
			...defaultSitemap,
			...sitemap.filter((entry) => !staticLocs.has(entry.loc)),
		];
	},
	["pages-sitemap"],
	{
		tags: ["pages-sitemap"],
	},
);

export async function GET() {
	const sitemap = await getPagesSitemap();

	return getServerSideSitemap(sitemap);
}
