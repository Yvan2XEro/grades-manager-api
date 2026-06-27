import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	asAdmin,
	createClassCourse,
	makeTestContext,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

/** Resolve the academicYearId for a given classCourse */
async function getAcademicYear(classCourseId: string) {
	const cc = await db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, classCourseId),
		with: { classRef: { columns: { academicYear: true } } },
	});
	if (!cc?.classRef?.academicYear) throw new Error("no academic year");
	return cc.classRef.academicYear;
}

describe("timetable router", () => {
	it("requires auth for list", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.timetable.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("requires admin role for list", async () => {
		const caller = createCaller(makeTestContext({ role: "student" }));
		await expect(caller.timetable.list({})).rejects.toHaveProperty(
			"code",
			"FORBIDDEN",
		);
	});

	it("requires admin role for create", async () => {
		const caller = createCaller(makeTestContext({ role: "teacher" }));
		await expect(
			caller.timetable.create({
				classCourseId: "cc",
				academicYearId: "ay",
				dayOfWeek: "mon",
				startTime: "08:00",
				endTime: "10:00",
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("creates and lists sessions", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		const { session } = await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
		});

		expect(session.classCourseId).toBe(cc.id);
		expect(session.dayOfWeek).toBe("mon");

		const sessions = await admin.timetable.list({ classCourseId: cc.id });
		expect(sessions.some((s) => s.id === session.id)).toBe(true);
	});

	it("blocks duplicate sessions", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "tue",
			startTime: "10:00",
			endTime: "12:00",
		});

		await expect(
			admin.timetable.create({
				classCourseId: cc.id,
				academicYearId,
				dayOfWeek: "tue",
				startTime: "10:00",
				endTime: "12:00",
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("blocks teacher double-booking", async () => {
		const admin = createCaller(asAdmin());
		const cc1 = await createClassCourse();
		const cc2 = await createClassCourse({ teacher: cc1.teacher });
		const ay1 = await getAcademicYear(cc1.id);
		const ay2 = await getAcademicYear(cc2.id);

		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId: ay1,
			dayOfWeek: "wed",
			startTime: "08:00",
			endTime: "10:00",
		});

		await expect(
			admin.timetable.create({
				classCourseId: cc2.id,
				academicYearId: ay2,
				dayOfWeek: "wed",
				startTime: "08:30",
				endTime: "10:30",
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("filters list by semesterId", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		// Create a session with the cc's semester, and one without
		const { session: s1 } = await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "09:00",
			semesterId: cc.semesterId ?? undefined,
		});
		await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "10:00",
			endTime: "11:00",
			// no semesterId — session not linked to a semester
		});

		if (!cc.semesterId) return; // skip assertion if no semester on fixture
		const filtered = await admin.timetable.list({
			classCourseId: cc.id,
			semesterId: cc.semesterId,
		});
		expect(filtered.length).toBe(1);
		expect(filtered[0].id).toBe(s1.id);
	});

	it("deletes a session", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		const { session } = await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "fri",
			startTime: "14:00",
			endTime: "16:00",
		});

		await admin.timetable.delete({ id: session.id });

		const sessions = await admin.timetable.list({ classCourseId: cc.id });
		expect(sessions.some((s) => s.id === session.id)).toBe(false);
	});
});
