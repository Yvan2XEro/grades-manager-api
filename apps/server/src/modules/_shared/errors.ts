import { TRPCError } from "@trpc/server";

export function notFound(message = "Resource not found") {
  return new TRPCError({ code: "NOT_FOUND", message });
}

export function conflict(message = "Conflict") {
  return new TRPCError({ code: "CONFLICT", message });
}
