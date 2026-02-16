import { z } from "zod";
import { protectedProcedure, router } from "@/lib/trpc";
import { promotionRules } from "../rules-engine/default-rules";
import * as service from "./promotions.service";

const studentSchema = z.object({ studentId: z.string() });

export const promotionsRouter = router({
	evaluateStudent: protectedProcedure
		.input(studentSchema)
		.query(({ input }) => service.evaluateStudentPromotion(input.studentId)),
	listDefaultRules: protectedProcedure.query(() => promotionRules),
});
