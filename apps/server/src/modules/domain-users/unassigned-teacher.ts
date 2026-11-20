import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const UNASSIGNED_TEACHER_EMAIL = (institutionId: string) =>
	`unassigned-teacher@${institutionId}.invalid`;

/** Whether a teacher email is the "teacher not known yet" placeholder's. */
export function isUnassignedTeacherEmail(email: string | null | undefined) {
	return Boolean(
		email?.startsWith("unassigned-teacher@") && email.endsWith(".invalid"),
	);
}

/**
 * Profile standing for "teacher not known yet": a class course needs a
 * teacher, and history files or teaching units often have none. Created once
 * per institution, without an account (so nobody signs in as it); replaced
 * by the real teacher whenever one is given.
 */
export async function unassignedTeacher(institutionId: string) {
	const email = UNASSIGNED_TEACHER_EMAIL(institutionId);
	const existing = await db.query.domainUsers.findFirst({
		where: and(
			eq(schema.domainUsers.institutionId, institutionId),
			eq(schema.domainUsers.primaryEmail, email),
		),
	});
	if (existing) return existing.id;
	const [created] = await db
		.insert(schema.domainUsers)
		.values({
			firstName: "—",
			lastName: "Unassigned teacher",
			primaryEmail: email,
			institutionId,
		})
		.returning({ id: schema.domainUsers.id });
	return created.id;
}
