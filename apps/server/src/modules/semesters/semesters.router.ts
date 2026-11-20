import { router as createRouter, tenantProtectedProcedure } from "@/lib/trpc";
import * as service from "./semesters.service";

/*
 * Semesters are a platform catalog (S1, S2…): the table has no institution
 * column and is shared by every institution. Reading it is deliberately not
 * institution-filtered; it is only written by seeding/migrations, so no write
 * procedure is exposed here.
 */
export const router = createRouter({
	list: tenantProtectedProcedure.query(() => service.listSemesters()),
});
