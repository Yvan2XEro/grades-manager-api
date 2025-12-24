import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
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
		.query(({ ctx, input }) =>
			service.listFormats(input ?? {}, ctx.institution.id),
		),
	getActive: protectedProcedure.query(({ ctx }) =>
		service.getActiveFormat(ctx.institution.id),
	),
	create: adminProcedure
		.input(createFormatSchema)
		.mutation(({ ctx, input }) =>
			service.createFormat(input, ctx.institution.id),
		),
	update: adminProcedure
		.input(updateFormatSchema)
		.mutation(({ ctx, input }) =>
			service.updateFormat(input.id, input, ctx.institution.id),
		),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteFormat(input.id, ctx.institution.id),
		),
	preview: adminProcedure
		.input(previewSchema)
		.mutation(({ input }) => service.previewFormat(input)),
});
