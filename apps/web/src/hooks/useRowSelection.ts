import { useCallback, useMemo, useState } from "react";

export function useRowSelection<T extends { id: string }>(items: T[]) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const toggle = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const toggleAll = useCallback(
		(checked: boolean) => {
			if (checked) {
				setSelectedIds(new Set(items.map((item) => item.id)));
			} else {
				setSelectedIds(new Set());
			}
		},
		[items],
	);

	const clear = useCallback(() => {
		setSelectedIds(new Set());
	}, []);

	const isAllSelected = useMemo(
		() => items.length > 0 && selectedIds.size === items.length,
		[items.length, selectedIds.size],
	);

	const isSomeSelected = useMemo(
		() => selectedIds.size > 0 && selectedIds.size < items.length,
		[items.length, selectedIds.size],
	);

	return {
		selectedIds,
		selectedCount: selectedIds.size,
		toggle,
		toggleAll,
		clear,
		isAllSelected,
		isSomeSelected,
		isSelected: (id: string) => selectedIds.has(id),
	};
}
