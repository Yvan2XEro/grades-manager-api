import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema/app-schema";
import { type TransactionClient, transaction } from "../_shared/db-transaction";
import { notFound } from "../_shared/errors";
import * as classesRepo from "../classes/classes.repo";
import {
	generateRegistrationNumber,
	previewRegistrationNumber,
	RegistrationNumberError,
	type RegistrationNumberProfileInput,
} from "./registration-number-generator";
import * as repo from "./registration-numbers.repo";

type FormatDefinition = Pick<schema.RegistrationNumberFormat, "definition">;

type PreviewInput = {
	classId: string;
	formatId?: string;
	definition?: FormatDefinition["definition"];
	profile?: RegistrationNumberProfileInput;
};

const normalizeDefinition = (
	definition: FormatDefinition["definition"],
): FormatDefinition["definition"] => ({
	segments: definition.segments,
});

async function ensureFormat(
	id: string,
	institutionId?: string,
	agent?: TransactionClient,
) {
	const format = await repo.findById(id, agent);
	if (!format) throw notFound("Format not found");
	if (institutionId && format.institutionId !== institutionId) {
		throw notFound();
	}
	return format;
}

export async function listFormats(
	opts: { includeInactive?: boolean } = {},
	institutionId: string,
) {
	return repo.list({ institutionId, includeInactive: opts.includeInactive });
}

export async function createFormat(
	data: {
		name: string;
		description?: string;
		definition: FormatDefinition["definition"];
		isActive?: boolean;
	},
	institutionId: string,
) {
	return transaction(async (tx) => {
		if (data.isActive) {
			await tx
				.update(schema.registrationNumberFormats)
				.set({ isActive: false })
				.where(
					and(
						eq(schema.registrationNumberFormats.isActive, true),
						eq(schema.registrationNumberFormats.institutionId, institutionId),
					),
				);
		}
		return repo.create(
			{
				name: data.name,
				description: data.description ?? null,
				definition: normalizeDefinition(data.definition),
				isActive: data.isActive ?? false,
				institutionId,
			},
			tx,
		);
	});
}

export async function updateFormat(
	id: string,
	data: {
		name?: string;
		description?: string;
		definition?: FormatDefinition["definition"];
		isActive?: boolean;
	},
	institutionId: string,
) {
	const existing = await ensureFormat(id, institutionId);
	return transaction(async (tx) => {
		if (data.isActive) {
			await tx
				.update(schema.registrationNumberFormats)
				.set({ isActive: false })
				.where(
					and(
						eq(schema.registrationNumberFormats.isActive, true),
						eq(
							schema.registrationNumberFormats.institutionId,
							existing.institutionId,
						),
					),
				);
		}
		const updated = await repo.update(
			id,
			{
				name: data.name,
				description: data.description ?? undefined,
				definition: data.definition
					? normalizeDefinition(data.definition)
					: undefined,
				isActive: data.isActive,
				updatedAt: new Date(),
			},
			tx,
		);
		if (!updated) throw notFound("Format not found");
		return updated;
	});
}

export async function deleteFormat(id: string, institutionId: string) {
	await ensureFormat(id, institutionId);
	await repo.remove(id);
}

export async function getActiveFormat(institutionId: string) {
	return repo.findActive(institutionId);
}

export async function requireActiveFormat(
	institutionId: string,
	agent?: TransactionClient,
) {
	const format = await repo.findActive(institutionId, agent);
	if (!format) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No registration number format is active",
		});
	}
	return format;
}

const toProfileFragment = (
	profile?: RegistrationNumberProfileInput,
): RegistrationNumberProfileInput | undefined =>
	profile
		? {
				firstName: profile.firstName,
				lastName: profile.lastName,
				nationality: profile.nationality,
			}
		: undefined;

const handleGenerationError = (error: unknown) => {
	if (error instanceof RegistrationNumberError) {
		throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
	}
	throw error;
};

export async function issueRegistrationNumber(opts: {
	klass: classesRepo.KlassRecord;
	profile?: RegistrationNumberProfileInput;
	tx: TransactionClient;
	formatId?: string;
}) {
	const format = opts.formatId
		? await ensureFormat(opts.formatId, opts.klass.institutionId, opts.tx)
		: await requireActiveFormat(opts.klass.institutionId, opts.tx);
	try {
		return await generateRegistrationNumber({
			format,
			klass: opts.klass,
			profile: toProfileFragment(opts.profile),
			tx: opts.tx,
		});
	} catch (error) {
		handleGenerationError(error);
	}
	throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
}

export async function previewFormat(input: PreviewInput) {
	const klass = await classesRepo.findById(input.classId);
	if (!klass) throw notFound("Class not found");
	const format =
		input.definition !== undefined
			? {
					id: input.formatId ?? "preview",
					definition: normalizeDefinition(input.definition),
				}
			: input.formatId
				? await ensureFormat(input.formatId, klass.institutionId)
				: null;
	if (!format) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Provide either formatId or definition",
		});
	}
	try {
		const preview = await previewRegistrationNumber({
			format,
			klass,
			profile: toProfileFragment(input.profile),
			useExistingCounters: Boolean(format.id && format.id !== "preview"),
		});
		return { preview };
	} catch (error) {
		handleGenerationError(error);
	}
	throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
}
