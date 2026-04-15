interface AppRuntimeConfig {
	serverUrl?: string;
	defaultOrganizationSlug?: string;
}

declare global {
	interface Window {
		__APP_CONFIG__?: AppRuntimeConfig;
	}
}

export {};
