import Link from "next/link";
import { formatDateTime } from "src/utilities/formatDateTime";
import { Media } from "@/components/Media";
import { getDict, getLocale } from "@/i18n";
import type { Post } from "@/payload-types";
import { formatAuthors } from "@/utilities/formatAuthors";

export const PostHero = async ({ post }: { post: Post }) => {
	const { categories, heroImage, populatedAuthors, publishedAt, title } = post;
	const locale = await getLocale();
	const d = getDict(locale).blog;

	const hasAuthors =
		populatedAuthors &&
		populatedAuthors.length > 0 &&
		formatAuthors(populatedAuthors) !== "";

	return (
		<header className="bg-tk-bg pt-[68px]">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="pt-10 pb-8">
					<Link
						href="/posts"
						className="font-code text-[0.75rem] text-tk-muted tracking-[0.04em] no-underline transition-colors duration-150 hover:text-tk-ink-soft"
					>
						{d.back}
					</Link>

					{categories && categories.length > 0 && (
						<div className="mt-6 font-code text-[0.7rem] text-tk-primary uppercase tracking-[0.12em]">
							{categories.map((category, index) => {
								if (typeof category === "object" && category !== null) {
									const titleToUse = category.title || "—";
									const isLast = index === categories.length - 1;
									return (
										<span key={index}>
											{titleToUse}
											{!isLast && <span>, &nbsp;</span>}
										</span>
									);
								}
								return null;
							})}
						</div>
					)}

					<h1 className="mt-4 max-w-4xl font-display font-extrabold text-[clamp(1.875rem,4vw,3.25rem)] text-tk-ink leading-[1.08] tracking-[-0.04em]">
						{title}
					</h1>

					<div className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
						{hasAuthors && (
							<div>
								<p className="font-code text-[0.68rem] text-tk-muted uppercase tracking-[0.12em]">
									{d.author}
								</p>
								<p className="mt-1 font-body font-medium text-[0.9rem] text-tk-ink">
									{formatAuthors(populatedAuthors)}
								</p>
							</div>
						)}
						{publishedAt && (
							<div>
								<p className="font-code text-[0.68rem] text-tk-muted uppercase tracking-[0.12em]">
									{d.date_published}
								</p>
								<time
									dateTime={publishedAt}
									className="mt-1 block font-body font-medium text-[0.9rem] text-tk-ink"
								>
									{formatDateTime(publishedAt)}
								</time>
							</div>
						)}
					</div>
				</div>

				{heroImage && typeof heroImage !== "string" && (
					<div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-tk-border-strong">
						<Media
							fill
							priority
							imgClassName="object-cover"
							resource={heroImage}
						/>
					</div>
				)}
			</div>
		</header>
	);
};
