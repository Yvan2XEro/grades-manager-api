import { z } from "zod";
import { router, tenantProtectedProcedure } from "@/lib/trpc";
import {
	assertCanReadStudent,
	recordActorFromCtx,
} from "@/modules/authz/record-access";
import * as service from "./student-credit-ledger.service";

const studentSchema = z.object({ studentId: z.string() });

export const studentCreditLedgerRouter = router({
	summary: tenantProtectedProcedure
		.input(studentSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadStudent(
				recordActorFromCtx(ctx),
				input.studentId,
				ctx.institution.id,
			);
			return service.summarizeStudent(input.studentId);
		}),
	list: tenantProtectedProcedure
		.input(studentSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadStudent(
				recordActorFromCtx(ctx),
				input.studentId,
				ctx.institution.id,
			);
			return service.listByStudent(input.studentId);
		}),
});
