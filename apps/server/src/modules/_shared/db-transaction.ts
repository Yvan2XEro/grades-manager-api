import { db } from "../../db";

export type TransactionClient = Parameters<
	Parameters<typeof db.transaction>[0]
>[0];

export function transaction<_T>(
	fn: (tx: TransactionClient) => Promise<_T> | _T,
): Promise<_T> {
	return db.transaction(
		fn as Parameters<typeof db.transaction>[0],
	) as Promise<_T>;
}
