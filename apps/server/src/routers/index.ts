import { router, publicProcedure, protectedProcedure } from "../lib/trpc";
import { facultiesRouter } from "./faculties.router";
import { programsRouter } from "./programs.router";
import { academicYearsRouter } from "./academicYears.router";
import { classesRouter } from "./classes.router";
import { profilesRouter } from "./profiles.router";
import { coursesRouter } from "./courses.router";
import { classCoursesRouter } from "./classCourses.router";
import { examsRouter } from "./exams.router";
import { studentsRouter } from "./students.router";
import { gradesRouter } from "./grades.router";

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
