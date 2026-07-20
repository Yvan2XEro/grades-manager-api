import {
	beforeEach,
	describe,
	expect,
	it,
	setDefaultTimeout,
	test,
} from "bun:test";
import type { Context } from "@/lib/context";
import {
	createClass,
	createDomainUser,
	createStudent,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

setDefaultTimeout(60_000);

const caller = (ctx: Context) => appRouter.createCaller(ctx);

let studentId: string;
let otherStudentId: string;
let reviewerProfileId: string;

beforeEach(async () => {
	const klass = await createClass();
	const student = await createStudent({ class: klass.id });
	const otherStudent = await createStudent({ class: klass.id });
	const reviewer = await createDomainUser();
	studentId = student.id;
	otherStudentId = otherStudent.id;
	reviewerProfileId = reviewer!.id;
});

function asAdmin() {
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: reviewerProfileId },
	});
}

describe("guardians admin management", () => {
	it("creates a guardian and links the guardian to a student", async () => {
		const admin = asAdmin();

		const guardian = await caller(admin).guardians.create({
			firstName: "Marie",
			lastName: "Mballa",
			email: "marie.mballa@example.com",
			phone: "+237650000001",
			relationshipType: "mother",
			studentId,
			isPrimary: true,
			isEmergencyContact: true,
		});

		const links = await caller(admin).guardians.listByStudent({ studentId });

		expect(guardian.email).toBe("marie.mballa@example.com");
		expect(guardian.accessToken).toBeTruthy();
		expect(links).toHaveLength(1);
		expect(links[0]?.relationshipType).toBe("mother");
		expect(links[0]?.isPrimary).toBe(true);
	});

	it("can link one guardian to multiple students without duplicate profiles", async () => {
		const admin = asAdmin();
		const guardian = await caller(admin).guardians.create({
			firstName: "Jean",
			lastName: "Mballa",
			email: "jean.mballa@example.com",
			relationshipType: "father",
			studentId,
		});

		await caller(admin).guardians.linkStudent({
			guardianId: guardian.id,
			studentId: otherStudentId,
			relationshipType: "father",
		});

		const portal = await caller(makeTestContext()).guardians.portal({
			accessToken: guardian.accessToken,
		});

		expect(portal.students.map((student) => student.id).sort()).toEqual(
			[studentId, otherStudentId].sort(),
		);
	});
});

describe("guardians portal", () => {
	it("only exposes students linked to the guardian token", async () => {
		const admin = asAdmin();
		const guardian = await caller(admin).guardians.create({
			firstName: "Aline",
			lastName: "Ngo",
			email: "aline.ngo@example.com",
			relationshipType: "guardian",
			studentId,
		});

		const portal = await caller(makeTestContext()).guardians.portal({
			accessToken: guardian.accessToken,
		});

		expect(portal.guardian.email).toBe("aline.ngo@example.com");
		expect(portal.students).toHaveLength(1);
		expect(portal.students[0]?.id).toBe(studentId);
		expect(
			portal.students.some((student) => student.id === otherStudentId),
		).toBe(false);
	});
});

describe("guardian communication preferences", () => {
	it("stores preferences and audits skipped communications", async () => {
		const admin = asAdmin();
		const guardian = await caller(admin).guardians.create({
			firstName: "Paul",
			lastName: "Etoundi",
			email: "paul.etoundi@example.com",
			relationshipType: "uncle",
			studentId,
		});

		await caller(admin).guardians.updatePreferences({
			guardianId: guardian.id,
			preferences: {
				resultsPublished: false,
				attendanceThreshold: true,
				feeClearance: true,
			},
		});
		const event = await caller(admin).guardians.recordCommunicationEvent({
			guardianId: guardian.id,
			studentId,
			type: "results_published",
			channel: "email",
			payload: { deliberationId: "D1" },
		});

		expect(event.status).toBe("skipped");
		expect(event.reason).toBe("preference_disabled");
	});
});

describe("guardians.listAll", () => {
	test("requires auth", async () => {
		await expect(
			caller(makeTestContext()).guardians.listAll({ page: 1, pageSize: 25 }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("returns page shape", async () => {
		const result = await caller(asAdmin()).guardians.listAll({
			page: 1,
			pageSize: 25,
		});
		expect(result).toMatchObject({
			items: expect.any(Array),
			total: expect.any(Number),
			pageCount: expect.any(Number),
		});
	});

	test("each item has studentLinks array", async () => {
		const result = await caller(asAdmin()).guardians.listAll({
			page: 1,
			pageSize: 25,
		});
		for (const item of result.items) {
			expect(Array.isArray(item.studentLinks)).toBe(true);
		}
	});

	test("search returns empty for no-match term", async () => {
		const result = await caller(asAdmin()).guardians.listAll({
			page: 1,
			pageSize: 25,
			search: "zzz_no_match_xyz",
		});
		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(0);
	});

	test("created guardian appears in listAll with student link", async () => {
		const admin = asAdmin();
		await caller(admin).guardians.create({
			firstName: "Listable",
			lastName: "Guardian",
			email: "listable.guardian@example.com",
			relationshipType: "mother",
			studentId,
			isPrimary: true,
			isEmergencyContact: false,
		});
		const result = await caller(admin).guardians.listAll({
			page: 1,
			pageSize: 100,
		});
		const found = result.items.find(
			(g) => g.email === "listable.guardian@example.com",
		);
		expect(found).toBeDefined();
		expect(found?.studentLinks).toHaveLength(1);
		expect(found?.studentLinks[0]?.student.id).toBe(studentId);
	});
});

describe("guardians.removeLink", () => {
	test("requires admin", async () => {
		await expect(
			caller(makeTestContext()).guardians.removeLink({
				studentId: "s1",
				guardianId: "g1",
			}),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("removes a student-guardian link", async () => {
		const admin = asAdmin();
		const guardian = await caller(admin).guardians.create({
			firstName: "Remove",
			lastName: "Link",
			email: "remove.link@example.com",
			relationshipType: "father",
			studentId,
		});
		await caller(admin).guardians.removeLink({
			studentId,
			guardianId: guardian.id,
		});
		const links = await caller(admin).guardians.listByStudent({ studentId });
		expect(links.some((l) => l.guardianId === guardian.id)).toBe(false);
	});
});

describe("guardians.delete", () => {
	test("requires admin", async () => {
		await expect(
			caller(makeTestContext()).guardians.delete({ id: "g1" }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("deletes a guardian and cascades links", async () => {
		const admin = asAdmin();
		const guardian = await caller(admin).guardians.create({
			firstName: "Delete",
			lastName: "Me",
			email: "delete.me@example.com",
			relationshipType: "uncle",
			studentId,
		});
		await caller(admin).guardians.delete({ id: guardian.id });
		const links = await caller(admin).guardians.listByStudent({ studentId });
		expect(links.some((l) => l.guardianId === guardian.id)).toBe(false);
	});

	test("throws NOT_FOUND for non-existent guardian", async () => {
		await expect(
			caller(asAdmin()).guardians.delete({
				id: "00000000-0000-0000-0000-000000000000",
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
