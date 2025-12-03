import { describe, expect, it } from "vitest";
import {
	generateClassCode,
	generateClassCourseCode,
	generateCourseCode,
} from "./code-generator";

describe("code generator helpers", () => {
	it("generates course codes with incremental counters", () => {
		const base = generateCourseCode({
			programCode: "INF",
			levelCode: "L2",
			semesterCode: "S1",
			existingCodes: [],
		});
		expect(base).toBe("INF21" + "01");

		const next = generateCourseCode({
			programCode: "INF",
			levelCode: "L2",
			semesterCode: "S1",
			existingCodes: ["INF2101", "INF2102"],
		});
		expect(next).toBe("INF21" + "03");
	});

	it("suggests class codes with prefix + level + semester + counter", () => {
		const suggestion = generateClassCode({
			programCode: "MATH",
			levelCode: "L3",
			semesterCode: "S2",
			existingCodes: ["MATH32-01"],
		});
		expect(suggestion).toBe("MATH32-02");
	});

	it("builds class course codes referencing class and year", () => {
		const code = generateClassCourseCode({
			courseCode: "INF211",
			classCode: "INF31",
			academicYear: "2024/2025",
			existingCodes: ["INF211-INF3124-01"],
		});
		expect(code).toBe("INF211-INF3124-02");
	});
});
