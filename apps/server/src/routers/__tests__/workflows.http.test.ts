import { describe, expect, it } from "bun:test";
import { trpcServer } from "@hono/trpc-server";
import { createTRPCProxyClient } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { Hono } from "hono";
import { asAdmin, createUser } from "../../lib/test-utils";
import { type AppRouter, appRouter } from "../index";

const app = new Hono();

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: () => asAdmin(),
	}),
);

const honoFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
	const req =
		typeof input === "string" || input instanceof URL
			? new Request(input.toString(), init)
			: (input as Request);
	return await app.request(req);
};

const client = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "http://test.local/trpc",
			fetch: honoFetch,
		}),
	],
});

describe("workflows router", () => {
	it("runs grade validation and enrollment automation", async () => {
		// Create program using test helper (institutions are created in test setup)
		const program = await client.programs.create.mutate({
			name: "Workflow P",
			code: "WF-P",
		});
		const year = await client.academicYears.create.mutate({
			name: "2025/2026",
			startDate: new Date().toISOString(),
			endDate: new Date(Date.now() + 86_400_000).toISOString(),
		});
		const klass = await client.classes.create.mutate({
			name: "WF Class",
			program: program.id,
			academicYear: year.id,
			code: "WF-CLS",
		});
		const teacher = await createUser();
		const teachingUnit = await client.teachingUnits.create.mutate({
			name: "UE WF",
			code: "UE-WF",
			programId: program.id,
			credits: 6,
			semester: "annual",
		});
		const course = await client.courses.create.mutate({
			code: "WF-CRS",
			name: "Workflow Course",
			credits: 2,
			hours: 20,
			program: program.id,
			teachingUnitId: teachingUnit.id,
			defaultTeacher: teacher.profile.id,
		});
		const classCourse = await client.classCourses.create.mutate({
			code: "WF-CC",
			class: klass.id,
			course: course.id,
			teacher: teacher.profile.id,
			weeklyHours: 2,
		});

		const student = await client.students.create.mutate({
			classId: klass.id,
			registrationNumber: "WF-001",
			firstName: "Workflow",
			lastName: "Student",
			email: "workflow.student@example.com",
			dateOfBirth: new Date("2000-01-01"),
			placeOfBirth: "Yaoundé",
			gender: "male",
		});

		await client.studentCourseEnrollments.bulkEnroll.mutate({
			studentId: student.id,
			classCourseIds: [classCourse.id],
			status: "active",
		});

		const exam = await client.exams.create.mutate({
			name: "WF Midterm",
			type: "WRITTEN",
			date: new Date().toISOString(),
			percentage: 40,
			classCourseId: classCourse.id,
		});
		await client.exams.submit.mutate({ examId: exam.id });

		await client.workflows.enrollmentWindow.mutate({
			classId: klass.id,
			academicYearId: year.id,
			action: "open",
		});

		await client.grades.upsertNote.mutate({
			studentId: student.id,
			examId: exam.id,
			score: 15,
		});

		await client.workflows.validateGrades.mutate({ examId: exam.id });

		await client.workflows.attendanceAlert.mutate({
			classCourseId: classCourse.id,
			severity: "warning",
			message: "Attendance dropped below threshold",
		});

		const windows = await client.workflows.enrollmentWindows.query();
		expect(windows[0]?.status).toBe("open");

		const notifications = await client.notifications.list.query({});
		expect(notifications.length).toBeGreaterThanOrEqual(2);
	});
});
