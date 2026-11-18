"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";

/**
 * OnReceipt screen gallery.
 *
 * These are real captures of version 2.0.1, not mockups, so the page says so:
 * the product's credibility rests on a registrar recognising the interface they
 * will actually operate.
 *
 * A thumbnail strip drives one large frame rather than a grid of small images,
 * because these screens are dense — a 400px tile of a column-mapping table
 * proves nothing. Clicking a thumbnail swaps the frame; the frame itself opens
 * a full-size lightbox for anyone who wants to read the fine print.
 */

export type Shot = {
	src: string;
	title: string;
	caption: string;
	/** Intrinsic dimensions, needed by next/image for a non-fill layout. */
	width: number;
	height: number;
};

export function Gallery({
	shots,
	closeLabel = "Fermer",
}: {
	shots: Shot[];
	closeLabel?: string;
}) {
	const [active, setActive] = useState(0);
	const [zoomed, setZoomed] = useState(false);
	const groupId = useId();
	const shot = shots[active];

	const close = useCallback(() => setZoomed(false), []);

	useEffect(() => {
		if (!zoomed) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		window.addEventListener("keydown", onKey);
		// Prevent the page behind the lightbox from scrolling with it.
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = previous;
		};
	}, [zoomed, close]);

	if (!shot) return null;

	return (
		<div>
			{/* Main frame */}
			<figure className="m-0">
				<button
					type="button"
					onClick={() => setZoomed(true)}
					className="group block w-full cursor-zoom-in overflow-hidden rounded-xl border border-tk-border-strong bg-tk-surface p-0 shadow-[0_18px_44px_oklch(0.19_0.026_277/0.14)]"
					aria-label={`${shot.title} — agrandir`}
				>
					<Image
						src={shot.src}
						alt={shot.title}
						width={shot.width}
						height={shot.height}
						className="h-auto w-full"
						priority={active === 0}
					/>
				</button>
				<figcaption className="mt-3 font-body text-[0.875rem] text-tk-ink-2 leading-relaxed">
					<span className="font-semibold text-tk-ink">{shot.title}</span>
					{" — "}
					{shot.caption}
				</figcaption>
			</figure>

			{/* Thumbnails */}
			<div
				role="tablist"
				aria-label="Écrans du logiciel"
				className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-5"
			>
				{shots.map((s, i) => (
					<button
						key={s.src}
						type="button"
						role="tab"
						id={`${groupId}-tab-${i}`}
						aria-selected={i === active}
						onClick={() => setActive(i)}
						className={`overflow-hidden rounded-lg border bg-tk-surface p-0 transition-colors ${
							i === active
								? "border-tk-primary ring-2 ring-tk-primary/25"
								: "border-tk-border hover:border-tk-border-strong"
						}`}
					>
						<Image
							src={s.src}
							alt={s.title}
							width={s.width}
							height={s.height}
							className="h-auto w-full"
						/>
						<span className="sr-only">{s.title}</span>
					</button>
				))}
			</div>

			{/* Lightbox */}
			{zoomed ? (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-tk-ink/90 p-4 sm:p-8"
					onClick={close}
					role="dialog"
					aria-modal="true"
					aria-label={shot.title}
				>
					<button
						type="button"
						onClick={close}
						className="absolute top-4 right-4 z-10 cursor-pointer rounded-md border border-white/30 bg-white/10 px-4 py-2 font-body font-medium text-[0.85rem] text-white backdrop-blur-sm transition-colors hover:bg-white/20"
					>
						{closeLabel}
					</button>
					<div
						className="max-h-full w-full max-w-[80rem] overflow-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<Image
							src={shot.src}
							alt={shot.title}
							width={shot.width}
							height={shot.height}
							className="h-auto w-full rounded-lg"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
