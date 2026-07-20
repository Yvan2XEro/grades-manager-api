"use client";

import type React from "react";
import { useEffect, useRef } from "react";

interface AnimateInProps {
	children: React.ReactNode;
	delay?: number;
	className?: string;
	mode?: "slide" | "fade" | "scale";
}

export function AnimateIn({
	children,
	delay = 0,
	className,
	mode = "slide",
}: AnimateInProps) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const prefersReduced =
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (prefersReduced) {
			el.dataset.visible = "true";
			return;
		}

		let revealed = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let raf = 0;
		let observer: IntersectionObserver | null = null;

		function cleanup() {
			if (raf) cancelAnimationFrame(raf);
			if (timer) clearTimeout(timer);
			observer?.disconnect();
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			window.removeEventListener("pageshow", onPageShow);
		}

		function reveal(animate: boolean) {
			if (revealed || !el) return;
			revealed = true;
			cleanup();
			if (animate) {
				timer = setTimeout(() => {
					el.dataset.visible = "true";
				}, delay);
			} else {
				el.dataset.visible = "true";
			}
		}

		// Reveal anything already in OR above the viewport. This is the safety net
		// for browser back/forward scroll restoration, which jumps the scroll past
		// sections — the IntersectionObserver never fires for an element that goes
		// straight from below to above the fold, so it would otherwise stay hidden.
		function check() {
			if (revealed || !el) return;
			const top = el.getBoundingClientRect().top;
			if (top < 0) reveal(false);
			else if (top < window.innerHeight) reveal(true);
		}

		function onScroll() {
			check();
		}

		function onPageShow(e: PageTransitionEvent) {
			if (e.persisted) reveal(false);
		}

		observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) reveal(true);
			},
			{ threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
		);
		observer.observe(el);
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		window.addEventListener("pageshow", onPageShow);

		// Initial check + one after layout/scroll-restoration has settled.
		check();
		raf = requestAnimationFrame(check);

		return cleanup;
	}, [delay]);

	const animateAttr =
		mode === "fade"
			? "data-animate-fade"
			: mode === "scale"
				? "data-animate-scale"
				: "data-animate";

	return (
		<div ref={ref} {...{ [animateAttr]: "" }} className={className}>
			{children}
		</div>
	);
}
