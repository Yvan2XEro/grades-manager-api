import { useEffect, useState } from "react";

/** Keeps a selection equal to every id of a freshly loaded list. */
export function useSelectAllOnLoad(ids: string[], active: boolean) {
	const [selected, setSelected] = useState<Set<string>>(new Set());
	useEffect(() => {
		if (!active || !ids.length) {
			setSelected(new Set());
			return;
		}
		setSelected((prev) => {
			if (prev.size === ids.length && ids.every((id) => prev.has(id))) {
				return prev;
			}
			return new Set(ids);
		});
	}, [ids, active]);

	const toggle = (id: string) =>
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	const setAll = (checked: boolean) => {
		if (!ids.length) return;
		setSelected(checked ? new Set(ids) : new Set());
	};
	return {
		selected,
		toggle,
		setAll,
		reset: () => setSelected(new Set()),
		allSelected: ids.length > 0 && selected.size === ids.length,
	};
}
