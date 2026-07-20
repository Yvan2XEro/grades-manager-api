"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * NavigationProgress — a thin top loading bar for client-side navigation.
 *
 * Since the marketing nav uses Next <Link> (client navigation), the browser's
 * native loading indicator never shows. This component starts a trickling
 * progress bar when an internal link is clicked and completes it once the
 * pathname actually changes, giving visitors feedback that a page is loading.
 */
export function NavigationProgress() {
	const pathname = usePathname();
	const [progress, setProgress] = useState(0);
	const [active, setActive] = useState(false);
	const timer = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		function start() {
			if (timer.current) return;
			setActive(true);
			setProgress(8);
			timer.current = setInterval(() => {
				setProgress((p) => (p >= 90 ? p : p + Math.max(1, (90 - p) * 0.12)));
			}, 200);
		}

		function onClick(e: MouseEvent) {
			if (
				e.defaultPrevented ||
				e.button !== 0 ||
				e.metaKey ||
				e.ctrlKey ||
				e.shiftKey ||
				e.altKey
			) {
				return;
			}
			const anchor = (e.target as HTMLElement | null)?.closest?.("a");
			if (!anchor) return;
			const href = anchor.getAttribute("href");
			if (!href || href.startsWith("#")) return;
			if (anchor.target && anchor.target !== "_self") return;
			if (anchor.hasAttribute("download")) return;

			let url: URL;
			try {
				url = new URL(href, window.location.href);
			} catch {
				return;
			}
			if (url.origin !== window.location.origin) return;
			if (
				url.pathname === window.location.pathname &&
				url.search === window.location.search
			) {
				return;
			}
			start();
		}

		document.addEventListener("click", onClick, { capture: true });
		return () =>
			document.removeEventListener("click", onClick, { capture: true });
	}, []);

	// Complete the bar once the route has actually changed (pathname update).
	useEffect(() => {
		if (!active) return;
		if (timer.current) {
			clearInterval(timer.current);
			timer.current = null;
		}
		setProgress(100);
		const id = window.setTimeout(() => {
			setActive(false);
			setProgress(0);
		}, 250);
		return () => window.clearTimeout(id);
	}, [pathname]);

	useEffect(() => {
		return () => {
			if (timer.current) clearInterval(timer.current);
		};
	}, []);

	if (!active && progress === 0) return null;

	return (
		<div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
			<div
				className="h-full bg-tk-primary shadow-[0_0_8px_var(--tk-primary)] transition-[width,opacity] duration-200 ease-out"
				style={{ width: `${progress}%`, opacity: active ? 1 : 0 }}
			/>
		</div>
	);
}
