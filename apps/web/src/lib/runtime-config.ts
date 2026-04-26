function readConfigValue(value: string | null | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

function getWindowConfig() {
	if (typeof window === "undefined") {
		return {};
	}
	return window.__APP_CONFIG__ ?? {};
}

export function getServerUrl(): string {
	const value =
		readConfigValue(getWindowConfig().serverUrl) ??
		readConfigValue(import.meta.env.VITE_SERVER_URL);

	if (!value) {
		throw new Error(
			"Server URL is required. Set SERVER_PUBLIC_URL at container runtime or VITE_SERVER_URL for Vite-based development.",
		);
	}

	return value.replace(/\/$/, "");
}

export function getDefaultOrganizationSlug(): string {
	const value =
		readConfigValue(getWindowConfig().defaultOrganizationSlug) ??
		readConfigValue(import.meta.env.VITE_DEFAULT_ORGANIZATION_SLUG);

	if (!value) {
		throw new Error(
			"Default organization slug is required. Set DEFAULT_ORGANIZATION_SLUG at container runtime or VITE_DEFAULT_ORGANIZATION_SLUG for Vite-based development.",
		);
	}

	return value;
}
