import { useEffect, useState } from "react";

export function useAnimatedCounter(target: number, duration = 1100) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (target <= 0) {
			setCount(0);
			return;
		}

		let startTime: number | null = null;

		const step = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const progress = Math.min((timestamp - startTime) / duration, 1);
			// Ease-out cubic
			const eased = 1 - (1 - progress) ** 3;
			setCount(Math.round(target * eased));
			if (progress < 1) {
				requestAnimationFrame(step);
			}
		};

		const raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [target, duration]);

	return count;
}
