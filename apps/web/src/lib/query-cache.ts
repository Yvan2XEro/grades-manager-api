/**
 * Helpers to insert a freshly created entity into a cached list response,
 * so a select fed by that query can show and select it without waiting for a
 * refetch. Use them with the typed query key of the tRPC options proxy:
 *
 *   queryClient.setQueryData(trpc.faculties.list.queryKey(input), (old) =>
 *     upsertInList(old, created),
 *   );
 *
 * Supports both plain arrays and paginated `{ items, total }` responses. The
 * item type is inferred from the cached data, so a created entity whose shape
 * differs from the list items fails to compile instead of corrupting the cache.
 */

type Identified = { id: string };

export type ListItem<D> = D extends readonly (infer T)[]
	? T
	: D extends { items: readonly (infer T)[] }
		? T
		: never;

export function upsertInList<D>(
	old: D | undefined,
	item: ListItem<D> & Identified,
): D | undefined {
	if (!old) return old;
	const merge = (items: readonly Identified[]) => {
		const exists = items.some((i) => i.id === item.id);
		return exists
			? items.map((i) => (i.id === item.id ? { ...i, ...item } : i))
			: [...items, item];
	};
	if (Array.isArray(old)) return merge(old) as D;
	const paginated = old as unknown as { items: Identified[]; total?: number };
	const exists = paginated.items.some((i) => i.id === item.id);
	return {
		...paginated,
		items: merge(paginated.items),
		...(typeof paginated.total === "number" && !exists
			? { total: paginated.total + 1 }
			: {}),
	} as D;
}
