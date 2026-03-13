import type { BatchJobDefinition, BatchJobType } from "./batch-jobs.types";

const registry = new Map<BatchJobType, BatchJobDefinition>();

export function registerJobType<T = Record<string, unknown>>(
	definition: BatchJobDefinition<T>,
): void {
	if (registry.has(definition.type)) {
		throw new Error(
			`Batch job type "${definition.type}" is already registered`,
		);
	}
	registry.set(definition.type, definition as BatchJobDefinition);
}

export function getJobDefinition(
	type: BatchJobType,
): BatchJobDefinition | undefined {
	return registry.get(type);
}

export function getRegisteredTypes(): BatchJobType[] {
	return [...registry.keys()];
}
