import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { academicYearsRouter } from "../modules/academic-years";
import { classCoursesRouter } from "../modules/class-courses";
import { classesRouter } from "../modules/classes";
import { examsRouter } from "../modules/exams";
import { facultiesRouter } from "../modules/faculties";
import { coursesRouter } from "./courses.router";
import { gradesRouter } from "./grades.router";
import { profilesRouter } from "./profiles.router";
import { programsRouter } from "./programs.router";
import { studentsRouter } from "./students.router";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	faculties: facultiesRouter,
	programs: programsRouter,
	academicYears: academicYearsRouter,
	classes: classesRouter,
	profiles: profilesRouter,
	courses: coursesRouter,
	classCourses: classCoursesRouter,
	exams: examsRouter,
	students: studentsRouter,
	grades: gradesRouter,
});

export type AppRouter = typeof appRouter;
