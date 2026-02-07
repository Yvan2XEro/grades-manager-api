function resolveBooleanEnv(value: string | undefined, defaultValue: boolean) {
	if (value === undefined) return defaultValue;
	const normalized = value.trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;
	return defaultValue;
}

export function isRetakesFeatureEnabled() {
	return resolveBooleanEnv(process.env.RETAKES_FEATURE_FLAG, false);
}
