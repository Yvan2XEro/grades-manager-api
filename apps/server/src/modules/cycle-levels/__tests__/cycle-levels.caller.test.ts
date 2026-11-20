import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { asAdmin, createCycleLevel, createStudyCycle } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const caller = () => appRouter.createCaller(asAdmin());

async function foreignLevel() {
	const [other] = await db
		.insert(schema.institutions)
		.values({
			code: `OTH-${randomUUID().slice(0, 6)}`,
			shortName: "OTHER",
			nameFr: "Institution étrangère",
			nameEn: "Foreign Institution",
		})
		.returning();
	const cycle = await createStudyCycle({ institutionId: other.id });
	const level = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 1,
		code: `F${randomUUID().slice(0, 4)}`,
		name: "Foreign level",
	});
	return { cycle, level };
}

describe("cycle levels are scoped to the institution", () => {
	it("lists, reads and changes only the institution's levels", async () => {
		const own = await createStudyCycle({
			institutionId: asAdmin().institution.id,
		});
		const ownLevel = await createCycleLevel({
			cycleId: own.id,
			orderIndex: 1,
			code: "L1",
			name: "Own level",
		});
		const { cycle, level } = await foreignLevel();
		const api = caller();

		const all = await api.cycleLevels.list({ limit: 500 });
		expect(all.items.map((l) => l.id)).toContain(ownLevel.id);
		expect(all.items.map((l) => l.id)).not.toContain(level.id);
		expect(
			(await api.cycleLevels.list({ cycleId: cycle.id })).items,
		).toHaveLength(0);
		const found = await api.cycleLevels.search({ query: "level" });
		expect(found.map((l) => l.id)).not.toContain(level.id);

		await expect(
			api.cycleLevels.getById({ id: level.id }),
		).rejects.toHaveProperty("code", "NOT_FOUND");
		await expect(
			api.cycleLevels.update({ id: level.id, name: "Hijacked" }),
		).rejects.toHaveProperty("code", "NOT_FOUND");
		await expect(
			api.cycleLevels.create({
				cycleId: cycle.id,
				code: "X1",
				name: "Injected",
				orderIndex: 2,
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
		expect((await api.cycleLevels.getById({ id: ownLevel.id })).id).toBe(
			ownLevel.id,
		);
	});
});
