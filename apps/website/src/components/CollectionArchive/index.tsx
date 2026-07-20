import type React from "react";
import { Card, type CardPostData } from "@/components/Card";

export type Props = {
	posts: CardPostData[];
};

export const CollectionArchive: React.FC<Props> = (props) => {
	const { posts } = props;

	return (
		<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{posts?.map((result, index) => {
					if (typeof result === "object" && result !== null) {
						return (
							<Card
								key={index}
								className="h-full"
								doc={result}
								relationTo="posts"
								showCategories
							/>
						);
					}
					return null;
				})}
			</div>
		</div>
	);
};
