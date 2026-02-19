import { useCallback, useState } from "react";

type UseCursorPaginationOptions = {
	pageSize?: number;
};

export function useCursorPagination({
	pageSize = 20,
}: UseCursorPaginationOptions = {}) {
	const [cursor, setCursor] = useState<string | undefined>();
	const [prevCursors, setPrevCursors] = useState<string[]>([]);

	const handleNext = useCallback(
		(nextCursor: string | undefined) => {
			if (nextCursor) {
				setPrevCursors((p) => [...p, cursor ?? ""]);
				setCursor(nextCursor);
			}
		},
		[cursor],
	);

	const handlePrev = useCallback(() => {
		const prev = prevCursors[prevCursors.length - 1];
		setPrevCursors((p) => p.slice(0, -1));
		setCursor(prev || undefined);
	}, [prevCursors]);

	const reset = useCallback(() => {
		setCursor(undefined);
		setPrevCursors([]);
	}, []);

	return {
		cursor,
		pageSize,
		hasPrev: prevCursors.length > 0,
		handleNext,
		handlePrev,
		reset,
	};
}
