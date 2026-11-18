import { TRPCError } from "@trpc/server";

export const notFound = (message = "Not found") =>
	new TRPCError({ code: "NOT_FOUND", message });

export const conflict = (message = "Conflict") =>
	new TRPCError({ code: "CONFLICT", message });

export const forbidden = (message = "Forbidden") =>
	new TRPCError({ code: "FORBIDDEN", message });
