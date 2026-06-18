import configPromise from "@payload-config";
import type { Metadata } from "next/types";
import { getPayload } from "payload";
import { CollectionArchive } from "@/components/CollectionArchive";
import { PageRange } from "@/components/PageRange";
import { Pagination } from "@/components/Pagination";
import { getDict, getLocale } from "@/i18n";
import {
	Lede,
	Rule,
	SectionHeading,
	SectionLabel,
} from "@/marketing/Editorial";
import PageClient from "./page.client";

export const dynamic = "force-static";
export const revalidate = 600;

export default async function Page() {
	const payload = await getPayload({ config: configPromise });
	const locale = await getLocale();
	const d = getDict(locale).blog;

	const posts = await payload.find({
		collection: "posts",
		depth: 1,
		limit: 12,
		overrideAccess: false,
		select: {
			title: true,
			slug: true,
			categories: true,
			meta: true,
		},
	});

	return (
		<main className="min-h-screen bg-tk-bg pt-[68px]">
			<PageClient />
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="pt-12 pb-10 lg:pt-16">
					<SectionLabel number="✶">{d.label}</SectionLabel>
					<SectionHeading as="h1" className="mt-6 max-w-3xl">
						{d.title}
					</SectionHeading>
					<Lede className="mt-5">{d.sub}</Lede>
				</div>
				<Rule />
				<div className="py-6">
					<PageRange
						currentPage={posts.page}
						limit={12}
						totalDocs={posts.totalDocs}
						labels={d.range}
					/>
				</div>
			</div>

			{posts.docs.length > 0 ? (
				<CollectionArchive posts={posts.docs} />
			) : (
				<div className="mx-auto max-w-[86rem] px-6 pb-20 font-body text-tk-ink-2 lg:px-10">
					{d.empty}
				</div>
			)}

			<div className="mx-auto max-w-[86rem] px-6 pb-24 lg:px-10">
				{posts.totalPages > 1 && posts.page && (
					<Pagination page={posts.page} totalPages={posts.totalPages} />
				)}
			</div>
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const d = getDict(locale).blog;
	return {
		title: `${d.title} — TKAMS`,
		description: d.sub,
	};
}
