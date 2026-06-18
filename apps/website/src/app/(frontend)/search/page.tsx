export const dynamic = "force-dynamic";

import configPromise from "@payload-config";
import type { Metadata } from "next/types";
import { getPayload } from "payload";
import type { CardPostData } from "@/components/Card";
import { CollectionArchive } from "@/components/CollectionArchive";
import { getDict, getLocale } from "@/i18n";
import {
	Lede,
	Rule,
	SectionHeading,
	SectionLabel,
} from "@/marketing/Editorial";
import { Search } from "@/search/Component";
import PageClient from "./page.client";

type Args = {
	searchParams: Promise<{
		q: string;
	}>;
};
export default async function Page({
	searchParams: searchParamsPromise,
}: Args) {
	const { q: query } = await searchParamsPromise;
	const payload = await getPayload({ config: configPromise });
	const locale = await getLocale();
	const d = getDict(locale).blog;

	const posts = await payload.find({
		collection: "search",
		depth: 1,
		limit: 12,
		select: {
			title: true,
			slug: true,
			categories: true,
			meta: true,
		},
		pagination: false,
		...(query
			? {
					where: {
						or: [
							{ title: { like: query } },
							{ "meta.description": { like: query } },
							{ "meta.title": { like: query } },
							{ slug: { like: query } },
						],
					},
				}
			: {}),
	});

	return (
		<main className="min-h-screen bg-tk-bg pt-[68px]">
			<PageClient />
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="pt-12 pb-10 lg:pt-16">
					<SectionLabel number="✶">{d.search.label}</SectionLabel>
					<SectionHeading as="h1" className="mt-6">
						{d.search.title}
					</SectionHeading>
					<Lede className="mt-5">{d.search.sub}</Lede>
					<div className="mt-8 max-w-[40rem]">
						<Search placeholder={d.search.placeholder} />
					</div>
				</div>
				<Rule />
			</div>

			<div className="pt-12">
				{posts.totalDocs > 0 ? (
					<CollectionArchive posts={posts.docs as CardPostData[]} />
				) : (
					<div className="mx-auto max-w-[86rem] px-6 pb-20 font-body text-tk-ink-2 lg:px-10">
						{d.search.no_results}
					</div>
				)}
			</div>
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const d = getDict(locale).blog;
	return {
		title: `${d.search.title} — TKAMS`,
	};
}
