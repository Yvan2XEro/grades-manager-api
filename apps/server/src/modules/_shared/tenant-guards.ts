import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { notFound } from "./errors";

/*
 * Ownership checks for ids received from clients. Each one throws NOT_FOUND
 * when the record does not exist OR belongs to another institution, so a
 * caller cannot tell a foreign id from a missing one.
 */

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

export async function requireStudyCycleInInstitution(
	cycleId: string,
	institutionId: string,
) {
	const cycle = await db.query.studyCycles.findFirst({
		where: and(
			eq(schema.studyCycles.id, cycleId),
			eq(schema.studyCycles.institutionId, institutionId),
		),
	});
	if (!cycle) throw notFound("Study cycle not found");
	return cycle;
}

export async function requireCenterInInstitution(
	centerId: string,
	institutionId: string,
) {
	const center = await db.query.centers.findFirst({
		where: and(
			eq(schema.centers.id, centerId),
			eq(schema.centers.institutionId, institutionId),
		),
		columns: { id: true },
	});
	if (!center) throw notFound("Center not found");
	return center;
}

export async function requireExportTemplatesInInstitution(
	templateIds: string[],
	institutionId: string,
) {
	const unique = [...new Set(templateIds)];
	if (unique.length === 0) return;
	const rows = await db
		.select({ id: schema.exportTemplates.id })
		.from(schema.exportTemplates)
		.where(
			and(
				inArray(schema.exportTemplates.id, unique),
				eq(schema.exportTemplates.institutionId, institutionId),
			),
		);
	if (rows.length !== unique.length)
		throw notFound("Export template not found");
}

/** Courses belong to an institution through their program. */
export async function requireCoursesInInstitution(
	courseIds: string[],
	institutionId: string,
) {
	const unique = [...new Set(courseIds)];
	if (unique.length === 0) return;
	const rows = await db
		.select({ id: schema.courses.id })
		.from(schema.courses)
		.innerJoin(schema.programs, eq(schema.programs.id, schema.courses.program))
		.where(
			and(
				inArray(schema.courses.id, unique),
				eq(schema.programs.institutionId, institutionId),
			),
		);
	if (rows.length !== unique.length) throw notFound("Course not found");
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
		columns: { id: true },
	});
	if (!klass) throw notFound("Class not found");
	return klass;
}

/**
 * A domain profile belongs to the institution when it is bound to it
 * explicitly (`institutionId`) or, for profiles without that column set, when
 * its membership is in the institution's organization.
 */
export async function requireProfileInInstitution(
	profileId: string,
	institutionId: string,
) {
	const [row] = await db
		.select({
			institutionId: schema.domainUsers.institutionId,
			memberOrg: authSchema.member.organizationId,
		})
		.from(schema.domainUsers)
		.leftJoin(
			authSchema.member,
			eq(authSchema.member.id, schema.domainUsers.memberId),
		)
		.where(eq(schema.domainUsers.id, profileId))
		.limit(1);
	if (!row) throw notFound("User not found");
	if (row.institutionId) {
		if (row.institutionId !== institutionId) throw notFound("User not found");
		return;
	}
	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
		columns: { organizationId: true },
	});
	if (
		!row.memberOrg ||
		!institution?.organizationId ||
		row.memberOrg !== institution.organizationId
	) {
		throw notFound("User not found");
	}
}
