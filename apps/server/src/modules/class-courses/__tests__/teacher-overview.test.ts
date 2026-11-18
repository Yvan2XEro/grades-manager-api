import { describe, expect, it } from "bun:test";
import { getTestInstitution } from "../../../lib/test-context-state";
import {
	createClassCourse,
	createExam,
	createGrade,
	createStudent,
} from "../../../lib/test-utils";
import * as service from "../class-courses.service";

describe("teacher overview", () => {
	it("returns grade progress, average and semester half per exam in one pass", async () => {
		const cc = await createClassCourse();
		const institutionId = getTestInstitution().id;
		const exam = await createExam({ classCourse: cc.id, status: "scheduled" });
		const empty = await createExam({ classCourse: cc.id, status: "scheduled" });
		const s1 = await createStudent({ class: cc.class });
		const s2 = await createStudent({ class: cc.class });
		await createGrade({ student: s1.id, exam: exam.id, score: 12 });
		await createGrade({ student: s2.id, exam: exam.id, score: 15 });

		const { items } = await service.listClassCourses(
			{ classCourseIds: [cc.id], limit: 10 },
			institutionId,
		);
		const [course] = await service.buildTeacherOverview(items, institutionId, {
			profileId: null,
			memberRole: "administrator",
		});

		const graded = course.exams.find((e) => e.id === exam.id);
		const ungraded = course.exams.find((e) => e.id === empty.id);
		expect(graded?.gradedCount).toBe(2);
		expect(graded?.average).toBe(13.5);
		expect(ungraded?.gradedCount).toBe(0);
		expect(ungraded?.average).toBeNull();
		expect(course.semesterId).toBe(cc.semesterId);
		expect(course.yearHalf === "first" || course.yearHalf === "second").toBe(true);
	});
});
