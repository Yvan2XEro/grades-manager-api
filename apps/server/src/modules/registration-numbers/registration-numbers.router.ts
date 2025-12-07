import {
	adminProcedure,
	protectedProcedure,
	router,
} from "@/lib/trpc";
import * as service from "./registration-numbers.service";
import {
	createFormatSchema,
	idSchema,
	listSchema,
	previewSchema,
	updateFormatSchema,
} from "./registration-numbers.zod";

export const registrationNumbersRouter = router({
	list: adminProcedure
		.input(listSchema.optional())
		.query(({ input }) => service.listFormats(input ?? {})),
	getActive: protectedProcedure.query(() => service.getActiveFormat()),
	create: adminProcedure
		.input(createFormatSchema)
		.mutation(({ input }) => service.createFormat(input)),
	update: adminProcedure
		.input(updateFormatSchema)
		.mutation(({ input }) => service.updateFormat(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteFormat(input.id)),
	preview: adminProcedure
		.input(previewSchema)
		.mutation(({ input }) => service.previewFormat(input)),
});
