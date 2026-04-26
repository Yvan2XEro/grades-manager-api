import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { detectOrganizationSlug } from "../lib/organization";
import { getServerUrl } from "../lib/runtime-config";

export interface BrandingData {
	slug: string;
	nameFr: string;
	nameEn: string;
	shortName: string | null;
	sloganFr: string | null;
	sloganEn: string | null;
	logoUrl: string | null;
	coverImageUrl: string | null;
	contactEmail: string | null;
	website: string | null;
}

const serverUrl = getServerUrl();

/** Prepend server URL for relative paths, pass through absolute URLs. */
export function resolveUrl(url: string | null | undefined): string | undefined {
	if (!url) return undefined;
	if (url.startsWith("http://") || url.startsWith("https://")) return url;
	return `${serverUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fetchBranding(slug: string): Promise<BrandingData | null> {
	const res = await fetch(`${serverUrl}/api/public/branding/${slug}`);
	if (!res.ok) return null;
	return res.json();
}

export function useBranding() {
	const { i18n } = useTranslation();
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

	let slug: string | null = null;
	try {
		slug = detectOrganizationSlug();
	} catch {
		// No slug available
	}

	const query = useQuery({
		queryKey: ["public-branding", slug],
		queryFn: () => fetchBranding(slug!),
		enabled: !!slug,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});

	const data = query.data;

	return {
		...query,
		branding: data,
		institutionName: data ? (lang === "fr" ? data.nameFr : data.nameEn) : null,
		slogan: data ? (lang === "fr" ? data.sloganFr : data.sloganEn) : null,
		logoUrl: resolveUrl(data?.logoUrl),
		coverImageUrl: resolveUrl(data?.coverImageUrl),
		shortName: data?.shortName ?? null,
	};
}
