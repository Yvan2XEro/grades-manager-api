import { gradesRouter } from "@/modules/grades";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { academicYearsRouter } from "../modules/academic-years";
import { classCoursesRouter } from "../modules/class-courses";
import { classesRouter } from "../modules/classes";
import { coursesRouter } from "../modules/courses";
import { examsRouter } from "../modules/exams";
import { facultiesRouter } from "../modules/faculties";
import { programsRouter } from "../modules/programs";
import { studentsRouter } from "../modules/students";

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
	courses: coursesRouter,
	classCourses: classCoursesRouter,
	exams: examsRouter,
	students: studentsRouter,
	grades: gradesRouter,
});

export type AppRouter = typeof appRouter;
