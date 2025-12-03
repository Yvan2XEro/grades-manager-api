import { router as createRouter, protectedProcedure } from "../../lib/trpc";
import * as service from "./semesters.service";

export const router = createRouter({
	list: protectedProcedure.query(() => service.listSemesters()),
});
