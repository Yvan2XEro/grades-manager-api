import { describe, expect, it } from "bun:test";
import { createStudent } from "@/lib/test-utils";
import * as repo from "../academic-documents.repo";
import { buildRenderData } from "../academic-documents.service";

describe("academic documents render data", () => {
	it("exposes the document block used by the templates", async () => {
		const student = await createStudent();
		const studentCtx = await repo.loadStudentContext(
			student.institutionId,
			student.id,
		);
		if (!studentCtx) throw new Error("student context not found");

		const data = (await buildRenderData({
			kind: "attestation",
			studentCtx,
			deliberation: await repo.loadDeliberationResult(
				student.institutionId,
				student.id,
			),
			theme: {},
			demoMode: true,
		})) as { document?: { referenceNumber?: string; issueDate?: string } };

		// Templates print {{document.referenceNumber}} and {{document.issueDate}}
		expect(data.document?.referenceNumber).toBeTruthy();
		expect(data.document?.issueDate).toBeTruthy();
	});
});
