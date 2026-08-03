import { academicDocumentsRouter } from "@/modules/academic-documents";
import { academicYearTransitionsRouter } from "@/modules/academic-year-transitions";
import { admissionsRouter } from "@/modules/admissions";
import { attendanceRouter } from "@/modules/attendance";
import { batchJobsRouter, registerAllJobTypes } from "@/modules/batch-jobs";
import { centersRouter } from "@/modules/centers";
import { deliberationsRouter } from "@/modules/deliberations";
import { diplomationKeysRouter } from "@/modules/diplomation-keys";
import { examGradeEditorsRouter } from "@/modules/exam-grade-editors";
import { examSchedulerRouter } from "@/modules/exam-scheduler/exam-scheduler.router";
import { exportEligibilityRouter } from "@/modules/export-eligibility";
import { feeClearanceRouter } from "@/modules/fee-clearance";
import { gradeAccessGrantsRouter } from "@/modules/grade-access-grants";
import { gradeScalesRouter } from "@/modules/grade-scales";
import { gradesRouter } from "@/modules/grades";
import { guardiansRouter } from "@/modules/guardians";
import { profilesRouter } from "@/modules/profiles";
import { roomsRouter } from "@/modules/rooms";
import { router as timetableRouter } from "@/modules/timetable";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { academicYearsRouter } from "../modules/academic-years";
import { classCoursesRouter } from "../modules/class-courses";
import { classesRouter } from "../modules/classes";
import { coursesRouter } from "../modules/courses";
import { cycleLevelsRouter } from "../modules/cycle-levels";
import { dataImportRouter } from "../modules/data-import";
import { enrollmentsRouter } from "../modules/enrollments";
import { examTypesRouter } from "../modules/exam-types";
import { examsRouter } from "../modules/exams";
import { exportTemplatesRouter } from "../modules/export-templates";
import { exportsRouter } from "../modules/exports";
import { filesRouter } from "../modules/files";
import { institutionsRouter } from "../modules/institutions";
import { notificationsRouter } from "../modules/notifications";
import { programOptionsRouter } from "../modules/program-options";
import { programsRouter } from "../modules/programs";
import { promotionRulesRouter } from "../modules/promotion-rules";
import { registrationNumbersRouter } from "../modules/registration-numbers";
import { semestersRouter } from "../modules/semesters";
import { statsRouter } from "../modules/stats";
import { studentCourseEnrollmentsRouter } from "../modules/student-course-enrollments";
import { studentCreditLedgerRouter } from "../modules/student-credit-ledger";
import { studentsRouter } from "../modules/students";
import { studyCyclesRouter } from "../modules/study-cycles";
import { teachingUnitsRouter } from "../modules/teaching-units";
import { usersRouter } from "../modules/users";
import { workflowsRouter } from "../modules/workflows";

// Register all batch job type handlers
registerAllJobTypes();

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	programs: programsRouter,
	studyCycles: studyCyclesRouter,
	cycleLevels: cycleLevelsRouter,
	programOptions: programOptionsRouter,
	teachingUnits: teachingUnitsRouter,
	academicYears: academicYearsRouter,
	classes: classesRouter,
	courses: coursesRouter,
	semesters: semestersRouter,
	classCourses: classCoursesRouter,
	studentCourseEnrollments: studentCourseEnrollmentsRouter,
	studentCreditLedger: studentCreditLedgerRouter,
	enrollments: enrollmentsRouter,
	exams: examsRouter,
	examTypes: examTypesRouter,
	examScheduler: examSchedulerRouter,
	examGradeEditors: examGradeEditorsRouter,
	students: studentsRouter,
	promotionRules: promotionRulesRouter,
	registrationNumbers: registrationNumbersRouter,
	files: filesRouter,
	institutions: institutionsRouter,
	grades: gradesRouter,
	guardians: guardiansRouter,
	exports: exportsRouter,
	exportTemplates: exportTemplatesRouter,
	users: usersRouter,
	workflows: workflowsRouter,
	dataImport: dataImportRouter,
	notifications: notificationsRouter,
	batchJobs: batchJobsRouter,
	deliberations: deliberationsRouter,
	gradeAccessGrants: gradeAccessGrantsRouter,
	gradeScales: gradeScalesRouter,
	diplomationKeys: diplomationKeysRouter,
	centers: centersRouter,
	exportEligibility: exportEligibilityRouter,
	academicDocuments: academicDocumentsRouter,
	academicYearTransitions: academicYearTransitionsRouter,
	feeClearance: feeClearanceRouter,
	timetable: timetableRouter,
	rooms: roomsRouter,
	attendance: attendanceRouter,
	admissions: admissionsRouter,
	profiles: profilesRouter,
	stats: statsRouter,
});

export type AppRouter = typeof appRouter;
