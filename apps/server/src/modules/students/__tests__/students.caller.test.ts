import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createFaculty,
	createProgram,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
const baseStudent = {
	firstName: "A",
	lastName: "B",
	email: "student@example.com",
	dateOfBirth: new Date("2000-01-01"),
	placeOfBirth: "Yaoundé",
	gender: "female" as const,
};

describe("students router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.students.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("enforces uniqueness", async () => {
		const admin = createCaller(asAdmin());
		const klass = await createClass();
		await admin.students.create({
			classId: klass.id,
			registrationNumber: "1",
			...baseStudent,
		});
		await expect(
			admin.students.create({
				classId: klass.id,
				registrationNumber: "2",
				...baseStudent,
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("bulk creates students and reports conflicts", async () => {
		const admin = createCaller(asAdmin());
		const klass = await createClass();
		await admin.students.create({
			classId: klass.id,
			registrationNumber: "1",
			...baseStudent,
			email: "existing@example.com",
		});
		const res = await admin.students.bulkCreate({
			classId: klass.id,
			students: [
				{
					...baseStudent,
					email: "bulk-new@example.com",
					registrationNumber: "2",
				},
				{
					...baseStudent,
					email: "existing@example.com",
					registrationNumber: "3",
				},
			],
		});
		expect(res.createdCount).toBe(1);
		expect(res.conflicts).toHaveLength(1);
	});

	it("fails when class does not exist", async () => {
		const admin = createCaller(asAdmin());
		await expect(
			admin.students.bulkCreate({
				classId: "missing",
				students: [],
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});

	it("generates registration numbers when format is active", async () => {
		const admin = createCaller(asAdmin());
		// Clean up any existing formats and counters first
		await db.delete(schema.registrationNumberCounters);
		await db.delete(schema.registrationNumberFormats);
		const definition = {
			segments: [
				{ kind: "literal", value: "REG-" },
				{ kind: "counter", width: 3 },
			],
		};
		await admin.registrationNumbers.create({
			name: "Default",
			definition,
			isActive: true,
		});
		const klass = await createClass();
		const first = await admin.students.create({
			classId: klass.id,
			firstName: "Auto",
			lastName: "One",
			email: "auto1@example.com",
		});
		const second = await admin.students.create({
			classId: klass.id,
			firstName: "Auto",
			lastName: "Two",
			email: "auto2@example.com",
		});
		expect(first.registrationNumber).toBe("REG-001");
		expect(second.registrationNumber).toBe("REG-002");
	});

	it("fails to auto-generate when no format is configured", async () => {
		const admin = createCaller(asAdmin());
		// Clean up formats and counters to ensure no format is active
		await db.delete(schema.registrationNumberCounters);
		await db.delete(schema.registrationNumberFormats);
		const klass = await createClass();
		await expect(
			admin.students.create({
				classId: klass.id,
				firstName: "Missing",
				lastName: "Format",
				email: "missing-format@example.com",
			}),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
		});
	});

	it("rejects creating students scoped to another institution", async () => {
		const admin = createCaller(asAdmin());
		const [foreignInstitution] = await db
			.insert(schema.institutions)
			.values({
				code: `OTH-${randomUUID().slice(0, 6)}`,
				shortName: "OTHER",
				nameFr: "Autre Institution",
				nameEn: "Other Institution",
			})
			.returning();
		const faculty = await createFaculty({
			institutionId: foreignInstitution.id,
		});
		const program = await createProgram({
			faculty: faculty.id,
			institutionId: foreignInstitution.id,
		});
		const academicYear = await createAcademicYear({
			institutionId: foreignInstitution.id,
		});
		const klass = await createClass({
			program: program.id,
			academicYear: academicYear.id,
			institutionId: foreignInstitution.id,
		});
		await expect(
			admin.students.create({
				classId: klass.id,
				firstName: "Scoping",
				lastName: "Mismatch",
				email: "scoped@example.com",
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});

	it("prevents fetching students from another institution", async () => {
		const admin = createCaller(asAdmin());
		const [foreignInstitution] = await db
			.insert(schema.institutions)
			.values({
				code: `OTH-${randomUUID().slice(0, 6)}`,
				shortName: "OTHER",
				nameFr: "Autre Institution",
				nameEn: "Other Institution",
			})
			.returning();
		const faculty = await createFaculty({
			institutionId: foreignInstitution.id,
		});
		const program = await createProgram({
			faculty: faculty.id,
			institutionId: foreignInstitution.id,
		});
		const academicYear = await createAcademicYear({
			institutionId: foreignInstitution.id,
		});
		const klass = await createClass({
			program: program.id,
			academicYear: academicYear.id,
			institutionId: foreignInstitution.id,
		});
		const [profile] = await db
			.insert(schema.domainUsers)
			.values({
				firstName: "Foreign",
				lastName: "Student",
				primaryEmail: "foreign.student@example.com",
				businessRole: "student",
				status: "active",
			})
			.returning();
		const [foreignStudent] = await db
			.insert(schema.students)
			.values({
				class: klass.id,
				domainUserId: profile.id,
				registrationNumber: "F-001",
				institutionId: foreignInstitution.id,
			})
			.returning();
		await expect(
			admin.students.getById({ id: foreignStudent.id }),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});
});
