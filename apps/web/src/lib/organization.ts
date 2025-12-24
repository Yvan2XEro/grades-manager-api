/**
 * Detects the organization slug from the subdomain or falls back to environment variable.
 *
 * Examples:
 * - `inst-01.domain.com` → `inst-01`
 * - `localhost` → uses `VITE_DEFAULT_ORGANIZATION_SLUG`
 * - `127.0.0.1` → uses `VITE_DEFAULT_ORGANIZATION_SLUG`
 * - `domain.com` (single segment) → uses `VITE_DEFAULT_ORGANIZATION_SLUG`
 */
export function detectOrganizationSlug(): string {
	const host = window.location.host;

	// Localhost or IP addresses - use fallback
	if (
		host.startsWith("localhost") ||
		host.startsWith("127.0.0.1") ||
		host.startsWith("0.0.0.0") ||
		/^\d+\.\d+\.\d+\.\d+/.test(host) // IP address pattern
	) {
		return getFallbackSlug();
	}

	// Remove port if present
	const hostname = host.split(":")[0];

	// Split by dots and check if there's a subdomain
	const parts = hostname.split(".");

	// If only one or two parts (e.g., "domain.com"), use fallback
	if (parts.length <= 2) {
		return getFallbackSlug();
	}

	// Return the first part as the subdomain (organization slug)
	return parts[0];
}

function getFallbackSlug(): string {
	const fallback = import.meta.env.VITE_DEFAULT_ORGANIZATION_SLUG;
	if (!fallback) {
		throw new Error(
			"VITE_DEFAULT_ORGANIZATION_SLUG environment variable is required when not using subdomain-based organization detection",
		);
	}
	return fallback;
}
