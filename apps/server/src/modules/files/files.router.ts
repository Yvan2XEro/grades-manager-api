import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";
import { getStorageAdapter } from "@/lib/storage";
import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";

const uploadSchema = z.object({
	filename: z.string().min(1),
	mimeType: z.string().min(1),
	base64: z.string().min(1),
});

const avatarUploadSchema = z.object({
	filename: z.string().min(1),
	mimeType: z.string().regex(/^image\//, "Only image files are allowed"),
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
	uploadAvatar: protectedProcedure
		.input(avatarUploadSchema)
		.mutation(async ({ input, ctx }) => {
			const buffer = Buffer.from(input.base64, "base64");
			const adapter = getStorageAdapter();
			const stored = await adapter.save({
				buffer,
				filename: input.filename,
				mimeType: input.mimeType,
			});
			await db
				.update(authSchema.user)
				.set({ image: stored.url })
				.where(eq(authSchema.user.id, ctx.session.user.id));
			return stored;
		}),
	delete: adminProcedure
		.input(z.object({ key: z.string().min(1) }))
		.mutation(async ({ input }) => {
			const adapter = getStorageAdapter();
			await adapter.delete(input.key);
			return { success: true };
		}),
});
