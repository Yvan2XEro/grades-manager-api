import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import * as schema from "@/db/schema/app-schema";
import type { RegistrationNumberFormatDefinition } from "@/db/schema/registration-number-types";
import type { Context } from "@/lib/context";
import { db } from "@/lib/test-db";
import {
	asAdmin,
	createAcademicYear,
	createOrganization,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("institutions router", () => {
	it("requires auth to read", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.institutions.get()).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("allows admin to upsert", async () => {
		const admin = createCaller(asAdmin());
		const updated = await admin.institutions.upsert({
			code: "SGN",
			nameFr: "Institut Demo",
			nameEn: "Demo Institute",
			shortName: "SGN",
			addressFr: "Yaoundé",
			addressEn: "Yaounde",
		});
		expect(updated?.code).toBe("SGN");
		expect(updated?.nameEn).toBe("Demo Institute");
		// get() retourne la première institution, qui peut être n'importe laquelle
		const read = await admin.institutions.get();
		expect(read).toBeTruthy();
	});

	it("stores organization linkage when provided", async () => {
		const org = await createOrganization({
			name: "Tenant",
			slug: "tenant",
		});
		const admin = createCaller(asAdmin());
		const saved = await admin.institutions.upsert({
			code: "ORG1",
			nameFr: "Org FR",
			nameEn: "Org EN",
			shortName: "ORG",
			addressFr: "Yaounde",
			addressEn: "Yaounde",
			organizationId: org.id,
		});
		expect(saved?.organizationId).toBe(org.id);
	});

	it("derives academic year and registration format from active related records", async () => {
		const admin = createCaller(asAdmin());
		const institution = await admin.institutions.upsert({
			code: "DRV1",
			nameFr: "Derived FR",
			nameEn: "Derived EN",
			shortName: "DRV",
			addressFr: "Douala",
			addressEn: "Douala",
		});
		expect(institution).toBeTruthy();
		if (!institution) {
			throw new Error("Institution was not created");
		}

		await createAcademicYear({
			institutionId: institution.id,
			name: "2023/2024",
			isActive: false,
		});
		const activeYear = await createAcademicYear({
			institutionId: institution.id,
			name: "2024/2025",
			isActive: true,
		});

		const inactiveDefinition: RegistrationNumberFormatDefinition = {
			segments: [{ kind: "literal", value: "OLD" }],
		};
		const activeDefinition: RegistrationNumberFormatDefinition = {
			segments: [{ kind: "literal", value: "NEW" }],
		};

		await db
			.insert(schema.registrationNumberFormats)
			.values({
				id: randomUUID(),
				institutionId: institution.id,
				name: "Inactive format",
				definition: inactiveDefinition,
				isActive: false,
			})
			.returning();

		const [activeFormat] = await db
			.insert(schema.registrationNumberFormats)
			.values({
				id: randomUUID(),
				institutionId: institution.id,
				name: "Active format",
				definition: activeDefinition,
				isActive: true,
			})
			.returning();

		const read = await admin.institutions.getById({ id: institution.id });
		expect(read).toBeTruthy();
		if (!read) return;
		expect(read.defaultAcademicYearId).toBe(activeYear.id);
		expect(read.registrationFormatId).toBe(activeFormat.id);
	});
});
