import { publicProcedure, router } from "../lib/trpc";
import { router as academicYearsRouter } from "../modules/academic-years";
import { router as assessmentsRouter } from "../modules/assessments";
import { router as attendanceRouter } from "../modules/attendance";
import { router as classCouncilsRouter } from "../modules/class-councils";
import { router as classesRouter } from "../modules/classes";
import { router as enrollmentsRouter } from "../modules/enrollments";
import { router as financeRouter } from "../modules/finance";
import { router as officialExamsRouter } from "../modules/official-exams";
import { router as reportCardsRouter } from "../modules/report-cards";
import { router as staffRouter } from "../modules/staff";
import { router as studentsRouter } from "../modules/students";
import { router as subjectAssignmentsRouter } from "../modules/subject-assignments";
import { router as subjectsRouter } from "../modules/subjects";
import { router as termsRouter } from "../modules/terms";
import { router as tracksRouter } from "../modules/tracks";

export const appRouter = router({
	health: publicProcedure.query(() => ({
		ok: true,
		service: "tkams-secondary",
	})),
	academicYears: academicYearsRouter,
	assessments: assessmentsRouter,
	attendance: attendanceRouter,
	classCouncils: classCouncilsRouter,
	classes: classesRouter,
	enrollments: enrollmentsRouter,
	finance: financeRouter,
	officialExams: officialExamsRouter,
	reportCards: reportCardsRouter,
	staff: staffRouter,
	students: studentsRouter,
	subjectAssignments: subjectAssignmentsRouter,
	subjects: subjectsRouter,
	terms: termsRouter,
	tracks: tracksRouter,
});

export type AppRouter = typeof appRouter;
