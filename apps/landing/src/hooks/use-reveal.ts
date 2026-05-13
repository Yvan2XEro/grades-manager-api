import { useEffect, useRef } from "react";

export function useReveal() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = ref.current;
		if (!container) return;

		const targets = container.querySelectorAll(".reveal");

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("in");
					}
				});
			},
			{ threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
		);

		targets.forEach((t) => observer.observe(t));
		return () => observer.disconnect();
	}, []);

	return ref;
}
