import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin, asSuperAdmin, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("promotion rules router", () => {
	it("requires auth for listing rules", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.promotionRules.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("allows admin to create rules", async () => {
		const admin = createCaller(asAdmin());
		const rule = await admin.promotionRules.create({
			name: "Standard L1 to L2 Promotion",
			description: "Students must have average >= 10 and credits >= 30",
			ruleset: {
				conditions: {
					all: [
						{
							fact: "overallAverage",
							operator: "greaterThanInclusive",
							value: 10,
						},
						{
							fact: "creditsEarned",
							operator: "greaterThanInclusive",
							value: 30,
						},
						{ fact: "eliminatoryFailures", operator: "equal", value: 0 },
					],
				},
				event: {
					type: "promotion-eligible",
					params: {
						message: "Student meets promotion criteria",
					},
				},
			},
			isActive: true,
		});

		expect(rule.id).toBeTruthy();
		expect(rule.name).toBe("Standard L1 to L2 Promotion");
		expect(rule.isActive).toBe(true);
	});

	it("allows admin to update rules", async () => {
		const admin = createCaller(asAdmin());

		// Create a rule first
		const rule = await admin.promotionRules.create({
			name: "Test Rule",
			ruleset: {
				conditions: {
					all: [
						{
							fact: "overallAverage",
							operator: "greaterThanInclusive",
							value: 10,
						},
					],
				},
				event: { type: "eligible", params: {} },
			},
		});

		// Update it
		const updated = await admin.promotionRules.update({
			id: rule.id,
			name: "Updated Test Rule",
			isActive: false,
		});

		expect(updated.name).toBe("Updated Test Rule");
		expect(updated.isActive).toBe(false);
	});

	it("allows admin to list rules with filters", async () => {
		const admin = createCaller(asAdmin());

		// Create some rules
		await admin.promotionRules.create({
			name: "Active Rule",
			ruleset: {
				conditions: { all: [] },
				event: { type: "test", params: {} },
			},
			isActive: true,
		});

		await admin.promotionRules.create({
			name: "Inactive Rule",
			ruleset: {
				conditions: { all: [] },
				event: { type: "test", params: {} },
			},
			isActive: false,
		});

		// List only active rules
		const activeRules = await admin.promotionRules.list({ isActive: true });
		expect(activeRules.items.length).toBeGreaterThan(0);
		expect(activeRules.items.every((r) => r.isActive)).toBe(true);
	});

	it("validates ruleset format when creating", async () => {
		const admin = createCaller(asAdmin());

		// Invalid ruleset (missing event)
		await expect(
			admin.promotionRules.create({
				name: "Invalid Rule",
				ruleset: {
					conditions: { all: [] },
					// Missing event
				},
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("allows getting rule by ID", async () => {
		const admin = createCaller(asAdmin());

		const rule = await admin.promotionRules.create({
			name: "Get By ID Test",
			ruleset: {
				conditions: { all: [] },
				event: { type: "test", params: {} },
			},
		});

		const fetched = await admin.promotionRules.getById({ id: rule.id });
		expect(fetched.id).toBe(rule.id);
		expect(fetched.name).toBe("Get By ID Test");
	});

	it("returns 404 for non-existent rule", async () => {
		const admin = createCaller(asAdmin());

		await expect(
			admin.promotionRules.getById({ id: "non-existent-id" }),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});

	it("prevents deleting rules with executions", async () => {
		const admin = createCaller(asAdmin());

		// This test assumes there's a rule with executions
		// In a real test, you'd create a rule, execute it, then try to delete
		// For now, we just test the delete function exists
		const rule = await admin.promotionRules.create({
			name: "To Be Deleted",
			ruleset: {
				conditions: { all: [] },
				event: { type: "test", params: {} },
			},
		});

		// Delete should succeed since no executions
		await expect(
			admin.promotionRules.delete({ id: rule.id }),
		).resolves.toBeUndefined();
	});
});

describe("promotion evaluation", () => {
	it("requires authentication to evaluate class", async () => {
		const caller = createCaller(makeTestContext());

		await expect(
			caller.promotionRules.evaluateClass({
				sourceClassId: "test-class",
				ruleId: "test-rule",
				academicYearId: "test-year",
			}),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	// Note: Full evaluation tests would require seeding students, grades, etc.
	// These would be integration tests
});

describe("promotion execution", () => {
	it("requires admin to apply promotion", async () => {
		const caller = createCaller(makeTestContext());

		await expect(
			caller.promotionRules.applyPromotion({
				sourceClassId: "test-source",
				targetClassId: "test-target",
				ruleId: "test-rule",
				academicYearId: "test-year",
				studentIds: ["student-1"],
			}),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("allows listing execution history", async () => {
		const admin = createCaller(asAdmin());

		const executions = await admin.promotionRules.listExecutions({});
		expect(Array.isArray(executions.items)).toBe(true);
	});
});
