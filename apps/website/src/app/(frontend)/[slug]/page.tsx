import configPromise from "@payload-config";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { getPayload, type RequiredDataFromCollectionSlug } from "payload";
import { cache } from "react";
import { RenderBlocks } from "@/blocks/RenderBlocks";
import { LivePreviewListener } from "@/components/LivePreviewListener";
import { PayloadRedirects } from "@/components/PayloadRedirects";
import { homeStatic } from "@/endpoints/seed/home-static";
import { RenderHero } from "@/heros/RenderHero";
import { generateMeta } from "@/utilities/generateMeta";
import PageClient from "./page.client";

export async function generateStaticParams() {
	try {
		const payload = await getPayload({ config: configPromise });
		const pages = await payload.find({
			collection: "pages",
			draft: false,
			limit: 1000,
			overrideAccess: false,
			pagination: false,
			select: {
				slug: true,
			},
		});

		return (
			pages.docs
				?.filter((doc) => doc.slug !== "home")
				.map(({ slug }) => ({ slug })) ?? []
		);
	} catch {
		return [];
	}
}

type Args = {
	params: Promise<{
		slug?: string;
	}>;
};

async function getDraft(): Promise<boolean> {
	try {
		const { isEnabled } = await draftMode();
		return isEnabled;
	} catch {
		return false;
	}
}

export default async function Page({ params: paramsPromise }: Args) {
	const draft = await getDraft();
	const { slug = "home" } = await paramsPromise;
	// Decode to support slugs with special characters
	const decodedSlug = decodeURIComponent(slug);
	const url = `/${decodedSlug}`;
	let page: RequiredDataFromCollectionSlug<"pages"> | null;

	page = await queryPageBySlug({
		slug: decodedSlug,
		draft,
	});

	// Remove this code once your website is seeded
	if (!page && slug === "home") {
		page = homeStatic;
	}

	if (!page) {
		return <PayloadRedirects url={url} />;
	}

	const { hero, layout } = page;

	return (
		<article className="pt-16 pb-24">
			<PageClient />
			{/* Allows redirects for valid pages too */}
			<PayloadRedirects disableNotFound url={url} />

			{draft && <LivePreviewListener />}

			<RenderHero {...hero} />
			<RenderBlocks blocks={layout} />
		</article>
	);
}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const { slug = "home" } = await paramsPromise;
	// Decode to support slugs with special characters
	const decodedSlug = decodeURIComponent(slug);
	const page = await queryPageBySlug({
		slug: decodedSlug,
		draft: await getDraft(),
	});

	return generateMeta({ doc: page });
}

const queryPageBySlug = cache(
	async ({ slug, draft }: { slug: string; draft: boolean }) => {
		const payload = await getPayload({ config: configPromise });

		const result = await payload.find({
			collection: "pages",
			draft,
			limit: 1,
			pagination: false,
			overrideAccess: draft,
			where: {
				slug: {
					equals: slug,
				},
			},
		});

		return result.docs?.[0] || null;
	},
);
