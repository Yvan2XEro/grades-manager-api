import { db } from "../../db";

export function transaction<T>(fn: Parameters<typeof db.transaction>[0]) {
  return db.transaction(fn);
}
