import configPromise from "@payload-config";
import { notFound } from "next/navigation";
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

export const dynamic = "force-dynamic";

type Args = {
	params: Promise<{
		pageNumber: string;
	}>;
};

export default async function Page({ params: paramsPromise }: Args) {
	const { pageNumber } = await paramsPromise;
	const payload = await getPayload({ config: configPromise });
	const locale = await getLocale();
	const d = getDict(locale).blog;

	const sanitizedPageNumber = Number(pageNumber);

	if (!Number.isInteger(sanitizedPageNumber)) notFound();

	const posts = await payload.find({
		collection: "posts",
		depth: 1,
		limit: 12,
		page: sanitizedPageNumber,
		overrideAccess: false,
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

			<CollectionArchive posts={posts.docs} />

			<div className="mx-auto max-w-[86rem] px-6 pb-24 lg:px-10">
				{posts?.page && posts?.totalPages > 1 && (
					<Pagination page={posts.page} totalPages={posts.totalPages} />
				)}
			</div>
		</main>
	);
}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const { pageNumber } = await paramsPromise;
	const locale = await getLocale();
	const d = getDict(locale).blog;
	return {
		title: `${d.title} — ${pageNumber || ""} — TKAMS`,
	};
}

export async function generateStaticParams() {
	try {
		const payload = await getPayload({ config: configPromise });
		const { totalDocs } = await payload.count({
			collection: "posts",
			overrideAccess: false,
		});

		const totalPages = Math.ceil(totalDocs / 10);
		const pages: { pageNumber: string }[] = [];
		for (let i = 1; i <= totalPages; i++) {
			pages.push({ pageNumber: String(i) });
		}
		return pages;
	} catch {
		return [];
	}
}
