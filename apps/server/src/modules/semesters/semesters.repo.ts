import { asc } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function list() {
	const items = await db
		.select()
		.from(schema.semesters)
		.orderBy(asc(schema.semesters.orderIndex));
	return paginate(items, items.length);
}
