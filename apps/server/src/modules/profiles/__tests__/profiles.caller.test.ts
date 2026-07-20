import { describe, expect, it } from "bun:test";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createClass,
	createDomainUser,
	createStudent,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const caller = (ctx: Context) => appRouter.createCaller(ctx);

describe("profiles router", () => {
	describe("get", () => {
		it("requires authentication", async () => {
			const profile = await createDomainUser();
			await expect(
				caller(makeTestContext()).profiles.get({ profileId: profile.id }),
			).rejects.toHaveProperty("code", "UNAUTHORIZED");
		});

		it("admin can view any profile", async () => {
			const profile = await createDomainUser();
			const result = await caller(asAdmin()).profiles.get({
				profileId: profile.id,
			});
			expect(result.id).toBe(profile.id);
			expect(result.firstName).toBe(profile.firstName);
		});

		it("user can view their own profile", async () => {
			const profile = await createDomainUser();
			const ctx = makeTestContext({
				role: "student",
				profileOverrides: { id: profile.id },
			});
			const result = await caller(ctx).profiles.get({
				profileId: profile.id,
			});
			expect(result.id).toBe(profile.id);
		});

		it("user cannot view another user's profile", async () => {
			const otherProfile = await createDomainUser();
			const ctx = makeTestContext({ role: "student" });
			await expect(
				caller(ctx).profiles.get({ profileId: otherProfile.id }),
			).rejects.toHaveProperty("code", "FORBIDDEN");
		});

		it("returns student info when profile is a student", async () => {
			const student = await createStudent();
			const result = await caller(asAdmin()).profiles.get({
				profileId: student.domainUserId,
			});
			expect(result.student).not.toBeNull();
			expect(result.student?.id).toBe(student.id);
		});

		it("returns null student for non-student profile", async () => {
			const profile = await createDomainUser();
			const result = await caller(asAdmin()).profiles.get({
				profileId: profile.id,
			});
			expect(result.student).toBeNull();
		});

		it("includes identity tab for all profiles", async () => {
			const profile = await createDomainUser();
			const result = await caller(asAdmin()).profiles.get({
				profileId: profile.id,
			});
			expect(result.availableTabs).toContain("identity");
		});

		it("includes student tabs when profile is a student", async () => {
			const student = await createStudent();
			const result = await caller(asAdmin()).profiles.get({
				profileId: student.domainUserId,
			});
			expect(result.availableTabs).toContain("enrollments");
			expect(result.availableTabs).toContain("results");
			expect(result.availableTabs).toContain("finances");
			expect(result.availableTabs).toContain("guardians");
		});

		it("throws NOT_FOUND for unknown profileId", async () => {
			await expect(
				caller(asAdmin()).profiles.get({ profileId: "nonexistent-id" }),
			).rejects.toHaveProperty("code", "NOT_FOUND");
		});
	});

	describe("enrollments", () => {
		it("requires authentication", async () => {
			const profile = await createDomainUser();
			await expect(
				caller(makeTestContext()).profiles.enrollments({
					profileId: profile.id,
				}),
			).rejects.toHaveProperty("code", "UNAUTHORIZED");
		});

		it("returns enrollments for a student profile", async () => {
			const klass = await createClass();
			const student = await createStudent({ class: klass.id });
			const result = await caller(asAdmin()).profiles.enrollments({
				profileId: student.domainUserId,
			});
			expect(result.length).toBeGreaterThan(0);
			expect(result[0]?.classId).toBe(klass.id);
		});

		it("returns empty array for non-student profile", async () => {
			const profile = await createDomainUser();
			const result = await caller(asAdmin()).profiles.enrollments({
				profileId: profile.id,
			});
			expect(result).toHaveLength(0);
		});

		it("student can view own enrollments", async () => {
			const student = await createStudent();
			const ctx = makeTestContext({
				role: "student",
				profileOverrides: { id: student.domainUserId },
			});
			const result = await caller(ctx).profiles.enrollments({
				profileId: student.domainUserId,
			});
			expect(result.length).toBeGreaterThan(0);
		});

		it("student cannot view another student's enrollments", async () => {
			const otherStudent = await createStudent();
			const ctx = makeTestContext({ role: "student" });
			await expect(
				caller(ctx).profiles.enrollments({
					profileId: otherStudent.domainUserId,
				}),
			).rejects.toHaveProperty("code", "FORBIDDEN");
		});
	});

	describe("guardians", () => {
		it("requires authentication", async () => {
			const profile = await createDomainUser();
			await expect(
				caller(makeTestContext()).profiles.guardians({ profileId: profile.id }),
			).rejects.toHaveProperty("code", "UNAUTHORIZED");
		});

		it("returns empty array for non-student profile", async () => {
			const profile = await createDomainUser();
			const result = await caller(asAdmin()).profiles.guardians({
				profileId: profile.id,
			});
			expect(result).toHaveLength(0);
		});

		it("returns empty array when student has no guardians", async () => {
			const student = await createStudent();
			const result = await caller(asAdmin()).profiles.guardians({
				profileId: student.domainUserId,
			});
			expect(result).toHaveLength(0);
		});

		it("returns linked guardians for a student", async () => {
			const student = await createStudent();
			const institution = student.institutionId;
			const [guardian] = await db
				.insert(schema.guardians)
				.values({
					institutionId: institution,
					firstName: "Jane",
					lastName: "Parent",
					email: `parent-${Date.now()}@example.com`,
					accessToken: `token-${Date.now()}`,
				})
				.returning();
			await db.insert(schema.studentGuardians).values({
				institutionId: institution,
				studentId: student.id,
				guardianId: guardian.id,
				relationshipType: "mother",
				isPrimary: true,
				isEmergencyContact: false,
			});
			const result = await caller(asAdmin()).profiles.guardians({
				profileId: student.domainUserId,
			});
			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe(guardian.id);
			expect(result[0]?.isPrimary).toBe(true);
			expect(result[0]?.relationshipType).toBe("mother");
		});
	});

	describe("finances", () => {
		it("requires authentication", async () => {
			const profile = await createDomainUser();
			await expect(
				caller(makeTestContext()).profiles.finances({ profileId: profile.id }),
			).rejects.toHaveProperty("code", "UNAUTHORIZED");
		});

		it("returns empty array for non-student profile", async () => {
			const profile = await createDomainUser();
			const result = await caller(asAdmin()).profiles.finances({
				profileId: profile.id,
			});
			expect(result).toHaveLength(0);
		});
	});
});
