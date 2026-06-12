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

		const reveal = () => {
			el.dataset.visible = "true";
		};

		// Respect reduced-motion: show everything immediately, no animation wait.
		const prefersReduced =
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		// On mount (incl. client-side back navigation), if the element is already
		// in or above the viewport, reveal it now. Otherwise it would stay hidden
		// forever because the observer only fires when an element *enters* view.
		const rect = el.getBoundingClientRect();
		const alreadyOnScreen = rect.top < window.innerHeight;

		if (prefersReduced || rect.top < 0) {
			reveal();
			return;
		}
		if (alreadyOnScreen) {
			const id = setTimeout(reveal, delay);
			return () => clearTimeout(id);
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setTimeout(reveal, delay);
					observer.disconnect();
				}
			},
			{ threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
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
