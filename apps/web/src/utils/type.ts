import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/src/routers";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

type DateToString<T> = T extends Date
	? string
	: T extends object
		? { [K in keyof T]: DateToString<T[K]> }
		: T;

type ExtractListItem<T> = T extends { items: infer U }
	? U extends Array<infer V>
		? V
		: never
	: never;

// Academic Years
export type AcademicYearListInput = RouterInputs["academicYears"]["list"];
export type AcademicYearListOutput = DateToString<
	RouterOutputs["academicYears"]["list"]
>;
export type AcademicYear = AcademicYearListOutput["items"][number];

// Exam Types
export type ExamType = DateToString<
	RouterOutputs["examTypes"]["list"]
>["items"][number];

// Export Templates
export type ExportTemplate = DateToString<
	RouterOutputs["exportTemplates"]["list"]
>["items"][number];

// Diplomation Keys (ApiKeys)
export type ApiKey = DateToString<
	RouterOutputs["diplomationKeys"]["list"]
>[number];

// Teaching Units
export type TeachingUnit = DateToString<
	RouterOutputs["teachingUnits"]["list"]
>["items"][number];
export type TeachingUnitDetail = DateToString<
	RouterOutputs["teachingUnits"]["getById"]
>;

// Classes
export type Class = DateToString<
	RouterOutputs["classes"]["list"]
>["items"][number];
export type ClassDetail = DateToString<RouterOutputs["classes"]["getById"]>;

// Courses
export type Course = DateToString<
	RouterOutputs["courses"]["list"]
>["items"][number];
export type CourseDetail = DateToString<RouterOutputs["courses"]["getById"]>;

// Programs
export type Program = DateToString<
	RouterOutputs["programs"]["list"]
>["items"][number];
export type ProgramDetail = DateToString<RouterOutputs["programs"]["getById"]>;

// Class Courses
export type ClassCourse = DateToString<
	RouterOutputs["classCourses"]["list"]
>["items"][number];
export type ClassCourseDetail = DateToString<
	RouterOutputs["classCourses"]["getById"]
>;

// Students
export type Student = DateToString<
	RouterOutputs["students"]["list"]
>["items"][number];
export type StudentDetail = DateToString<RouterOutputs["students"]["getById"]>;

// Exams
export type Exam = DateToString<
	RouterOutputs["exams"]["list"]
>["items"][number];
export type ExamDetail = DateToString<RouterOutputs["exams"]["getById"]>;

// Institutions
export type Institution = DateToString<
	RouterOutputs["institutions"]["list"]
>["items"][number];
export type InstitutionDetail = DateToString<
	RouterOutputs["institutions"]["getById"]
>;

// Registration Number Formats
export type RegistrationNumberFormat = DateToString<
	RouterOutputs["registrationNumbers"]["list"]
>["items"][number];

// Exam Scheduler
export type ExamScheduleRun = DateToString<
	RouterOutputs["examScheduler"]["history"]
>["items"][number];
export type ExamSchedulePreview = DateToString<
	RouterOutputs["examScheduler"]["preview"]
>["items"][number];

// Semesters
export type Semester = DateToString<
	RouterOutputs["semesters"]["list"]
>["items"][number];

// Promotion Rules
export type PromotionRule = DateToString<
	RouterOutputs["promotionRules"]["list"]
>["items"][number];
export type PromotionExecution = DateToString<
	RouterOutputs["promotionRules"]["listExecutions"]
>["items"][number];
export type ExecutionDetails = DateToString<
	RouterOutputs["promotionRules"]["getExecutionDetails"]
>;

// Grades
export type Grade = DateToString<
	RouterOutputs["grades"]["listByStudent"]
>["items"][number];

// Student Course Enrollments
export type StudentCourseEnrollment = DateToString<
	RouterOutputs["studentCourseEnrollments"]["list"]
>["items"][number];

// Study Cycles
export type StudyCycle = DateToString<
	RouterOutputs["studyCycles"]["list"]
>["items"][number];

// Cycle Levels
export type CycleLevel = DateToString<
	RouterOutputs["cycleLevels"]["list"]
>["items"][number];

// Program Options
export type ProgramOption = DateToString<
	RouterOutputs["programOptions"]["list"]
>["items"][number];
