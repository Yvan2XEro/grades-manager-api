/** `path` with the `return` query param, or `path` alone when there is nothing to return to. */
export const withReturn = (
	path: string,
	callbackURL: string | null | undefined,
) =>
	callbackURL && callbackURL !== "null"
		? `${path}?return=${encodeURIComponent(callbackURL)}`
		: path;
