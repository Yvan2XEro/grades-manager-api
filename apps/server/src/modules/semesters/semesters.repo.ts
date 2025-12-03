import { asc } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export async function list() {
	return db
		.select()
		.from(schema.semesters)
		.orderBy(asc(schema.semesters.orderIndex));
}
