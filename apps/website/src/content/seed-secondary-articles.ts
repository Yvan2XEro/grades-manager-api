import { secondaryArticles, toPayloadDraft } from "./secondary-articles";

// Preview is offline. --write explicitly creates drafts in the configured CMS.
if (!process.argv.includes("--write")) {
	console.log(JSON.stringify(secondaryArticles.map(toPayloadDraft), null, 2));
} else {
	const { default: config } = await import("../payload.config");
	const { getPayload } = await import("payload");
	const payload = await getPayload({ config });
	try {
		for (const article of secondaryArticles) {
			const existing = await payload.find({
				collection: "posts",
				where: { slug: { equals: article.slug } },
				limit: 1,
				depth: 0,
				draft: true,
				overrideAccess: true,
			});
			if (existing.docs.length) {
				console.log(`Already exists, unchanged: ${article.slug}`);
				continue;
			}
			const post = await payload.create({
				collection: "posts",
				data: toPayloadDraft(article),
				draft: true,
				overrideAccess: true,
				context: { disableRevalidate: true },
			});
			console.log(`Draft created: ${post.id} (${post.slug})`);
		}
	} finally {
		await payload.destroy();
	}
}
