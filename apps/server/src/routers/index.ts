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
import { programOptionsRouter } from "../modules/program-options";
import { programsRouter } from "../modules/programs";
import { promotionsRouter } from "../modules/promotions";
import { studentCourseEnrollmentsRouter } from "../modules/student-course-enrollments";
import { studentCreditLedgerRouter } from "../modules/student-credit-ledger";
import { studentsRouter } from "../modules/students";
import { studyCyclesRouter } from "../modules/study-cycles";
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
	studyCycles: studyCyclesRouter,
	programOptions: programOptionsRouter,
	teachingUnits: teachingUnitsRouter,
	academicYears: academicYearsRouter,
	classes: classesRouter,
	courses: coursesRouter,
	classCourses: classCoursesRouter,
	studentCourseEnrollments: studentCourseEnrollmentsRouter,
	studentCreditLedger: studentCreditLedgerRouter,
	enrollments: enrollmentsRouter,
	exams: examsRouter,
	examTypes: examTypesRouter,
	examScheduler: examSchedulerRouter,
	students: studentsRouter,
	promotions: promotionsRouter,
	grades: gradesRouter,
	users: usersRouter,
	workflows: workflowsRouter,
	notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
