import type { BatchJobDefinition, BatchJobType } from "./batch-jobs.types";

const registry = new Map<BatchJobType, BatchJobDefinition<any>>();

export function registerJobType<TParams>(
	definition: BatchJobDefinition<TParams>,
): void {
	if (registry.has(definition.type)) {
		throw new Error(
			`Batch job type "${definition.type}" is already registered`,
		);
	}
	registry.set(definition.type, definition);
}

export function getJobDefinition(
	type: BatchJobType,
): BatchJobDefinition<any> | undefined {
	return registry.get(type);
}

export function getRegisteredTypes(): BatchJobType[] {
	return [...registry.keys()];
}
