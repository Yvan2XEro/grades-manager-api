"use client";

import type React from "react";
import { useEffect, useRef } from "react";

/**
 * Scroll reveal, with an optional stagger across a group's children.
 *
 * `AnimateIn` already reveals a single block well — IntersectionObserver, a
 * scroll-restoration safety net, and `prefers-reduced-motion` honoured. What it
 * cannot do is the thing this page needs most: reveal a grid of nine workflow
 * stages or six exclusions *in sequence*, so the eye is led along the row
 * instead of being handed the whole block at once.
 *
 * `stagger` sets the delay added per child, in milliseconds. A group reveals as
 * one observation, so a slow scroll never leaves half a grid hidden.
 *
 * Motion discipline for this site:
 *   - one direction: content rises, nothing slides sideways or spins;
 *   - one curve, `--tk-ease`, shared with every other transition;
 *   - short: 600ms for the move, 40–70ms between siblings. A stagger you can
 *     count is a stagger that is too slow.
 *
 * The product sells the end of administrative drift — rules that apply
 * themselves, a decision that lands. Motion here should feel decided, not
 * floaty, which is why nothing bounces and nothing overshoots.
 */
export function Reveal({
	children,
	delay = 0,
	stagger = 0,
	className,
	as: Tag = "div",
}: {
	children: React.ReactNode;
	/** Delay before this block starts, in ms. */
	delay?: number;
	/** Per-child delay, in ms. 0 reveals the block as one piece. */
	stagger?: number;
	className?: string;
	as?: "div" | "ul" | "ol" | "dl" | "section";
}) {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const reduced =
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		/** Children carry their own delay so one observation drives the cascade. */
		const targets = stagger > 0 ? Array.from(el.children) : [el];
		for (const [i, node] of targets.entries()) {
			if (node instanceof HTMLElement) {
				node.style.setProperty("--tk-reveal-delay", `${delay + i * stagger}ms`);
				node.dataset.reveal = "";
			}
		}

		if (reduced) {
			for (const node of targets) {
				if (node instanceof HTMLElement) node.dataset.revealed = "true";
			}
			return;
		}

		let done = false;
		let observer: IntersectionObserver | null = null;

		function show() {
			if (done) return;
			done = true;
			for (const node of targets) {
				if (node instanceof HTMLElement) node.dataset.revealed = "true";
			}
			observer?.disconnect();
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("pageshow", onPageShow);
		}

		/*
		 * Safety net for back/forward scroll restoration: the browser can jump the
		 * scroll past a section entirely, so the observer never fires for an
		 * element that goes straight from below the fold to above it.
		 */
		function check() {
			if (done || !el) return;
			if (el.getBoundingClientRect().top < window.innerHeight) show();
		}
		function onScroll() {
			check();
		}
		function onPageShow(e: PageTransitionEvent) {
			if (e.persisted) show();
		}

		observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) show();
			},
			{ threshold: 0.08, rootMargin: "0px 0px -48px 0px" },
		);
		observer.observe(el);
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("pageshow", onPageShow);
		check();

		return () => {
			observer?.disconnect();
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("pageshow", onPageShow);
		};
	}, [delay, stagger]);

	/*
	 * `Tag` is polymorphic, so each candidate element narrows `ref` to its own
	 * type and the intersection has no common assignable ref. A callback ref
	 * sidesteps that: it accepts the base `HTMLElement` every branch extends.
	 */
	return (
		<Tag
			ref={(node: HTMLElement | null) => {
				ref.current = node;
			}}
			className={className}
			data-reveal-group={stagger > 0 ? "" : undefined}
		>
			{children}
		</Tag>
	);
}
