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
	return getDefaultOrganizationSlug();
}
