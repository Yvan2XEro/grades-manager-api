import { db } from "../../db";

export function transaction<_T>(fn: Parameters<typeof db.transaction>[0]) {
	return db.transaction(fn);
}
