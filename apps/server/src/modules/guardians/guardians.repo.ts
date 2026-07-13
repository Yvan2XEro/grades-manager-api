import { and, asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function findStudent(institutionId: string, studentId: string) {
	const [row] = await db
		.select({ id: schema.students.id })
		.from(schema.students)
		.where(
			and(
				eq(schema.students.institutionId, institutionId),
				eq(schema.students.id, studentId),
			),
		)
		.limit(1);
	return row ?? null;
}

export async function findGuardianById(
	institutionId: string,
	guardianId: string,
) {
	return db.query.guardians.findFirst({
		where: and(
			eq(schema.guardians.institutionId, institutionId),
			eq(schema.guardians.id, guardianId),
		),
	});
}

export async function findGuardianByEmail(
	institutionId: string,
	email: string,
) {
	return db.query.guardians.findFirst({
		where: and(
			eq(schema.guardians.institutionId, institutionId),
			eq(schema.guardians.email, email),
		),
	});
}

export async function findGuardianByAccessToken(accessToken: string) {
	return db.query.guardians.findFirst({
		where: and(
			eq(schema.guardians.accessToken, accessToken),
			eq(schema.guardians.isActive, true),
		),
	});
}

export async function createGuardian(data: schema.NewGuardian) {
	const [row] = await db.insert(schema.guardians).values(data).returning();
	return row!;
}

export async function updateGuardianPreferences(
	institutionId: string,
	guardianId: string,
	preferences: schema.GuardianCommunicationPreferences,
) {
	const [row] = await db
		.update(schema.guardians)
		.set({ preferences, updatedAt: new Date() })
		.where(
			and(
				eq(schema.guardians.institutionId, institutionId),
				eq(schema.guardians.id, guardianId),
			),
		)
		.returning();
	return row ?? null;
}

export async function upsertStudentLink(data: schema.NewStudentGuardian) {
	const [row] = await db
		.insert(schema.studentGuardians)
		.values(data)
		.onConflictDoUpdate({
			target: [
				schema.studentGuardians.studentId,
				schema.studentGuardians.guardianId,
			],
			set: {
				relationshipType: data.relationshipType,
				isPrimary: data.isPrimary ?? false,
				isEmergencyContact: data.isEmergencyContact ?? false,
				updatedAt: new Date(),
			},
		})
		.returning();
	return row!;
}

export async function listByStudent(institutionId: string, studentId: string) {
	return db
		.select({
			id: schema.studentGuardians.id,
			studentId: schema.studentGuardians.studentId,
			guardianId: schema.studentGuardians.guardianId,
			relationshipType: schema.studentGuardians.relationshipType,
			isPrimary: schema.studentGuardians.isPrimary,
			isEmergencyContact: schema.studentGuardians.isEmergencyContact,
			guardian: schema.guardians,
		})
		.from(schema.studentGuardians)
		.innerJoin(
			schema.guardians,
			eq(schema.guardians.id, schema.studentGuardians.guardianId),
		)
		.where(
			and(
				eq(schema.studentGuardians.institutionId, institutionId),
				eq(schema.studentGuardians.studentId, studentId),
			),
		);
}

export async function listLinksByGuardian(
	institutionId: string,
	guardianId: string,
) {
	return db
		.select({
			studentId: schema.students.id,
			registrationNumber: schema.students.registrationNumber,
			classId: schema.students.class,
			profile: {
				firstName: schema.domainUsers.firstName,
				lastName: schema.domainUsers.lastName,
				primaryEmail: schema.domainUsers.primaryEmail,
			},
			relationshipType: schema.studentGuardians.relationshipType,
			isPrimary: schema.studentGuardians.isPrimary,
			isEmergencyContact: schema.studentGuardians.isEmergencyContact,
		})
		.from(schema.studentGuardians)
		.innerJoin(
			schema.students,
			eq(schema.students.id, schema.studentGuardians.studentId),
		)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.students.domainUserId),
		)
		.where(
			and(
				eq(schema.studentGuardians.institutionId, institutionId),
				eq(schema.studentGuardians.guardianId, guardianId),
			),
		);
}

export async function createCommunicationEvent(
	data: schema.NewGuardianCommunicationEvent,
) {
	const [row] = await db
		.insert(schema.guardianCommunicationEvents)
		.values(data)
		.returning();
	return row!;
}

export async function listAll(
	institutionId: string,
	opts: { page: number; pageSize: number; search?: string },
) {
	const size = Math.min(Math.max(opts.pageSize ?? 25, 1), 100);
	const offset = (Math.max(opts.page ?? 1, 1) - 1) * size;

	const conditions: SQL[] = [eq(schema.guardians.institutionId, institutionId)];
	if (opts.search) {
		const term = `%${opts.search}%`;
		conditions.push(
			or(
				ilike(schema.guardians.firstName, term),
				ilike(schema.guardians.lastName, term),
				ilike(schema.guardians.email, term),
			) as SQL,
		);
	}
	const where = and(...conditions);

	const [rows, [{ total }]] = await Promise.all([
		db
			.select()
			.from(schema.guardians)
			.where(where)
			.orderBy(asc(schema.guardians.lastName), asc(schema.guardians.firstName))
			.limit(size)
			.offset(offset),
		db.select({ total: count() }).from(schema.guardians).where(where),
	]);

	const totalCount = Number(total ?? 0);

	if (rows.length === 0) {
		return {
			items: [],
			total: totalCount,
			pageCount: Math.ceil(totalCount / size),
		};
	}

	const guardianIds = rows.map((g) => g.id);
	const links = await db
		.select({
			id: schema.studentGuardians.id,
			guardianId: schema.studentGuardians.guardianId,
			studentId: schema.studentGuardians.studentId,
			relationshipType: schema.studentGuardians.relationshipType,
			isPrimary: schema.studentGuardians.isPrimary,
			isEmergencyContact: schema.studentGuardians.isEmergencyContact,
			student: {
				id: schema.students.id,
				registrationNumber: schema.students.registrationNumber,
				firstName: schema.domainUsers.firstName,
				lastName: schema.domainUsers.lastName,
			},
		})
		.from(schema.studentGuardians)
		.innerJoin(
			schema.students,
			eq(schema.students.id, schema.studentGuardians.studentId),
		)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.students.domainUserId),
		)
		.where(
			and(
				eq(schema.studentGuardians.institutionId, institutionId),
				inArray(schema.studentGuardians.guardianId, guardianIds),
			),
		);

	const linksByGuardianId = new Map<string, typeof links>();
	for (const link of links) {
		const list = linksByGuardianId.get(link.guardianId) ?? [];
		list.push(link);
		linksByGuardianId.set(link.guardianId, list);
	}

	return {
		items: rows.map((g) => ({
			id: g.id,
			firstName: g.firstName,
			lastName: g.lastName,
			email: g.email,
			phone: g.phone,
			accessToken: g.accessToken,
			preferences: g.preferences,
			studentLinks: (linksByGuardianId.get(g.id) ?? []).map((link) => ({
				id: link.id,
				relationshipType: link.relationshipType,
				isPrimary: link.isPrimary,
				isEmergencyContact: link.isEmergencyContact,
				student: {
					id: link.student.id,
					firstName: link.student.firstName,
					lastName: link.student.lastName,
					registrationNumber: link.student.registrationNumber,
				},
			})),
		})),
		total: totalCount,
		pageCount: Math.ceil(totalCount / size),
	};
}

export async function removeStudentLink(
	institutionId: string,
	studentId: string,
	guardianId: string,
) {
	await db
		.delete(schema.studentGuardians)
		.where(
			and(
				eq(schema.studentGuardians.institutionId, institutionId),
				eq(schema.studentGuardians.studentId, studentId),
				eq(schema.studentGuardians.guardianId, guardianId),
			),
		);
}

export async function deleteGuardian(
	institutionId: string,
	guardianId: string,
) {
	const [deleted] = await db
		.delete(schema.guardians)
		.where(
			and(
				eq(schema.guardians.institutionId, institutionId),
				eq(schema.guardians.id, guardianId),
			),
		)
		.returning({ id: schema.guardians.id });
	return deleted ?? null;
}
