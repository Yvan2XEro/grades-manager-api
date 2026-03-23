import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a ref to attach to a sentinel element at the bottom of a list.
 * When that element becomes visible, `onIntersect` is called (e.g. fetchNextPage).
 */
export function useInfiniteScroll(
	onIntersect: () => void,
	{ enabled = true }: { enabled?: boolean } = {},
) {
	const ref = useRef<HTMLDivElement>(null);
	const cb = useCallback(onIntersect, [onIntersect]);

	useEffect(() => {
		if (!enabled || !ref.current) return;
		const el = ref.current;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) cb();
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [cb, enabled]);

	return ref;
}
