import { and, eq, exists, isNull, or, type SQL, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { notFound } from "./errors";

/**
 * Ownership checks for ids received in input: an id of another institution
 * is answered as NOT_FOUND, exactly like an id that does not exist, so a
 * tenant cannot even learn that the record is there.
 */

export type InstitutionScope = {
	id: string;
	organizationId?: string | null;
};

export async function requireStudentInInstitution(
	studentId: string,
	institutionId: string,
) {
	const student = await db.query.students.findFirst({
		where: and(
			eq(schema.students.id, studentId),
			eq(schema.students.institutionId, institutionId),
		),
	});
	if (!student) throw notFound("Student not found");
	return student;
}

export async function requireClassInInstitution(
	classId: string,
	institutionId: string,
) {
	const klass = await db.query.classes.findFirst({
		where: and(
			eq(schema.classes.id, classId),
			eq(schema.classes.institutionId, institutionId),
		),
	});
	if (!klass) throw notFound("Class not found");
	return klass;
}

export async function requireProgramInInstitution(
	programId: string,
	institutionId: string,
) {
	const program = await db.query.programs.findFirst({
		where: and(
			eq(schema.programs.id, programId),
			eq(schema.programs.institutionId, institutionId),
		),
	});
	if (!program) throw notFound("Program not found");
	return program;
}

export async function requireAcademicYearInInstitution(
	academicYearId: string,
	institutionId: string,
) {
	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, academicYearId),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
	if (!year) throw notFound("Academic year not found");
	return year;
}

/**
 * SQL condition: the domain user referenced by `profileIdColumn` belongs to
 * the institution — bound to it explicitly, a member of its organization
 * (legacy profiles without `institutionId`), or one of its students.
 */
export function profileInInstitution(
	profileIdColumn: AnyPgColumn | SQL,
	institution: InstitutionScope,
): SQL {
	const conditions: (SQL | undefined)[] = [
		eq(schema.domainUsers.institutionId, institution.id),
		exists(
			db
				.select({ id: schema.students.id })
				.from(schema.students)
				.where(
					and(
						eq(schema.students.domainUserId, schema.domainUsers.id),
						eq(schema.students.institutionId, institution.id),
					),
				),
		),
	];
	if (institution.organizationId) {
		conditions.push(
			and(
				isNull(schema.domainUsers.institutionId),
				exists(
					db
						.select({ id: authSchema.member.id })
						.from(authSchema.member)
						.where(
							and(
								eq(authSchema.member.id, schema.domainUsers.memberId),
								eq(
									authSchema.member.organizationId,
									institution.organizationId,
								),
							),
						),
				),
			),
		);
	}
	return exists(
		db
			.select({ id: schema.domainUsers.id })
			.from(schema.domainUsers)
			.where(
				and(
					sql`${schema.domainUsers.id} = ${profileIdColumn}`,
					or(...conditions),
				),
			),
	);
}

export async function requireProfileInInstitution(
	profileId: string,
	institution: InstitutionScope,
) {
	const [row] = await db
		.select({ id: schema.domainUsers.id })
		.from(schema.domainUsers)
		.where(
			and(
				eq(schema.domainUsers.id, profileId),
				profileInInstitution(sql`${profileId}`, institution),
			),
		)
		.limit(1);
	if (!row) throw notFound("User not found");
	return row.id;
}
