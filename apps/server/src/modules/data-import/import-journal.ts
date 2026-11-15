import { TRPCError } from "@trpc/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { recomputeForStudent } from "@/modules/student-credit-ledger/student-credit-ledger.service";

/** Tables an import step may write, by journal name. */
const TABLES = {
	classes: schema.classes,
	domainUsers: schema.domainUsers,
	students: schema.students,
	enrollments: schema.enrollments,
	classCourses: schema.classCourses,
	studentCourseEnrollments: schema.studentCourseEnrollments,
	exams: schema.exams,
	grades: schema.grades,
	deliberationStudentResults: schema.deliberationStudentResults,
} as const;
export type JournalTable = keyof typeof TABLES;

/** Rows pointing to a table: undoing a creation is refused when one exists
 * that this import did not create itself. */
const DEPENDENTS: Partial<Record<JournalTable, [JournalTable, PgColumn][]>> = {
	classes: [
		["enrollments", schema.enrollments.classId],
		["classCourses", schema.classCourses.class],
	],
	domainUsers: [["students", schema.students.domainUserId]],
	students: [
		["enrollments", schema.enrollments.studentId],
		["studentCourseEnrollments", schema.studentCourseEnrollments.studentId],
		["grades", schema.grades.student],
	],
	classCourses: [
		["exams", schema.exams.classCourse],
		["studentCourseEnrollments", schema.studentCourseEnrollments.classCourseId],
	],
	exams: [
		["grades", schema.grades.exam],
		["exams", schema.exams.parentExamId],
	],
};

type Row = Record<string, unknown>;
const idOf = (table: JournalTable) =>
	(TABLES[table] as unknown as { id: PgColumn }).id;

/** Dates survive the JSON column as tagged strings. */
const encode = (values: Row) =>
	Object.fromEntries(
		Object.entries(values).map(([k, v]) => [
			k,
			v instanceof Date ? { $date: v.toISOString() } : v,
		]),
	);
const decode = (values: Row) =>
	Object.fromEntries(
		Object.entries(values).map(([k, v]) => [
			k,
			v && typeof v === "object" && "$date" in v
				? new Date(String((v as { $date: string }).$date))
				: v,
		]),
	);

/**
 * Records what an import job creates and changes. Steps call `created` with
 * the ids they inserted and `updated` with the values a row had before
 * (changed fields only); entries are written in order with `flush`.
 */
export class ImportJournal {
	private entries: (typeof schema.importJournalEntries.$inferInsert)[] = [];
	private seq = 0;

	constructor(private readonly jobId: string) {}

	created(table: JournalTable, ids: string[]) {
		for (const rowId of ids)
			this.entries.push({
				jobId: this.jobId,
				seq: this.seq++,
				tableName: table,
				rowId,
				action: "create",
			});
	}

	/** `before`: the row as it was; only the keys of `changed` are kept. */
	updated(table: JournalTable, rowId: string, before: Row, changed: Row) {
		const kept = Object.fromEntries(
			Object.keys(changed)
				.filter((key) => key !== "updatedAt")
				.map((key) => [key, before[key] ?? null]),
		);
		this.entries.push({
			jobId: this.jobId,
			seq: this.seq++,
			tableName: table,
			rowId,
			action: "update",
			before: encode(kept),
		});
	}

	async flush() {
		const entries = this.entries;
		this.entries = [];
		for (let i = 0; i < entries.length; i += 1000)
			await db
				.insert(schema.importJournalEntries)
				.values(entries.slice(i, i + 1000));
	}
}

/** A journal that records nothing (steps applied outside a job, tests). */
export const noJournal = {
	created() {},
	updated() {},
	async flush() {},
} as unknown as ImportJournal;

/**
 * Undoes an import job: refuses when data created since depends on what it
 * created (listing it), else deletes its creations and restores the values
 * it changed, latest first, then recomputes the credits of the students
 * whose grades changed.
 */
export async function undoImport(jobId: string, academicYearId?: string) {
	const entries = await db.query.importJournalEntries.findMany({
		where: eq(schema.importJournalEntries.jobId, jobId),
		orderBy: asc(schema.importJournalEntries.seq),
	});
	if (!entries.length)
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				"Cannot undo: this import has no journal (made before undo existed, or it changed nothing).",
		});
	const createdBy = new Map<JournalTable, Set<string>>();
	for (const e of entries)
		if (e.action === "create") {
			const table = e.tableName as JournalTable;
			createdBy.set(table, (createdBy.get(table) ?? new Set()).add(e.rowId));
		}

	// Dependencies created outside this import block the undo
	const blocking: {
		table: JournalTable;
		dependent: JournalTable;
		count: number;
	}[] = [];
	for (const [table, ids] of createdBy) {
		for (const [dependent, column] of DEPENDENTS[table] ?? []) {
			const refs = await db
				.select({ id: idOf(dependent) })
				.from(TABLES[dependent] as PgTable)
				.where(inArray(column, [...ids]));
			const own = createdBy.get(dependent) ?? new Set();
			const foreign = refs.filter((r) => !own.has(String(r.id)));
			if (foreign.length)
				blocking.push({ table, dependent, count: foreign.length });
		}
	}
	if (blocking.length)
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: `Cannot undo: data added since depends on this import (${blocking
				.map((b) => `${b.count} ${b.dependent} → ${b.table}`)
				.join(", ")}). Undo the later imports first.`,
			cause: { blocking },
		});

	// Students whose grades change: their credits are recomputed afterwards
	const gradeIds = entries
		.filter((e) => e.tableName === "grades")
		.map((e) => e.rowId);
	const touchedStudents = gradeIds.length
		? (
				await db
					.select({ student: schema.grades.student })
					.from(schema.grades)
					.where(inArray(schema.grades.id, gradeIds))
			).map((g) => g.student)
		: [];

	const latestFirst = await db.query.importJournalEntries.findMany({
		where: eq(schema.importJournalEntries.jobId, jobId),
		orderBy: desc(schema.importJournalEntries.seq),
	});
	for (const e of latestFirst) {
		const table = TABLES[e.tableName as JournalTable] as PgTable;
		const id = idOf(e.tableName as JournalTable);
		if (e.action === "create") await db.delete(table).where(eq(id, e.rowId));
		else if (e.before)
			await db
				.update(table)
				.set(decode(e.before) as never)
				.where(eq(id, e.rowId));
	}
	await db
		.delete(schema.importJournalEntries)
		.where(eq(schema.importJournalEntries.jobId, jobId));

	if (academicYearId)
		for (const studentId of new Set(touchedStudents))
			await recomputeForStudent(studentId, academicYearId);
	return { undone: entries.length };
}
