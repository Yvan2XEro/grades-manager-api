import z from "zod";
import { protectedProcedure, router } from "../../lib/trpc";
import * as service from "./users.service";

const listSchema = z.object({
	cursor: z.string().nullish(),
	limit: z.number().min(1).max(100).optional(),
	role: z.string().optional(),
});

export const usersRouter = router({
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listUsers(input)),
});
