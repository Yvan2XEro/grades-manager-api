import { describe, expect, it } from "vitest";
import { isPathAllowedForRoleGroup } from "../RoleView";

describe("isPathAllowedForRoleGroup", () => {
	it("keeps students on their own pages", () => {
		for (const path of [
			"/",
			"/exams",
			"/timetable",
			"/enrollments",
			"/fees",
			"/documents",
			"/timeline",
			"/notifications",
			"/settings/profile",
		]) {
			expect(isPathAllowedForRoleGroup("student", path)).toBe(true);
		}
	});

	it("bounces students from staff pages", () => {
		for (const path of [
			"/classes",
			"/students",
			"/academic-results/deliberations",
			"/fee-clearance/structures",
			"/notifications/center",
			"/grades/abc",
			"/exams-legacy",
			"/institution",
			"/admin",
		]) {
			expect(isPathAllowedForRoleGroup("student", path)).toBe(false);
		}
	});

	it("does not restrict staff role groups", () => {
		expect(isPathAllowedForRoleGroup("admin", "/classes")).toBe(true);
		expect(isPathAllowedForRoleGroup("teacher", "/grades/abc")).toBe(true);
	});
});
