export function paginate<T extends { id: string }>(items: T[], limit: number) {
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}
