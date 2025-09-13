import { TRPCError } from "@trpc/server";

export function requireRole(session: { user?: { role?: string } }, roles: string[]) {
  const role = session.user?.role;
  if (!role || !roles.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}
