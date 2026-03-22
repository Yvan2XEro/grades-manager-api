/**
 * Haptic feedback via the Vibration API (mobile/Android Chrome).
 * Silently no-ops on unsupported platforms.
 */

const vib = (pattern: number | number[]) => {
	try {
		navigator.vibrate?.(pattern);
	} catch {
		// ignore
	}
};

export const haptic = {
	/** Very light tap — button click */
	light: () => vib(8),
	/** Medium tap — selection, toggle */
	medium: () => vib(20),
	/** Heavy tap — destructive confirm */
	heavy: () => vib(45),
	/** Double pulse — success */
	success: () => vib([10, 40, 10]),
	/** Long-short — error */
	error: () => vib([60, 30, 90]),
	/** Short buzz — warning */
	warning: () => vib([25, 20, 25]),
};
