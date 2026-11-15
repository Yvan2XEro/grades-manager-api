import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { StepContext } from "./types";

/** The academic year a year step works on; it must belong to the institution. */
export async function requireYear(ctx: StepContext) {
	if (!ctx.academicYearId)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This import step needs an academic year",
		});
	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, ctx.academicYearId),
			eq(schema.academicYears.institutionId, ctx.institutionId),
		),
	});
	if (!year)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Academic year not found",
		});
	return year;
}

/** A year that has ended is imported as history (closed enrollments, no notifications). */
export const isPastYear = (year: { endDate: Date | string }) =>
	new Date(year.endDate).getTime() < Date.now();
