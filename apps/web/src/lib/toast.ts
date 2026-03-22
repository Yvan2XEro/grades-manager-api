/**
 * Drop-in replacement for `import { toast } from "sonner"`.
 * Adds sound + haptic feedback for each toast type.
 * Also exports `celebrate()` for major success actions (sound + confetti + haptic).
 */
import { toast as sonner } from "sonner";
import { sounds } from "./sounds";
import { haptic } from "./haptic";

type SonnerToast = typeof sonner;

function wrap<T extends (...args: Parameters<T>) => ReturnType<T>>(
	fn: T,
	sound: () => void,
	hap?: () => void,
): T {
	return ((...args: Parameters<T>) => {
		sound();
		hap?.();
		return fn(...args);
	}) as T;
}

export const toast = Object.assign(
	((...args) => {
		sounds.notification();
		return sonner(...args);
	}) as SonnerToast,
	{
		...sonner,
		success: wrap(sonner.success, sounds.success, haptic.success),
		error: wrap(sonner.error, sounds.error, haptic.error),
		warning: wrap(sonner.warning, sounds.warning, haptic.warning),
		info: wrap(sonner.info, sounds.notification),
		loading: sonner.loading,
		promise: sonner.promise,
		dismiss: sonner.dismiss,
		custom: sonner.custom,
		message: sonner.message,
	},
) as SonnerToast;

/**
 * Major success: toast + confetti burst + sound + haptic.
 * Use this for grade submissions, deliberations, promotions, etc.
 */
export async function celebrate(message: string) {
	sonner.success(message);
	sounds.success();
	haptic.success();
	const { burst } = await import("./confetti");
	burst();
}
