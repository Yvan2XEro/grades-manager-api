import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";
import { getStorageAdapter, isSafeStorageKey } from "@/lib/storage";
import {
	router,
	tenantAdminProcedure,
	tenantGradingProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import { notFound } from "../_shared/errors";

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

/**
 * Uploads are stored under the folder of the uploading institution
 * (`<institutionId>/<uuid>.<ext>`): the key is what proves ownership when a
 * file is deleted. Files are served publicly by their unguessable URL (logos
 * and covers must be readable without a session).
 */
export const filesRouter = router({
	upload: tenantAdminProcedure
		.input(uploadSchema)
		.mutation(async ({ ctx, input }) => {
			const buffer = Buffer.from(input.base64, "base64");
			const adapter = getStorageAdapter();
			return adapter.save({
				buffer,
				filename: input.filename,
				mimeType: input.mimeType,
				folder: ctx.institution.id,
			});
		}),
	uploadAttendanceJustification: tenantGradingProcedure
		.input(uploadSchema)
		.mutation(async ({ ctx, input }) => {
			const buffer = Buffer.from(input.base64, "base64");
			const adapter = getStorageAdapter();
			return adapter.save({
				buffer,
				filename: input.filename,
				mimeType: input.mimeType,
				folder: ctx.institution.id,
			});
		}),
	uploadAvatar: tenantProtectedProcedure
		.input(avatarUploadSchema)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.session?.user.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			const buffer = Buffer.from(input.base64, "base64");
			const adapter = getStorageAdapter();
			const stored = await adapter.save({
				buffer,
				filename: input.filename,
				mimeType: input.mimeType,
				folder: ctx.institution.id,
			});
			await db
				.update(authSchema.user)
				.set({ image: stored.url })
				.where(eq(authSchema.user.id, userId));
			return stored;
		}),
	/** Deletes one of the institution's own uploads; any other key is NOT_FOUND. */
	delete: tenantAdminProcedure
		.input(z.object({ key: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			if (
				!isSafeStorageKey(input.key) ||
				!input.key.startsWith(`${ctx.institution.id}/`)
			)
				throw notFound("File not found");
			const adapter = getStorageAdapter();
			await adapter.delete(input.key);
			return { success: true };
		}),
});
