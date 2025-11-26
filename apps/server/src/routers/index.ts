import { examSchedulerRouter } from "@/modules/exam-scheduler/exam-scheduler.router";
import { gradesRouter } from "@/modules/grades";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { academicYearsRouter } from "../modules/academic-years";
import { classCoursesRouter } from "../modules/class-courses";
import { classesRouter } from "../modules/classes";
import { coursesRouter } from "../modules/courses";
import { enrollmentsRouter } from "../modules/enrollments";
import { examTypesRouter } from "../modules/exam-types";
import { examsRouter } from "../modules/exams";
import { facultiesRouter } from "../modules/faculties";
import { notificationsRouter } from "../modules/notifications";
import { programsRouter } from "../modules/programs";
import { studentsRouter } from "../modules/students";
import { teachingUnitsRouter } from "../modules/teaching-units";
import { usersRouter } from "../modules/users";
import { workflowsRouter } from "../modules/workflows";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	faculties: facultiesRouter,
	programs: programsRouter,
	teachingUnits: teachingUnitsRouter,
	academicYears: academicYearsRouter,
	classes: classesRouter,
	courses: coursesRouter,
	classCourses: classCoursesRouter,
	enrollments: enrollmentsRouter,
	exams: examsRouter,
	examTypes: examTypesRouter,
	examScheduler: examSchedulerRouter,
	students: studentsRouter,
	grades: gradesRouter,
	users: usersRouter,
	workflows: workflowsRouter,
	notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
