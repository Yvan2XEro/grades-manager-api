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

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setTimeout(() => {
						el.dataset.visible = "true";
					}, delay);
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
