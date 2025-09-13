import { z } from "zod";
import { router, adminProcedure, superAdminProcedure } from "../lib/trpc";
import * as service from "../services/profiles.service";

const idSchema = z.object({ id: z.string() });
const emailSchema = z.object({ email: z.string().email() });
const listSchema = z.object({ cursor: z.string().optional(), limit: z.number().optional() });
const updateRoleSchema = z.object({ profileId: z.string(), role: z.string() });

export const profilesRouter = router({
  getById: adminProcedure.input(idSchema).query(({ input }) => service.getProfileById(input.id)),
  getByEmail: adminProcedure.input(emailSchema).query(({ input }) => service.getProfileByEmail(input.email)),
  list: adminProcedure.input(listSchema).query(({ input }) => service.listProfiles(input)),
  updateRole: superAdminProcedure.input(updateRoleSchema).mutation(({ input }) => service.updateRole(input.profileId, input.role)),
});
