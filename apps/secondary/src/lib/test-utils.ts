import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, pushSchema } from "../db";
import { institutions, staff } from "../db/schema";
import type { Context } from "./context";

// ─── Module-level test state ──────────────────────────────────────────────────

let _institution: typeof institutions.$inferSelect | null = null;
let _adminUserId: string | null = null;
let _teacherUserId: string | null = null;
let _adminStaffId: string | null = null;
let _teacherStaffId: string | null = null;

// ─── Setup ────────────────────────────────────────────────────────────────────

/**
 * Inserts a test institution, admin user, teacher user, and their
 * Better-Auth organization + member rows. Call once per test file in
 * a `beforeAll` block.
 */
let _schemaReady = false;

export async function setupTestInstitution(): Promise<
	typeof institutions.$inferSelect
> {
	if (!_schemaReady) {
		await pushSchema();
		_schemaReady = true;
	}
	const orgId = randomUUID();
	const adminId = randomUUID();
	const teacherId = randomUUID();

	// Better-Auth user rows (id is text, not uuid in the auth schema)
	await db.execute(sql`
		INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
		VALUES
			(${adminId}, ${"Test Admin"}, ${`admin-${orgId}@tkams.test`}, true, NOW(), NOW()),
			(${teacherId}, ${"Test Teacher"}, ${`teacher-${orgId}@tkams.test`}, true, NOW(), NOW())
		ON CONFLICT (email) DO NOTHING
	`);

	// Better-Auth organization row (id matches institution.id)
	await db.execute(sql`
		INSERT INTO organization (id, name, slug, created_at)
		VALUES (${orgId}, ${"Test School"}, ${`test-${orgId}`}, NOW())
		ON CONFLICT (id) DO NOTHING
	`);

	// Application institution (id = org id, no defaultRandom in schema)
	const [institution] = await db
		.insert(institutions)
		.values({ id: orgId, name: "Test School" })
		.onConflictDoNothing()
		.returning();

	if (!institution) {
		// Already exists from a previous test run — fetch it
		const rows = await db
			.select()
			.from(institutions)
			.where(sql`id = ${orgId}`)
			.limit(1);
		_institution = rows[0] ?? null;
	} else {
		_institution = institution;
	}

	// Better-Auth member rows
	await db.execute(sql`
		INSERT INTO member (id, organization_id, user_id, role, created_at)
		VALUES
			(${randomUUID()}, ${orgId}, ${adminId}, ${"admin"}, NOW()),
			(${randomUUID()}, ${orgId}, ${teacherId}, ${"teacher"}, NOW())
		ON CONFLICT DO NOTHING
	`);

	// Staff rows — id equals authUserId so ctx.session.user.id is a valid staff FK
	const [adminStaff] = await db
		.insert(staff)
		.values({
			id: adminId,
			institutionId: orgId,
			authUserId: adminId,
			firstName: "Admin",
			lastName: "User",
			email: `admin-${orgId}@tkams.test`,
			role: "admin",
		})
		.onConflictDoNothing()
		.returning();
	const [teacherStaff] = await db
		.insert(staff)
		.values({
			id: teacherId,
			institutionId: orgId,
			authUserId: teacherId,
			firstName: "Teacher",
			lastName: "User",
			email: `teacher-${orgId}@tkams.test`,
			role: "teacher",
		})
		.onConflictDoNothing()
		.returning();

	_adminUserId = adminId;
	_teacherUserId = teacherId;
	_adminStaffId = adminStaff?.id ?? adminId;
	_teacherStaffId = teacherStaff?.id ?? teacherId;
	return _institution;
}

export function getAdminStaffId(): string {
	return _adminStaffId ?? randomUUID();
}

export function getTestInstitution(): typeof institutions.$inferSelect {
	if (!_institution) {
		throw new Error("Call setupTestInstitution() in beforeAll first");
	}
	return _institution;
}

// ─── Context factory ──────────────────────────────────────────────────────────

type Role = "admin" | "teacher" | "principal";

export function makeTestContext(
	opts: { role?: Role; userId?: string } = {},
): Context {
	const institution = opts.role ? getTestInstitution() : null;
	const userId =
		opts.userId ??
		(opts.role === "teacher" ? _teacherUserId : _adminUserId) ??
		randomUUID();
	return {
		db,
		session: opts.role
			? {
					user: { id: userId },
					session: { activeOrganizationId: institution?.id ?? null },
				}
			: null,
		institution,
	} as unknown as Context;
}

export const asAdmin = () => makeTestContext({ role: "admin" });
export const asTeacher = () => makeTestContext({ role: "teacher" });
export const asPrincipal = () => makeTestContext({ role: "principal" });
export const asGuest = () => makeTestContext();
