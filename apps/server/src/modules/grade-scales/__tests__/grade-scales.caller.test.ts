import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { DEFAULT_MENTION_RANGES } from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	makeTestContext,
	setupTestInstitution,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";
import * as gradeScalesService from "../grade-scales.service";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

beforeAll(async () => {
	await setupTestInstitution();
});

afterAll(async () => {});

describe("gradeScales router", () => {
	describe("get", () => {
		it("returns undefined when no scale configured", async () => {
			const ctx = asAdmin();
			const caller = createCaller(ctx);
			const result = await caller.gradeScales.get();
			// No scale yet → undefined (raw DB row, not resolved default)
			expect(result).toBeUndefined();
		});
	});

	describe("upsert", () => {
		it("creates a grade scale for the institution", async () => {
			const ctx = asAdmin();
			const caller = createCaller(ctx);
			const scale = await caller.gradeScales.upsert({
				passThreshold: 12,
				compensationThreshold: 9,
				mentionRanges: [
					{
						key: "passable",
						label: "Passable",
						labelEn: "Pass",
						gradeLetter: "E",
						min: 12,
					},
					{
						key: "bien",
						label: "Bien",
						labelEn: "Good",
						gradeLetter: "C",
						min: 14,
					},
					{
						key: "tres_bien",
						label: "Très Bien",
						labelEn: "Very Good",
						gradeLetter: "B",
						min: 16,
					},
				],
			});
			expect(Number(scale.passThreshold)).toBe(12);
			expect(Number(scale.compensationThreshold)).toBe(9);
			expect(scale.mentionRanges).toHaveLength(3);
		});

		it("updates an existing scale (upsert)", async () => {
			const ctx = asAdmin();
			const caller = createCaller(ctx);
			await caller.gradeScales.upsert({
				passThreshold: 10,
				compensationThreshold: 8,
				mentionRanges: DEFAULT_MENTION_RANGES,
			});
			const result = await caller.gradeScales.get();
			expect(Number(result?.passThreshold)).toBe(10);
		});

		it("rejects duplicate mention range minimums", async () => {
			const ctx = asAdmin();
			const caller = createCaller(ctx);
			await expect(
				caller.gradeScales.upsert({
					passThreshold: 10,
					compensationThreshold: 8,
					mentionRanges: [
						{
							key: "passable",
							label: "Passable",
							labelEn: "Pass",
							gradeLetter: "E",
							min: 10,
						},
						{
							key: "bien",
							label: "Bien",
							labelEn: "Good",
							gradeLetter: "C",
							min: 10,
						},
					],
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});
	});

	describe("getForInstitution service", () => {
		it("returns default scale when no DB record exists", async () => {
			// Use a random institutionId that has no scale configured
			const scale = await gradeScalesService.getForInstitution(
				"non-existent-institution",
			);
			expect(scale.passThreshold).toBe(10);
			expect(scale.compensationThreshold).toBe(8);
			expect(scale.mentionRanges).toEqual(DEFAULT_MENTION_RANGES);
		});
	});

	describe("computeMention", () => {
		it("returns null for null average", () => {
			expect(
				gradeScalesService.computeMention(null, DEFAULT_MENTION_RANGES),
			).toBeNull();
		});

		it("returns correct mention for each range", () => {
			expect(
				gradeScalesService.computeMention(18, DEFAULT_MENTION_RANGES),
			).toBe("excellent");
			expect(
				gradeScalesService.computeMention(16, DEFAULT_MENTION_RANGES),
			).toBe("tres_bien");
			expect(
				gradeScalesService.computeMention(14, DEFAULT_MENTION_RANGES),
			).toBe("bien");
			expect(
				gradeScalesService.computeMention(12, DEFAULT_MENTION_RANGES),
			).toBe("assez_bien");
			expect(
				gradeScalesService.computeMention(10, DEFAULT_MENTION_RANGES),
			).toBe("passable");
			expect(
				gradeScalesService.computeMention(9.9, DEFAULT_MENTION_RANGES),
			).toBeNull();
		});

		it("uses custom ranges when provided", () => {
			const customRanges = [
				{
					key: "pass",
					label: "Pass",
					labelEn: "Pass",
					gradeLetter: "P",
					min: 12,
				},
			];
			expect(gradeScalesService.computeMention(12, customRanges)).toBe("pass");
			expect(gradeScalesService.computeMention(11.9, customRanges)).toBeNull();
		});
	});
});

// ── resolveAcademicPolicy ─────────────────────────────────────────────────────

describe("resolveAcademicPolicy", () => {
	beforeAll(async () => {
		await setupTestInstitution();
	});

	it("isPassing uses configured passThreshold", async () => {
		const ctx = asAdmin();
		const caller = appRouter.createCaller(ctx);
		await caller.gradeScales.upsert({
			passThreshold: 12,
			compensationThreshold: 9,
			mentionRanges: DEFAULT_MENTION_RANGES,
		});

		const policy = await gradeScalesService.resolveAcademicPolicy(
			ctx.institution.id,
		);

		expect(policy.isPassing(12)).toBe(true);
		expect(policy.isPassing(11.9)).toBe(false);
		expect(policy.passThreshold).toBe(12);
	});

	it("getMentionMeta returns labelEn and gradeLetter from configured ranges", async () => {
		const ctx = asAdmin();
		const caller = appRouter.createCaller(ctx);
		await caller.gradeScales.upsert({
			passThreshold: 10,
			compensationThreshold: 8,
			mentionRanges: [
				{
					key: "passable",
					label: "Passable",
					labelEn: "Satisfactory",
					gradeLetter: "E",
					min: 10,
				},
				{
					key: "bien",
					label: "Bien",
					labelEn: "Good",
					gradeLetter: "C",
					min: 14,
				},
			],
		});

		const policy = await gradeScalesService.resolveAcademicPolicy(
			ctx.institution.id,
		);

		expect(policy.getMentionMeta("bien")).toEqual({
			label: "Bien",
			labelEn: "Good",
			gradeLetter: "C",
		});
		expect(policy.getMentionMeta("unknown")).toBeNull();
	});

	it("computeMentionKey returns null below lowest range", async () => {
		const ctx = asAdmin();
		const caller = appRouter.createCaller(ctx);
		await caller.gradeScales.upsert({
			passThreshold: 10,
			compensationThreshold: 8,
			mentionRanges: DEFAULT_MENTION_RANGES,
		});

		const policy = await gradeScalesService.resolveAcademicPolicy(
			ctx.institution.id,
		);

		expect(policy.computeMentionKey(9.9)).toBeNull();
		expect(policy.computeMentionKey(10)).toBe("passable");
	});

	it("tenant isolation — each institution has an independent scale", async () => {
		const ctxA = asAdmin();
		const callerA = appRouter.createCaller(ctxA);
		await callerA.gradeScales.upsert({
			passThreshold: 12,
			compensationThreshold: 9,
			mentionRanges: DEFAULT_MENTION_RANGES,
		});

		await setupTestInstitution();
		const ctxB = asAdmin();

		const policyA = await gradeScalesService.resolveAcademicPolicy(
			ctxA.institution.id,
		);
		const policyB = await gradeScalesService.resolveAcademicPolicy(
			ctxB.institution.id,
		);

		expect(policyA.passThreshold).toBe(12);
		expect(policyB.passThreshold).toBe(10);
	});

	it("default behavior unchanged — no scale configured returns threshold=10", async () => {
		const scale = await gradeScalesService.resolveAcademicPolicy(
			"non-existent-institution-xyz",
		);
		expect(scale.passThreshold).toBe(10);
		expect(scale.isPassing(10)).toBe(true);
		expect(scale.isPassing(9.99)).toBe(false);
	});
});
