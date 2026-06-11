import type React from "react";

type RangeLabels = {
	showing: string;
	of: string;
	posts: string;
	none: string;
};

const defaultRange: RangeLabels = {
	showing: "Showing",
	of: "of",
	posts: "results",
	none: "No results.",
};

export const PageRange: React.FC<{
	className?: string;
	currentPage?: number;
	limit?: number;
	totalDocs?: number;
	labels?: RangeLabels;
}> = (props) => {
	const { className, currentPage, limit, totalDocs, labels } = props;
	const t = labels ?? defaultRange;

	let indexStart = (currentPage ? currentPage - 1 : 1) * (limit || 1) + 1;
	if (totalDocs && indexStart > totalDocs) indexStart = 0;

	let indexEnd = (currentPage || 1) * (limit || 1);
	if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs;

	return (
		<div
			className={[
				className,
				"font-code text-[0.8rem] text-tk-muted tracking-[0.02em]",
			]
				.filter(Boolean)
				.join(" ")}
		>
			{(typeof totalDocs === "undefined" || totalDocs === 0) && t.none}
			{typeof totalDocs !== "undefined" &&
				totalDocs > 0 &&
				`${t.showing} ${indexStart}${indexStart > 0 ? `–${indexEnd}` : ""} ${t.of} ${totalDocs} ${t.posts}`}
		</div>
	);
};
