import { beforeEach, describe, expect, it, setDefaultTimeout } from "bun:test";
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
