import { z } from "zod";
import { protectedProcedure, router } from "@/lib/trpc";
import * as service from "./student-credit-ledger.service";

const studentSchema = z.object({ studentId: z.string() });

export const studentCreditLedgerRouter = router({
	summary: protectedProcedure
		.input(studentSchema)
		.query(({ input }) => service.summarizeStudent(input.studentId)),
	list: protectedProcedure
		.input(studentSchema)
		.query(({ input }) => service.listByStudent(input.studentId)),
});
