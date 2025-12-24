import { beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { exportTemplates } from "@/db/schema/app-schema";
import { getTestInstitution } from "@/lib/test-context-state";
import { setupTestInstitution } from "@/lib/test-utils";
import { pushSchema, reset, seed } from "@/lib/test-db";
import { loadExportTemplate } from "../template-loader";

beforeAll(async () => {
	await pushSchema();
	await reset();
	await seed();
	await setupTestInstitution();
});

async function clearTemplates() {
	await db.delete(exportTemplates);
}

describe("export template loader", () => {
	it("falls back to default template when none is stored", async () => {
		await clearTemplates();
		const institution = getTestInstitution();
		const config = await loadExportTemplate(institution.id, "evaluation");
		expect(config.templateBody).toContain("<!DOCTYPE html>");
	});

	it("uses stored template body when available", async () => {
		await clearTemplates();
		const institution = getTestInstitution();
		const templateBody = "<html><body>Custom {{program.name}}</body></html>";
		await db.insert(exportTemplates).values({
			institutionId: institution.id,
			name: "Custom PV",
			type: "pv",
			isDefault: true,
			templateBody,
		});

		const config = await loadExportTemplate(institution.id, "pv");
		expect(config.templateBody).toBe(templateBody);
	});
});
