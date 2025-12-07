import { describe, expect, it } from "bun:test";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createFaculty,
	createProgram,
} from "@/lib/test-utils";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("registration numbers router", () => {
	it("creates formats, previews values, and lists entries", async () => {
		const admin = createCaller(asAdmin());
		const faculty = await createFaculty({ code: "SCI" });
		const program = await createProgram({
			faculty: faculty.id,
			code: "UDS-SCI",
		});
		const academicYear = await createAcademicYear({
			name: "2023/2024",
			startDate: new Date("2023-09-01"),
			endDate: new Date("2024-07-01"),
		});
		const klass = await createClass({
			program: program.id,
			academicYear: academicYear.id,
			code: "SCI-23",
		});
		const definition = {
			segments: [
				{ kind: "literal", value: "cm-" },
				{ kind: "field", field: "facultyCode", transform: "lower" },
				{ kind: "literal", value: "-" },
				{ kind: "field", field: "academicYearStartShort" },
				{ kind: "literal", value: "-" },
				{ kind: "counter", width: 2, scope: ["class"] },
			],
		};
		const format = await admin.registrationNumbers.create({
			name: "Cameroon SCI",
			definition,
			isActive: true,
		});
		const preview = await admin.registrationNumbers.preview({
			classId: klass.id,
			formatId: format.id,
		});
		expect(preview.preview).toBe("cm-sci-23-01");
		const list = await admin.registrationNumbers.list({});
		expect(list.some((entry) => entry.id === format.id)).toBe(true);
	});
});
