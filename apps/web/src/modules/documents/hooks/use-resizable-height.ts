import { useEffect, useRef, useState } from "react";

// Resizable card height (px). Persisted across sessions so editors don't
// lose their preferred working size on every reload.
const HEIGHT_STORAGE_KEY = "exportTemplateEditor.cardHeight";
const MIN_CARD_HEIGHT = 320;
const MAX_CARD_HEIGHT = 2000;

/** Height of the editor/preview card, resized by dragging its bottom edge. */
export function useResizableHeight() {
	const [cardHeight, setCardHeight] = useState<number>(() => {
		if (typeof window === "undefined") return 600;
		const saved = window.localStorage.getItem(HEIGHT_STORAGE_KEY);
		const parsed = saved ? Number.parseInt(saved, 10) : Number.NaN;
		if (Number.isFinite(parsed) && parsed >= MIN_CARD_HEIGHT) return parsed;
		return Math.round(window.innerHeight * 0.75);
	});
	useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(HEIGHT_STORAGE_KEY, String(cardHeight));
	}, [cardHeight]);
	const dragStateRef = useRef<{ startY: number; startHeight: number } | null>(
		null,
	);
	const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		e.preventDefault();
		dragStateRef.current = { startY: e.clientY, startHeight: cardHeight };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		document.body.style.userSelect = "none";
		document.body.style.cursor = "row-resize";
	};
	const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragStateRef.current;
		if (!drag) return;
		const next = drag.startHeight + (e.clientY - drag.startY);
		setCardHeight(
			Math.max(MIN_CARD_HEIGHT, Math.min(MAX_CARD_HEIGHT, Math.round(next))),
		);
	};
	const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		dragStateRef.current = null;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		document.body.style.userSelect = "";
		document.body.style.cursor = "";
	};
	const resetHeight = () =>
		setCardHeight(Math.round(window.innerHeight * 0.75));

	return {
		cardHeight,
		resetHeight,
		resizeHandlers: {
			onPointerDown: handleResizePointerDown,
			onPointerMove: handleResizePointerMove,
			onPointerUp: handleResizePointerUp,
			onPointerCancel: handleResizePointerUp,
		},
	};
}
