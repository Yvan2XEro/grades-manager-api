const PREFS_KEY = "gradeExport.prefs";

/** Filters of the grade export page remembered between visits. */
export function loadPrefs() {
	try {
		return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
	} catch {
		return {};
	}
}

export function savePrefs(patch: Record<string, unknown>) {
	try {
		const current = loadPrefs();
		localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
	} catch {}
}
