import { z } from "zod";
import { adminProcedure, router } from "@/lib/trpc";
import { getStorageAdapter } from "@/lib/storage";

const uploadSchema = z.object({
	filename: z.string().min(1),
	mimeType: z.string().min(1),
	base64: z.string().min(1),
});

export const filesRouter = router({
	upload: adminProcedure.input(uploadSchema).mutation(async ({ input }) => {
		const buffer = Buffer.from(input.base64, "base64");
		const adapter = getStorageAdapter();
		return adapter.save({
			buffer,
			filename: input.filename,
			mimeType: input.mimeType,
		});
	}),
	delete: adminProcedure
		.input(z.object({ key: z.string().min(1) }))
		.mutation(async ({ input }) => {
			const adapter = getStorageAdapter();
			await adapter.delete(input.key);
			return { success: true };
		}),
});
