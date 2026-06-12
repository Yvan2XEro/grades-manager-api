"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Ghost cursor for the interactive demos: when a demo scrolls into view, an
 * animated pointer auto-plays a short scripted walkthrough (move, click, fill).
 * It disappears the moment the visitor interacts, so it never fights real input.
 * Skipped entirely under prefers-reduced-motion.
 */

type Pos = { x: number; y: number } | null;

export type GhostApi = {
	/** Move the cursor over the first element matching the selector (within the demo). */
	moveTo: (selector: string, settleMs?: number) => Promise<void>;
	/** Play a click pulse where the cursor currently is. */
	click: () => Promise<void>;
	sleep: (ms: number) => Promise<void>;
	/** True once the visitor took over — scripts should bail out. */
	cancelled: () => boolean;
};

export function useGhostCursor(
	containerRef: RefObject<HTMLElement | null>,
	script: (api: GhostApi) => Promise<void>,
) {
	const [pos, setPos] = useState<Pos>(null);
	const [clicking, setClicking] = useState(false);
	const scriptRef = useRef(script);
	scriptRef.current = script;

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

		let stopped = false;
		let started = false;

		const stop = () => {
			stopped = true;
			setPos(null);
			setClicking(false);
		};
		el.addEventListener("pointerdown", stop);
		el.addEventListener("keydown", stop);

		const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

		const api: GhostApi = {
			cancelled: () => stopped,
			sleep,
			moveTo: async (selector, settleMs = 650) => {
				if (stopped) return;
				const target = el.querySelector(selector) as HTMLElement | null;
				if (!target) return;
				const c = el.getBoundingClientRect();
				const t = target.getBoundingClientRect();
				setPos({
					x: t.left - c.left + t.width / 2,
					y: t.top - c.top + t.height / 2,
				});
				await sleep(settleMs);
			},
			click: async () => {
				if (stopped) return;
				setClicking(true);
				await sleep(200);
				setClicking(false);
				await sleep(160);
			},
		};

		const observer = new IntersectionObserver(
			async ([entry]) => {
				if (!entry.isIntersecting || started || stopped) return;
				started = true;
				await sleep(500);
				if (stopped) return;
				try {
					await scriptRef.current(api);
				} catch {
					// ignore — walkthrough is best-effort
				}
				if (!stopped) {
					await sleep(1100);
					if (!stopped) setPos(null);
				}
			},
			{ threshold: 0.55 },
		);
		observer.observe(el);

		return () => {
			stopped = true;
			observer.disconnect();
			el.removeEventListener("pointerdown", stop);
			el.removeEventListener("keydown", stop);
		};
	}, [containerRef]);

	return { pos, clicking };
}

export function GhostCursor({
	pos,
	clicking,
}: {
	pos: Pos;
	clicking: boolean;
}) {
	if (!pos) return null;
	return (
		<div
			className="pointer-events-none absolute top-0 left-0 z-30"
			style={{
				transform: `translate(${pos.x}px, ${pos.y}px)`,
				transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
			}}
			aria-hidden="true"
		>
			<div className="-translate-x-1 -translate-y-1 relative">
				{clicking && (
					<span className="-inset-3 absolute animate-ping rounded-full bg-tk-primary/40" />
				)}
				<span
					className={`absolute inset-0 rounded-full bg-tk-primary/20 transition-transform duration-200 ${
						clicking ? "scale-150" : "scale-0"
					}`}
				/>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					className="drop-shadow-[0_2px_4px_oklch(0_0_0/0.35)]"
				>
					<path
						d="M5 3l14 7-6 1.6L9.7 18 5 3z"
						fill="white"
						stroke="oklch(0.13 0.03 264)"
						strokeWidth="1.4"
						strokeLinejoin="round"
					/>
				</svg>
			</div>
		</div>
	);
}
