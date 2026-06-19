const REGISTRY = "ghcr.io";
const IMAGE_OWNER = process.env.GHCR_IMAGE_OWNER ?? "yvan2xero";
const IMAGE_NAME = process.env.GHCR_IMAGE_NAME ?? "tkams";

async function getToken(): Promise<string> {
	const res = await fetch(
		`https://${REGISTRY}/token?scope=repository:${IMAGE_OWNER}/${IMAGE_NAME}:pull&service=${REGISTRY}`,
	);
	const data = (await res.json()) as { token: string };
	return data.token;
}

export async function listAvailableTags(): Promise<string[]> {
	try {
		const token = await getToken();
		const res = await fetch(
			`https://${REGISTRY}/v2/${IMAGE_OWNER}/${IMAGE_NAME}/tags/list`,
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		// 404 = image not published yet — not an error worth surfacing
		if (!res.ok) return ["latest"];
		const data = (await res.json()) as { tags?: string[] };

		const semverRe = /^\d+\.\d+\.\d+$/;
		const semverTags = (data.tags ?? [])
			.filter((t) => semverRe.test(t))
			.sort((a, b) => {
				const [ma, mia, pa] = a.split(".").map(Number);
				const [mb, mib, pb] = b.split(".").map(Number);
				return mb - ma || mib - mia || pb - pa;
			});

		return ["latest", ...semverTags];
	} catch {
		return ["latest"];
	}
}
