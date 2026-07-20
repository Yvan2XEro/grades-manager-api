import { beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { exportTemplates } from "@/db/schema/app-schema";
import { getTestInstitution } from "@/lib/test-context-state";
import { pushSchema, reset, seed } from "@/lib/test-db";
import { setupTestInstitution } from "@/lib/test-utils";
import { loadTemplate } from "../template-helper";
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

// ── Pure loadTemplate (bundled strings, no DB) — JVL-25 ──────────────────────

describe("loadTemplate — bundled certificate templates", () => {
	it("enrollment_certificate returns non-empty HTML for every establishment variant", () => {
		const variants: Array<{
			variant: "standard" | "center";
			estType: "institution" | "faculty" | undefined;
		}> = [
			{ variant: "standard", estType: undefined },
			{ variant: "standard", estType: "institution" },
			{ variant: "standard", estType: "faculty" },
			{ variant: "center", estType: undefined },
		];
		for (const { variant, estType } of variants) {
			const body = loadTemplate("enrollment_certificate", variant, estType);
			expect(body).not.toContain("<!-- No bundled template -->");
			expect(body.trim().length).toBeGreaterThan(100);
			expect(body).toContain("<!DOCTYPE html>");
		}
	});

	it("enrollment_certificate template body contains expected student data placeholders", () => {
		const body = loadTemplate(
			"enrollment_certificate",
			"standard",
			"institution",
		);
		// Must reference the student section
		expect(body).toMatch(/student|PRENOM|NOM|MATRICULE/i);
	});
});
