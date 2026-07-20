/**
 * Detects the organization slug from the subdomain or falls back to runtime configuration.
 *
 * Examples:
 * - `inst-01.domain.com` -> `inst-01`
 * - `localhost` -> uses runtime/default organization slug
 * - `127.0.0.1` -> uses runtime/default organization slug
 * - `domain.com` (single segment) -> uses runtime/default organization slug
 */
import { getDefaultOrganizationSlug } from "./runtime-config";

/**
 * Detects the organization slug from the subdomain or falls back to the
 * configured default. Returns undefined when running on a bare domain (cloud
 * root without a subdomain) — callers must handle this case gracefully.
 */
export function detectOrganizationSlug(): string | undefined {
	const fallback = getDefaultOrganizationSlug();
	if (fallback) return fallback;

	const host = window.location.host;

	// Localhost or IP — no subdomain to extract
	if (
		host.startsWith("localhost") ||
		host.startsWith("127.0.0.1") ||
		host.startsWith("0.0.0.0") ||
		/^\d+\.\d+\.\d+\.\d+/.test(host)
	) {
		return undefined;
	}

	const parts = host.split(":")[0].split(".");
	// Need at least 3 parts for a subdomain (sub.domain.tld)
	if (parts.length <= 2) return undefined;

	return parts[0];
}
