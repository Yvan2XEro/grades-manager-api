import { conflict, notFound } from "../_shared/errors";
import * as repo from "./rooms.repo";

export async function createRoom(
	institutionId: string,
	input: {
		code: string;
		name: string;
		capacity?: number;
		building?: string;
		campus?: string;
	},
) {
	const existing = await repo
		.findById(input.code, institutionId)
		.catch(() => null);
	// code uniqueness is enforced by DB unique constraint; catch conflict
	try {
		return await repo.create({
			institutionId,
			code: input.code,
			name: input.name,
			capacity: input.capacity ?? null,
			building: input.building ?? null,
			campus: input.campus ?? null,
		});
	} catch (e: unknown) {
		if (e instanceof Error && e.message.includes("rooms_institution_code")) {
			throw conflict(`A room with code "${input.code}" already exists.`);
		}
		throw e;
	}
}

export async function listRooms(
	institutionId: string,
	opts: { isActive?: boolean } = {},
) {
	return repo.list(institutionId, opts);
}

export async function updateRoom(
	institutionId: string,
	input: {
		id: string;
		code?: string;
		name?: string;
		capacity?: number | null;
		building?: string | null;
		campus?: string | null;
		isActive?: boolean;
	},
) {
	const room = await repo.findById(input.id, institutionId);
	if (!room) throw notFound("Room not found");

	const { id, ...rest } = input;
	try {
		return await repo.update(id, institutionId, rest);
	} catch (e: unknown) {
		if (e instanceof Error && e.message.includes("rooms_institution_code")) {
			throw conflict("A room with that code already exists.");
		}
		throw e;
	}
}

export async function deleteRoom(id: string, institutionId: string) {
	const room = await repo.findById(id, institutionId);
	if (!room) throw notFound("Room not found");
	return repo.remove(id, institutionId);
}
