import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { TransactionClient } from "../_shared/db-transaction";

type Agent = typeof db | TransactionClient;

const pickAgent = (agent?: Agent) => agent ?? db;

export async function list(opts: {
	institutionId: string;
	includeInactive?: boolean;
}): Promise<schema.RegistrationNumberFormat[]> {
	const condition = opts.includeInactive
		? eq(schema.registrationNumberFormats.institutionId, opts.institutionId)
		: and(
				eq(schema.registrationNumberFormats.isActive, true),
				eq(schema.registrationNumberFormats.institutionId, opts.institutionId),
			);
	return db
		.select()
		.from(schema.registrationNumberFormats)
		.where(condition)
		.orderBy(
			desc(schema.registrationNumberFormats.isActive),
			desc(schema.registrationNumberFormats.createdAt),
		);
}

export async function findById(id: string, agent?: Agent) {
	const executor = pickAgent(agent);
	const [item] = await executor
		.select()
		.from(schema.registrationNumberFormats)
		.where(eq(schema.registrationNumberFormats.id, id))
		.limit(1);
	return item ?? null;
}

export async function findActive(institutionId: string, agent?: Agent) {
	const executor = pickAgent(agent);
	const [item] = await executor
		.select()
		.from(schema.registrationNumberFormats)
		.where(
			and(
				eq(schema.registrationNumberFormats.isActive, true),
				eq(schema.registrationNumberFormats.institutionId, institutionId),
			),
		)
		.limit(1);
	return item ?? null;
}

export async function create(
	data: schema.NewRegistrationNumberFormat,
	agent = db,
) {
	const [item] = await agent
		.insert(schema.registrationNumberFormats)
		.values(data)
		.returning();
	return item;
}

export async function update(
	id: string,
	data: Partial<schema.NewRegistrationNumberFormat>,
	agent = db,
) {
	const [item] = await agent
		.update(schema.registrationNumberFormats)
		.set(data)
		.where(eq(schema.registrationNumberFormats.id, id))
		.returning();
	return item ?? null;
}

export async function remove(id: string) {
	await db
		.delete(schema.registrationNumberFormats)
		.where(eq(schema.registrationNumberFormats.id, id));
}
