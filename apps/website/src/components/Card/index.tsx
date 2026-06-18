"use client";
import { ImageIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Fragment } from "react";
import { Media } from "@/components/Media";
import type { Post } from "@/payload-types";
import { cn } from "@/utilities/ui";
import useClickableCard from "@/utilities/useClickableCard";

export type CardPostData = Pick<Post, "slug" | "categories" | "meta" | "title">;

export const Card: React.FC<{
	alignItems?: "center";
	className?: string;
	doc?: CardPostData;
	relationTo?: "posts";
	showCategories?: boolean;
	title?: string;
}> = (props) => {
	const { card, link } = useClickableCard({});
	const {
		className,
		doc,
		relationTo,
		showCategories,
		title: titleFromProps,
	} = props;

	const { slug, categories, meta, title } = doc || {};
	const { description, image: metaImage } = meta || {};

	const hasCategories =
		categories && Array.isArray(categories) && categories.length > 0;
	const titleToUse = titleFromProps || title;
	const sanitizedDescription = description?.replace(/\s/g, " ");
	const href = `/${relationTo}/${slug}`;

	return (
		<article
			className={cn(
				"group hover:-translate-y-1 flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-tk-border bg-tk-surface transition-all duration-200 hover:border-tk-border-strong hover:shadow-[0_18px_50px_oklch(0.13_0.03_264/0.1)]",
				className,
			)}
			ref={card.ref}
		>
			<div className="relative aspect-[16/10] w-full overflow-hidden bg-tk-bg-deep">
				{metaImage && typeof metaImage !== "string" ? (
					<Media
						resource={metaImage}
						size="33vw"
						imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
						fill
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-tk-muted">
						<ImageIcon size={28} strokeWidth={1.5} />
					</div>
				)}
			</div>

			<div className="flex flex-1 flex-col p-5">
				{showCategories && hasCategories && (
					<div className="mb-3 font-code text-[0.68rem] text-tk-primary uppercase tracking-[0.1em]">
						{categories?.map((category, index) => {
							if (typeof category === "object") {
								const { title: titleFromCategory } = category;
								const categoryTitle = titleFromCategory || "—";
								const isLast = index === categories.length - 1;
								return (
									<Fragment key={index}>
										{categoryTitle}
										{!isLast && <Fragment>, &nbsp;</Fragment>}
									</Fragment>
								);
							}
							return null;
						})}
					</div>
				)}
				{titleToUse && (
					<h3 className="font-bold font-display text-[1.125rem] text-tk-ink leading-snug tracking-[-0.02em]">
						<Link
							className="transition-colors duration-150 group-hover:text-tk-primary"
							href={href}
							ref={link.ref}
						>
							{titleToUse}
						</Link>
					</h3>
				)}
				{description && (
					<p className="mt-2.5 line-clamp-3 font-body text-[0.9rem] text-tk-ink-2 leading-[1.65]">
						{sanitizedDescription}
					</p>
				)}
			</div>
		</article>
	);
};
