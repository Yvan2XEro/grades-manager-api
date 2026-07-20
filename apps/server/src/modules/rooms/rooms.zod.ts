import { z } from "zod";

export const createRoomSchema = z.object({
	code: z.string().min(1).max(20),
	name: z.string().min(1).max(100),
	capacity: z.number().int().positive().optional(),
	building: z.string().max(100).optional(),
	campus: z.string().max(100).optional(),
});

export const updateRoomSchema = z.object({
	id: z.string(),
	code: z.string().min(1).max(20).optional(),
	name: z.string().min(1).max(100).optional(),
	capacity: z.number().int().positive().nullable().optional(),
	building: z.string().max(100).nullable().optional(),
	campus: z.string().max(100).nullable().optional(),
	isActive: z.boolean().optional(),
});

export const deleteRoomSchema = z.object({ id: z.string() });

export const listRoomsSchema = z.object({
	isActive: z.boolean().optional(),
});
