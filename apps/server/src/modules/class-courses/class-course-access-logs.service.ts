import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

type AccessLogInput = {
	classCourseIds: string[];
	profileId: string;
	institutionId: string;
	source: schema.ClassCourseAccessSource;
};

export async function logDelegateCourseAccess({
	classCourseIds,
	profileId,
	institutionId,
	source,
}: AccessLogInput) {
	if (classCourseIds.length === 0) {
		return;
	}
	const uniqueIds = Array.from(new Set(classCourseIds));
	await db.insert(schema.classCourseAccessLogs).values(
		uniqueIds.map((classCourseId) => ({
			classCourseId,
			actorProfileId: profileId,
			institutionId,
			source,
			isDelegate: true,
		})),
	);
}
