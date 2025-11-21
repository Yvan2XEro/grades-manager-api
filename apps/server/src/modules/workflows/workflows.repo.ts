import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function findWindow(classId: string, academicYearId: string) {
        return db.query.enrollmentWindows.findFirst({
                where: (t, { and: andWhere }) =>
                        andWhere(eq(t.classId, classId), eq(t.academicYearId, academicYearId)),
        });
}

export async function upsertWindow(
        classId: string,
        academicYearId: string,
        status: schema.EnrollmentWindowStatus,
) {
        const existing = await findWindow(classId, academicYearId);
        if (existing) {
                const [updated] = await db
                        .update(schema.enrollmentWindows)
                        .set({
                                status,
                                openedAt: status === "open" ? new Date() : existing.openedAt,
                                closedAt: status === "closed" ? new Date() : null,
                        })
                        .where(eq(schema.enrollmentWindows.id, existing.id))
                        .returning();
                return updated;
        }
        const [created] = await db
                .insert(schema.enrollmentWindows)
                .values({ classId, academicYearId, status })
                .returning();
        return created;
}

export async function listWindows() {
        return db.query.enrollmentWindows.findMany({
                orderBy: (t, { desc }) => [desc(t.openedAt ?? new Date())],
        });
}
