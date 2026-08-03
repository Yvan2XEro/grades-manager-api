import { z } from "zod";
import { adminProcedure, router } from "@/lib/trpc";

const TEMPLATE_TYPES = [
	"academic-structure",
	"people",
	"enrollments",
	"grades-bulk",
] as const;

export const dataImportRouter = router({
	getTemplateUrl: adminProcedure
		.input(z.object({ type: z.enum(TEMPLATE_TYPES) }))
		.query(({ input }) => {
			const base = process.env.SERVER_PUBLIC_URL ?? "";
			return { url: `${base}/api/import/template/${input.type}` };
		}),
});
