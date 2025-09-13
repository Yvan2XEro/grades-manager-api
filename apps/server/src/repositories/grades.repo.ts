import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, and, gt, sql } from "drizzle-orm";

export async function upsert(data: schema.NewGrade) {
  const [item] = await db
    .insert(schema.grades)
    .values(data)
    .onConflictDoUpdate({
      target: [schema.grades.student, schema.grades.exam],
      set: { score: data.score, updatedAt: new Date() },
    })
    .returning();
  return item;
}

export async function update(id: string, score: string) {
  const [item] = await db
    .update(schema.grades)
    .set({ score, updatedAt: new Date() })
    .where(eq(schema.grades.id, id))
    .returning();
  return item;
}

export async function remove(id: string) {
  await db.delete(schema.grades).where(eq(schema.grades.id, id));
}

export async function findById(id: string) {
  return db.query.grades.findFirst({ where: eq(schema.grades.id, id) });
}

export async function listByExam(opts: { examId: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  const items = await db
    .select()
    .from(schema.grades)
    .where(and(eq(schema.grades.exam, opts.examId), opts.cursor ? gt(schema.grades.id, opts.cursor) : undefined))
    .orderBy(schema.grades.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function listByStudent(opts: { studentId: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  const items = await db
    .select()
    .from(schema.grades)
    .where(and(eq(schema.grades.student, opts.studentId), opts.cursor ? gt(schema.grades.id, opts.cursor) : undefined))
    .orderBy(schema.grades.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function listByClassCourse(opts: { classCourseId: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  const rows = await db
    .select({ grade: schema.grades })
    .from(schema.grades)
    .innerJoin(schema.exams, eq(schema.grades.exam, schema.exams.id))
    .where(and(eq(schema.exams.classCourse, opts.classCourseId), opts.cursor ? gt(schema.grades.id, opts.cursor) : undefined))
    .orderBy(schema.grades.id)
    .limit(limit);
  const items = rows.map((r) => r.grade);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function avgForExam(examId: string) {
  const [row] = await db
    .select({ avg: sql`avg(${schema.grades.score})` })
    .from(schema.grades)
    .where(eq(schema.grades.exam, examId));
  return row?.avg as number | null;
}

export async function avgForCourse(courseId: string) {
  const [row] = await db
    .select({ avg: sql`avg(${schema.grades.score})` })
    .from(schema.grades)
    .innerJoin(schema.exams, eq(schema.grades.exam, schema.exams.id))
    .innerJoin(schema.classCourses, eq(schema.exams.classCourse, schema.classCourses.id))
    .where(eq(schema.classCourses.course, courseId));
  return row?.avg as number | null;
}

export async function avgForStudentInCourse(studentId: string, courseId: string) {
  const [row] = await db
    .select({ avg: sql`avg(${schema.grades.score})` })
    .from(schema.grades)
    .innerJoin(schema.exams, eq(schema.grades.exam, schema.exams.id))
    .innerJoin(schema.classCourses, eq(schema.exams.classCourse, schema.classCourses.id))
    .where(and(eq(schema.classCourses.course, courseId), eq(schema.grades.student, studentId)));
  return row?.avg as number | null;
}
