import {
	type InferInsertModel,
	type InferSelectModel,
	relations,
	sql,
} from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { member, organization, user } from "./auth";
import type { RegistrationNumberFormatDefinition } from "./registration-number-types";

/** Business roles available for domain-level RBAC. */
export const businessRoles = [
	"super_admin",
	"administrator",
	"dean",
	"teacher",
	"staff",
	"student",
] as const;
export type BusinessRole = (typeof businessRoles)[number];

/** Gender choices stored on domain user profiles. */
export const genders = ["male", "female", "other"] as const;
export type Gender = (typeof genders)[number];

/** Lifecycle state for domain user profiles. */
export const domainStatuses = ["active", "inactive", "suspended"] as const;
export type DomainUserStatus = (typeof domainStatuses)[number];

/** Semester placement for teaching units (UE). */
export const teachingUnitSemesters = ["fall", "spring", "annual"] as const;
export type TeachingUnitSemester = (typeof teachingUnitSemesters)[number];

/** Enrollment lifecycle for student ↔ classe ↔ academic year. */
export const enrollmentStatuses = [
	"pending",
	"active",
	"completed",
	"withdrawn",
] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

export const enrollmentWindowStatuses = ["open", "closed"] as const;
export type EnrollmentWindowStatus = (typeof enrollmentWindowStatuses)[number];

/** Enrollment lifecycle for student ↔ course attempts. */
export const studentCourseEnrollmentStatuses = [
	"planned",
	"active",
	"completed",
	"failed",
	"withdrawn",
] as const;
export type StudentCourseEnrollmentStatus =
	(typeof studentCourseEnrollmentStatuses)[number];

export const notificationChannels = ["email", "webhook"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationStatuses = ["pending", "sent", "failed"] as const;
export type NotificationStatus = (typeof notificationStatuses)[number];

/** Business profiles decoupled from Better Auth accounts. */
export const domainUsers = pgTable(
	"domain_users",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		authUserId: text("auth_user_id").references(() => user.id, {
			onDelete: "cascade",
		}),
		memberId: text("member_id").references(() => member.id, {
			onDelete: "set null",
		}),
		businessRole: text("business_role").$type<BusinessRole>().notNull(),
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		primaryEmail: text("primary_email").notNull(),
		phone: text("phone"),
		dateOfBirth: date("date_of_birth"),
		placeOfBirth: text("place_of_birth"),
		gender: text("gender").$type<Gender>(),
		nationality: text("nationality"),
		status: text("status")
			.$type<DomainUserStatus>()
			.notNull()
			.default("active"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_domain_users_auth").on(t.authUserId),
		unique("uq_domain_users_member").on(t.memberId),
		unique("uq_domain_users_email").on(t.primaryEmail),
		index("idx_domain_users_role").on(t.businessRole),
	],
);

/** Root institution profile storing bilingual metadata and branding. */

/** Catalog of allowed exam types (CC, TP...). */
export const examTypes = pgTable(
	"exam_types",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_exam_types_name_institution").on(t.institutionId, t.name),
		index("idx_exam_types_institution_id").on(t.institutionId),
	],
);

/** Catalog of allowed exam types (CC, TP...). */
/** Faculties (schools) grouping programs. */
export const faculties = pgTable(
	"faculties",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_faculties_name_institution").on(t.institutionId, t.name),
		unique("uq_faculties_code_institution").on(t.institutionId, t.code),
		index("idx_faculties_institution").on(t.institutionId),
	],
);

/** Study cycles grouping programs inside a faculty (e.g., Bachelor, Master). */
export const studyCycles = pgTable(
	"study_cycles",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		facultyId: text("faculty_id")
			.notNull()
			.references(() => faculties.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		totalCreditsRequired: integer("total_credits_required")
			.notNull()
			.default(180),
		durationYears: integer("duration_years").notNull().default(3),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_study_cycles_faculty_code").on(t.facultyId, t.code),
		index("idx_study_cycles_faculty").on(t.facultyId),
	],
);

/** Ordered levels within a study cycle (L1, L2, etc.). */
export const cycleLevels = pgTable(
	"cycle_levels",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		cycleId: text("cycle_id")
			.notNull()
			.references(() => studyCycles.id, { onDelete: "cascade" }),
		orderIndex: integer("order_index").notNull(),
		code: text("code").notNull(),
		name: text("name").notNull(),
		minCredits: integer("min_credits").notNull().default(60),
	},
	(t) => [
		unique("uq_cycle_levels_code").on(t.cycleId, t.code),
		unique("uq_cycle_levels_order").on(t.cycleId, t.orderIndex),
		index("idx_cycle_levels_cycle").on(t.cycleId),
	],
);

/** Semester catalog (S1, S2, etc.). */
export const semesters = pgTable(
	"semesters",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		code: text("code").notNull(),
		name: text("name").notNull(),
		orderIndex: integer("order_index").notNull(),
	},
	(t) => [
		unique("uq_semesters_code").on(t.code),
		index("idx_semesters_order").on(t.orderIndex),
	],
);

/** Official academic sessions (e.g., 2024–2025). */
export const academicYears = pgTable(
	"academic_years",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		startDate: date("start_date").notNull(),
		endDate: date("end_date").notNull(),
		isActive: boolean("is_active").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		check("chk_academic_years_dates", sql`${t.endDate} > ${t.startDate}`),
		index("idx_academic_years_institution").on(t.institutionId),
		unique("uq_academic_years_institution_name").on(t.institutionId, t.name),
	],
);

/** Programs offered under a faculty. */
export const programs = pgTable(
	"programs",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		faculty: text("faculty_id")
			.notNull()
			.references(() => faculties.id, { onDelete: "restrict" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_programs_name_faculty").on(t.name, t.faculty),
		unique("uq_programs_code_faculty").on(t.code, t.faculty),
		unique("uq_programs_slug_faculty").on(t.slug, t.faculty),
		index("idx_programs_institution_id").on(t.institutionId),
		index("idx_programs_faculty_id").on(t.faculty),
	],
);

export const programOptions = pgTable(
	"program_options",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		programId: text("program_id")
			.notNull()
			.references(() => programs.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		code: text("code").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_program_options_program_code").on(t.programId, t.code),
		index("idx_program_options_program_id").on(t.programId),
		index("idx_program_options_institution_id").on(t.institutionId),
	],
);

/** UE/Module layer grouping courses inside a program. */
export const teachingUnits = pgTable(
	"teaching_units",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		programId: text("program_id")
			.notNull()
			.references(() => programs.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		code: text("code").notNull(),
		description: text("description"),
		credits: integer("credits").notNull().default(0),
		semester: text("semester")
			.$type<TeachingUnitSemester>()
			.notNull()
			.default("annual"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_teaching_units_program_code").on(t.programId, t.code),
		index("idx_teaching_units_program_id").on(t.programId),
	],
);

/** Cohorts/classes tied to a program and academic year. */
export const classes = pgTable(
	"classes",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		name: text("name").notNull(),
		program: text("program_id")
			.notNull()
			.references(() => programs.id, { onDelete: "cascade" }),
		academicYear: text("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "restrict" }),
		semesterId: text("semester_id").references(() => semesters.id, {
			onDelete: "set null",
		}),
		cycleLevelId: text("cycle_level_id")
			.notNull()
			.references(() => cycleLevels.id, { onDelete: "restrict" }),
		programOptionId: text("program_option_id")
			.notNull()
			.references(() => programOptions.id, { onDelete: "restrict" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_classes_name_program_year").on(
			t.name,
			t.program,
			t.academicYear,
		),
		unique("uq_classes_code_year").on(t.code, t.academicYear),
		index("idx_classes_institution_id").on(t.institutionId),
		index("idx_classes_program_id").on(t.program),
		index("idx_classes_academic_year_id").on(t.academicYear),
		index("idx_classes_semester_id").on(t.semesterId),
		index("idx_classes_cycle_level_id").on(t.cycleLevelId),
		index("idx_classes_program_option_id").on(t.programOptionId),
	],
);

/** EC definitions tied to a program and teaching unit. */
export const courses = pgTable(
	"courses",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		code: text("code").notNull(),
		name: text("name").notNull(),
		hours: integer("hours").notNull(),
		program: text("program_id")
			.notNull()
			.references(() => programs.id, { onDelete: "cascade" }),
		teachingUnitId: text("teaching_unit_id")
			.notNull()
			.references(() => teachingUnits.id, { onDelete: "cascade" }),
		defaultTeacher: text("default_teacher_id").references(
			() => domainUsers.id,
			{
				onDelete: "restrict",
			},
		),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		check("chk_courses_hours", sql`${t.hours} > 0`),
		unique("uq_courses_name_program").on(t.name, t.program),
		unique("uq_courses_code_program").on(t.code, t.program),
		index("idx_courses_program_id").on(t.program),
		index("idx_courses_teaching_unit_id").on(t.teachingUnitId),
		index("idx_courses_default_teacher_id").on(t.defaultTeacher),
	],
);

/** Assigns a course to a class with a teacher (and workload). */
export const classCourses = pgTable(
	"class_courses",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		class: text("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		course: text("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		teacher: text("teacher_id")
			.notNull()
			.references(() => domainUsers.id, { onDelete: "restrict" }),
		semesterId: text("semester_id").references(() => semesters.id, {
			onDelete: "set null",
		}),
		weeklyHours: integer("weekly_hours").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_class_courses").on(t.class, t.course),
		unique("uq_class_courses_code").on(t.code),
		index("idx_class_courses_institution_id").on(t.institutionId),
		index("idx_class_courses_class_id").on(t.class),
		index("idx_class_courses_course_id").on(t.course),
		index("idx_class_courses_teacher_id").on(t.teacher),
		index("idx_class_courses_semester_id").on(t.semesterId),
	],
);

/** Audit trail of bulk scheduling operations. */
export const examScheduleRuns = pgTable(
	"exam_schedule_runs",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		facultyId: text("faculty_id")
			.notNull()
			.references(() => faculties.id, { onDelete: "restrict" }),
		academicYearId: text("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "restrict" }),
		examTypeId: text("exam_type_id")
			.notNull()
			.references(() => examTypes.id, { onDelete: "restrict" }),
		percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
		dateStart: timestamp("date_start", { withTimezone: true }).notNull(),
		dateEnd: timestamp("date_end", { withTimezone: true }).notNull(),
		classIds: jsonb("class_ids").$type<string[]>().notNull(),
		classCount: integer("class_count").notNull(),
		classCourseCount: integer("class_course_count").notNull(),
		createdCount: integer("created_count").notNull(),
		skippedCount: integer("skipped_count").notNull(),
		duplicateCount: integer("duplicate_count").notNull(),
		conflictCount: integer("conflict_count").notNull(),
		scheduledBy: text("scheduled_by").references(() => domainUsers.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("idx_exam_schedule_runs_faculty").on(t.facultyId),
		index("idx_exam_schedule_runs_year").on(t.academicYearId),
		index("idx_exam_schedule_runs_type").on(t.examTypeId),
	],
);

/** Exams planned for a class-course, with workflow metadata. */
export const exams = pgTable(
	"exams",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		type: text("type").notNull(),
		date: timestamp("date", { withTimezone: true }).notNull(),
		percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
		classCourse: text("class_course_id")
			.notNull()
			.references(() => classCourses.id, { onDelete: "cascade" }),
		isLocked: boolean("is_locked").notNull().default(false),
		status: text("status").notNull().default("draft"),
		scheduledBy: text("scheduled_by").references(() => domainUsers.id, {
			onDelete: "set null",
		}),
		validatedBy: text("validated_by").references(() => domainUsers.id, {
			onDelete: "set null",
		}),
		scheduleRunId: text("schedule_run_id").references(
			() => examScheduleRuns.id,
			{ onDelete: "set null" },
		),
		scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
		validatedAt: timestamp("validated_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		check(
			"chk_exams_percentage",
			sql`${t.percentage} >= 0 AND ${t.percentage} <= 100`,
		),
		index("idx_exams_institution_id").on(t.institutionId),
		index("idx_exams_class_course_id").on(t.classCourse),
		index("idx_exams_date").on(t.date),
	],
);

/** Student records referencing domain profiles. */
export const students = pgTable(
	"students",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		domainUserId: text("domain_user_id")
			.notNull()
			.references(() => domainUsers.id, { onDelete: "restrict" }),
		registrationNumber: text("registration_number").notNull(),
		class: text("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "restrict" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_students_registration").on(t.registrationNumber),
		unique("uq_students_domain_user").on(t.domainUserId),
		index("idx_students_institution_id").on(t.institutionId),
		index("idx_students_class_id").on(t.class),
		index("idx_students_domain_user_id").on(t.domainUserId),
	],
);

/** Configurable templates for student registration numbers. */
export const registrationNumberFormats = pgTable(
	"registration_number_formats",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		definition: jsonb("definition")
			.$type<RegistrationNumberFormatDefinition>()
			.notNull(),
		isActive: boolean("is_active").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("idx_registration_formats_active").on(t.isActive),
		index("idx_registration_formats_institution_id").on(t.institutionId),
	],
);

/** Counter checkpoints partitioned by format + scope key. */
export const registrationNumberCounters = pgTable(
	"registration_number_counters",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		formatId: text("format_id")
			.notNull()
			.references(() => registrationNumberFormats.id, {
				onDelete: "cascade",
			}),
		scopeKey: text("scope_key").notNull(),
		lastValue: integer("last_value").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_registration_counter_scope").on(t.formatId, t.scopeKey),
		index("idx_registration_counter_format_id").on(t.formatId),
	],
);

/** Institution master data with bilingual metadata. */
/** Institution metadata for export configuration */
export interface InstitutionMetadata {
	export_config?: {
		grading?: {
			appreciations?: Array<{
				label: string;
				min: number;
				max: number;
			}>;
			passing_grade?: number;
			scale?: number;
		};
		signatures?: {
			pv?: Array<{ position: string; name: string }>;
			evaluation?: Array<{ position: string; name: string }>;
			ue?: Array<{ position: string; name: string }>;
		};
		exam_settings?: {
			default_duration_hours?: number;
			default_coefficient?: number;
			exam_types?: Record<
				string,
				{
					label: string;
					coefficient: number;
				}
			>;
		};
		watermark?: {
			text?: string;
			enabled?: boolean;
		};
	};
	[key: string]: unknown;
}

/** Institution types for hierarchical structure. */
export const institutionTypes = ["university", "institution", "faculty"] as const;
export type InstitutionType = (typeof institutionTypes)[number];

export const institutions = pgTable(
	"institutions",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		code: text("code").notNull(),
		type: text("type").$type<InstitutionType>().notNull().default("institution"),
		shortName: text("short_name"),
		nameFr: text("name_fr").notNull(),
		nameEn: text("name_en").notNull(),
		legalNameFr: text("legal_name_fr"),
		legalNameEn: text("legal_name_en"),
		sloganFr: text("slogan_fr"),
		sloganEn: text("slogan_en"),
		descriptionFr: text("description_fr"),
		descriptionEn: text("description_en"),
		addressFr: text("address_fr"),
		addressEn: text("address_en"),
		contactEmail: text("contact_email"),
		contactPhone: text("contact_phone"),
		fax: text("fax"),
		postalBox: text("postal_box"),
		website: text("website"),
		logoUrl: text("logo_url"),
		coverImageUrl: text("cover_image_url"),
		parentInstitutionId: text("parent_institution_id").references(
			(): any => institutions.id,
			{
				onDelete: "set null",
			},
		),
		facultyId: text("faculty_id").references(() => faculties.id, {
			onDelete: "set null",
		}),
		organizationId: text("organization_id").references(() => organization.id, {
			onDelete: "set null",
		}),
		defaultAcademicYearId: text("default_academic_year_id").references(
			() => academicYears.id,
			{
				onDelete: "set null",
			},
		),
		registrationFormatId: text("registration_format_id").references(
			() => registrationNumberFormats.id,
			{
				onDelete: "set null",
			},
		),
		timezone: text("timezone").default("UTC"),
		metadata: jsonb("metadata").$type<InstitutionMetadata>().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [unique("uq_institutions_code").on(t.code)],
);

/** Directed edges capturing course prerequisites. */
export const coursePrerequisites = pgTable(
	"course_prerequisites",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		courseId: text("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		prerequisiteCourseId: text("prerequisite_course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_course_prereq_pair").on(t.courseId, t.prerequisiteCourseId),
		index("idx_course_prereq_course").on(t.courseId),
		index("idx_course_prereq_requirement").on(t.prerequisiteCourseId),
	],
);

/** Historical log of student enrollment per academic year. */
export const enrollments = pgTable(
	"enrollments",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		studentId: text("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		classId: text("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		academicYearId: text("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "cascade" }),
		status: text("status")
			.$type<EnrollmentStatus>()
			.notNull()
			.default("pending"),
		enrolledAt: timestamp("enrolled_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		exitedAt: timestamp("exited_at", { withTimezone: true }),
	},
	(t) => [
		index("idx_enrollments_institution_id").on(t.institutionId),
		index("idx_enrollments_student_id").on(t.studentId),
		index("idx_enrollments_class_id").on(t.classId),
		index("idx_enrollments_year_id").on(t.academicYearId),
	],
);

/** Student ↔ course attempts per class-course offering. */
export const studentCourseEnrollments = pgTable(
	"student_course_enrollments",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		studentId: text("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		classCourseId: text("class_course_id")
			.notNull()
			.references(() => classCourses.id, { onDelete: "cascade" }),
		courseId: text("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		sourceClassId: text("source_class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "restrict" }),
		academicYearId: text("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "restrict" }),
		status: text("status")
			.$type<StudentCourseEnrollmentStatus>()
			.notNull()
			.default("planned"),
		attempt: integer("attempt").notNull().default(1),
		creditsAttempted: integer("credits_attempted").notNull(),
		creditsEarned: integer("credits_earned").notNull().default(0),
		startedAt: timestamp("started_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(t) => [
		unique("uq_student_course_attempt").on(
			t.studentId,
			t.courseId,
			t.academicYearId,
			t.attempt,
		),
		index("idx_student_course_student").on(t.studentId),
		index("idx_student_course_class_course").on(t.classCourseId),
		index("idx_student_course_course").on(t.courseId),
		index("idx_student_course_year").on(t.academicYearId),
	],
);

/** Aggregated credit tracking per student and academic year. */
export const studentCreditLedgers = pgTable(
	"student_credit_ledgers",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		studentId: text("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		academicYearId: text("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "cascade" }),
		creditsInProgress: integer("credits_in_progress").notNull().default(0),
		creditsEarned: integer("credits_earned").notNull().default(0),
		requiredCredits: integer("required_credits").notNull().default(60),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_student_credit_ledgers_student_year").on(
			t.studentId,
			t.academicYearId,
		),
		index("idx_student_credit_ledgers_student").on(t.studentId),
		index("idx_student_credit_ledgers_year").on(t.academicYearId),
	],
);

/** Enrollment windows controlling when cohorts accept registrations. */
export const enrollmentWindows = pgTable(
	"enrollment_windows",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		classId: text("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "cascade" }),
		academicYearId: text("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "cascade" }),
		status: text("status")
			.$type<EnrollmentWindowStatus>()
			.notNull()
			.default("closed"),
		openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow(),
		closedAt: timestamp("closed_at", { withTimezone: true }),
	},
	(t) => [
		unique("uq_enrollment_window_class_year").on(t.classId, t.academicYearId),
		index("idx_enrollment_window_status").on(t.status),
	],
);

/** Scores students obtain on exams (per class-course). */
export const grades = pgTable(
	"grades",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		student: text("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		exam: text("exam_id")
			.notNull()
			.references(() => exams.id, { onDelete: "cascade" }),
		score: numeric("score", { precision: 5, scale: 2 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_grades_student_exam").on(t.student, t.exam),
		index("idx_grades_student_id").on(t.student),
		index("idx_grades_exam_id").on(t.exam),
	],
);

/** Notification records for workflow events (email/webhooks). */
export const notifications = pgTable(
	"notifications",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		recipientId: text("recipient_id").references(() => domainUsers.id, {
			onDelete: "set null",
		}),
		channel: text("channel")
			.$type<NotificationChannel>()
			.notNull()
			.default("email"),
		type: text("type").notNull(),
		payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
		status: text("status")
			.$type<NotificationStatus>()
			.notNull()
			.default("pending"),
		sentAt: timestamp("sent_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("idx_notifications_recipient").on(t.recipientId),
		index("idx_notifications_status").on(t.status),
	],
);

/** Configurable promotion/passage rules. */
export const promotionRules = pgTable(
	"promotion_rules",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		sourceClassId: text("source_class_id").references(() => classes.id, {
			onDelete: "cascade",
		}),
		programId: text("program_id").references(() => programs.id, {
			onDelete: "cascade",
		}),
		cycleLevelId: text("cycle_level_id").references(() => cycleLevels.id, {
			onDelete: "set null",
		}),
		ruleset: jsonb("ruleset").notNull().$type<Record<string, unknown>>(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("idx_promotion_rules_institution_id").on(t.institutionId),
		index("idx_promotion_rules_source_class").on(t.sourceClassId),
		index("idx_promotion_rules_program").on(t.programId),
		index("idx_promotion_rules_cycle_level").on(t.cycleLevelId),
		index("idx_promotion_rules_active").on(t.isActive),
	],
);

/** Audit trail of promotion executions. */
export const promotionExecutions = pgTable(
	"promotion_executions",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		ruleId: text("rule_id")
			.notNull()
			.references(() => promotionRules.id, { onDelete: "restrict" }),
		sourceClassId: text("source_class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "restrict" }),
		targetClassId: text("target_class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "restrict" }),
		academicYearId: text("academic_year_id")
			.notNull()
			.references(() => academicYears.id, { onDelete: "restrict" }),
		executedBy: text("executed_by")
			.notNull()
			.references(() => domainUsers.id, { onDelete: "restrict" }),
		studentsEvaluated: integer("students_evaluated").notNull().default(0),
		studentsPromoted: integer("students_promoted").notNull().default(0),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
		executedAt: timestamp("executed_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("idx_promotion_executions_rule").on(t.ruleId),
		index("idx_promotion_executions_source_class").on(t.sourceClassId),
		index("idx_promotion_executions_target_class").on(t.targetClassId),
		index("idx_promotion_executions_year").on(t.academicYearId),
		index("idx_promotion_executions_executor").on(t.executedBy),
	],
);

/** Individual student evaluation results for promotion executions. */
export const promotionExecutionResults = pgTable(
	"promotion_execution_results",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		executionId: text("execution_id")
			.notNull()
			.references(() => promotionExecutions.id, { onDelete: "cascade" }),
		studentId: text("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		wasPromoted: boolean("was_promoted").notNull(),
		evaluationData: jsonb("evaluation_data")
			.notNull()
			.$type<Record<string, unknown>>(),
		rulesMatched: jsonb("rules_matched").$type<string[]>().default([]),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("idx_promotion_results_execution").on(t.executionId),
		index("idx_promotion_results_student").on(t.studentId),
		index("idx_promotion_results_promoted").on(t.wasPromoted),
		unique("uq_promotion_results_execution_student").on(
			t.executionId,
			t.studentId,
		),
	],
);

export const facultiesRelations = relations(faculties, ({ many }) => ({
	programs: many(programs),
}));

export const academicYearsRelations = relations(academicYears, ({ many }) => ({
	classes: many(classes),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
	faculty: one(faculties, {
		fields: [programs.faculty],
		references: [faculties.id],
	}),
	options: many(programOptions),
	classes: many(classes),
	courses: many(courses),
	teachingUnits: many(teachingUnits),
}));

export const programOptionsRelations = relations(
	programOptions,
	({ one, many }) => ({
		program: one(programs, {
			fields: [programOptions.programId],
			references: [programs.id],
		}),
		classes: many(classes),
	}),
);

export const teachingUnitsRelations = relations(
	teachingUnits,
	({ one, many }) => ({
		program: one(programs, {
			fields: [teachingUnits.programId],
			references: [programs.id],
		}),
		courses: many(courses),
	}),
);

export const classesRelations = relations(classes, ({ one, many }) => ({
	program: one(programs, {
		fields: [classes.program],
		references: [programs.id],
	}),
	academicYear: one(academicYears, {
		fields: [classes.academicYear],
		references: [academicYears.id],
	}),
	cycleLevel: one(cycleLevels, {
		fields: [classes.cycleLevelId],
		references: [cycleLevels.id],
	}),
	programOption: one(programOptions, {
		fields: [classes.programOptionId],
		references: [programOptions.id],
	}),
	semester: one(semesters, {
		fields: [classes.semesterId],
		references: [semesters.id],
	}),
	classCourses: many(classCourses),
	students: many(students),
	enrollments: many(enrollments),
}));

export const studyCyclesRelations = relations(studyCycles, ({ one, many }) => ({
	faculty: one(faculties, {
		fields: [studyCycles.facultyId],
		references: [faculties.id],
	}),
	levels: many(cycleLevels),
}));

export const cycleLevelsRelations = relations(cycleLevels, ({ one, many }) => ({
	cycle: one(studyCycles, {
		fields: [cycleLevels.cycleId],
		references: [studyCycles.id],
	}),
	classes: many(classes),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
	program: one(programs, {
		fields: [courses.program],
		references: [programs.id],
	}),
	teachingUnit: one(teachingUnits, {
		fields: [courses.teachingUnitId],
		references: [teachingUnits.id],
	}),
	defaultTeacherRef: one(domainUsers, {
		fields: [courses.defaultTeacher],
		references: [domainUsers.id],
	}),
	classCourses: many(classCourses),
	prerequisites: many(coursePrerequisites, {
		relationName: "coursePrereqCourse",
	}),
	requiredFor: many(coursePrerequisites, {
		relationName: "coursePrereqRequirement",
	}),
}));

export const coursePrerequisitesRelations = relations(
	coursePrerequisites,
	({ one }) => ({
		course: one(courses, {
			fields: [coursePrerequisites.courseId],
			references: [courses.id],
			relationName: "coursePrereqCourse",
		}),
		prerequisite: one(courses, {
			fields: [coursePrerequisites.prerequisiteCourseId],
			references: [courses.id],
			relationName: "coursePrereqRequirement",
		}),
	}),
);

export const classCoursesRelations = relations(
	classCourses,
	({ one, many }) => ({
		classRef: one(classes, {
			fields: [classCourses.class],
			references: [classes.id],
		}),
		courseRef: one(courses, {
			fields: [classCourses.course],
			references: [courses.id],
		}),
		teacherRef: one(domainUsers, {
			fields: [classCourses.teacher],
			references: [domainUsers.id],
		}),
		semester: one(semesters, {
			fields: [classCourses.semesterId],
			references: [semesters.id],
		}),
		exams: many(exams),
		studentCourseEnrollments: many(studentCourseEnrollments),
	}),
);

export const semestersRelations = relations(semesters, ({ many }) => ({
	classes: many(classes),
	classCourses: many(classCourses),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
	classCourseRef: one(classCourses, {
		fields: [exams.classCourse],
		references: [classCourses.id],
	}),
	grades: many(grades),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
	classRef: one(classes, {
		fields: [students.class],
		references: [classes.id],
	}),
	profile: one(domainUsers, {
		fields: [students.domainUserId],
		references: [domainUsers.id],
	}),
	grades: many(grades),
	enrollments: many(enrollments),
	courseEnrollments: many(studentCourseEnrollments),
	creditLedgers: many(studentCreditLedgers),
}));

export const domainUsersRelations = relations(domainUsers, ({ one }) => ({
	authUser: one(user, {
		fields: [domainUsers.authUserId],
		references: [user.id],
	}),
	member: one(member, {
		fields: [domainUsers.memberId],
		references: [member.id],
	}),
	studentProfile: one(students, {
		fields: [domainUsers.id],
		references: [students.domainUserId],
	}),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
	studentRef: one(students, {
		fields: [grades.student],
		references: [students.id],
	}),
	examRef: one(exams, {
		fields: [grades.exam],
		references: [exams.id],
	}),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
	student: one(students, {
		fields: [enrollments.studentId],
		references: [students.id],
	}),
	classRef: one(classes, {
		fields: [enrollments.classId],
		references: [classes.id],
	}),
	academicYear: one(academicYears, {
		fields: [enrollments.academicYearId],
		references: [academicYears.id],
	}),
}));

export const studentCreditLedgersRelations = relations(
	studentCreditLedgers,
	({ one }) => ({
		student: one(students, {
			fields: [studentCreditLedgers.studentId],
			references: [students.id],
		}),
		academicYear: one(academicYears, {
			fields: [studentCreditLedgers.academicYearId],
			references: [academicYears.id],
		}),
	}),
);

export const studentCourseEnrollmentsRelations = relations(
	studentCourseEnrollments,
	({ one }) => ({
		student: one(students, {
			fields: [studentCourseEnrollments.studentId],
			references: [students.id],
		}),
		classCourse: one(classCourses, {
			fields: [studentCourseEnrollments.classCourseId],
			references: [classCourses.id],
		}),
		course: one(courses, {
			fields: [studentCourseEnrollments.courseId],
			references: [courses.id],
		}),
		sourceClass: one(classes, {
			fields: [studentCourseEnrollments.sourceClassId],
			references: [classes.id],
		}),
		academicYear: one(academicYears, {
			fields: [studentCourseEnrollments.academicYearId],
			references: [academicYears.id],
		}),
	}),
);

export const enrollmentWindowsRelations = relations(
	enrollmentWindows,
	({ one }) => ({
		classRef: one(classes, {
			fields: [enrollmentWindows.classId],
			references: [classes.id],
		}),
		academicYear: one(academicYears, {
			fields: [enrollmentWindows.academicYearId],
			references: [academicYears.id],
		}),
	}),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	recipient: one(domainUsers, {
		fields: [notifications.recipientId],
		references: [domainUsers.id],
	}),
}));

export const institutionsRelations = relations(institutions, ({ one, many }) => ({
	parentInstitution: one(institutions, {
		fields: [institutions.parentInstitutionId],
		references: [institutions.id],
		relationName: "institutionHierarchy",
	}),
	childInstitutions: many(institutions, {
		relationName: "institutionHierarchy",
	}),
	faculty: one(faculties, {
		fields: [institutions.facultyId],
		references: [faculties.id],
	}),
	defaultAcademicYear: one(academicYears, {
		fields: [institutions.defaultAcademicYearId],
		references: [academicYears.id],
	}),
	registrationFormat: one(registrationNumberFormats, {
		fields: [institutions.registrationFormatId],
		references: [registrationNumberFormats.id],
	}),
	organization: one(organization, {
		fields: [institutions.organizationId],
		references: [organization.id],
	}),
}));

export const registrationNumberFormatsRelations = relations(
	registrationNumberFormats,
	({ many }) => ({
		counters: many(registrationNumberCounters),
	}),
);

export const registrationNumberCountersRelations = relations(
	registrationNumberCounters,
	({ one }) => ({
		format: one(registrationNumberFormats, {
			fields: [registrationNumberCounters.formatId],
			references: [registrationNumberFormats.id],
		}),
	}),
);

export const promotionRulesRelations = relations(
	promotionRules,
	({ one, many }) => ({
		sourceClass: one(classes, {
			fields: [promotionRules.sourceClassId],
			references: [classes.id],
		}),
		program: one(programs, {
			fields: [promotionRules.programId],
			references: [programs.id],
		}),
		cycleLevel: one(cycleLevels, {
			fields: [promotionRules.cycleLevelId],
			references: [cycleLevels.id],
		}),
		executions: many(promotionExecutions),
	}),
);

export const promotionExecutionsRelations = relations(
	promotionExecutions,
	({ one, many }) => ({
		rule: one(promotionRules, {
			fields: [promotionExecutions.ruleId],
			references: [promotionRules.id],
		}),
		sourceClass: one(classes, {
			fields: [promotionExecutions.sourceClassId],
			references: [classes.id],
		}),
		targetClass: one(classes, {
			fields: [promotionExecutions.targetClassId],
			references: [classes.id],
		}),
		academicYear: one(academicYears, {
			fields: [promotionExecutions.academicYearId],
			references: [academicYears.id],
		}),
		executor: one(domainUsers, {
			fields: [promotionExecutions.executedBy],
			references: [domainUsers.id],
		}),
		results: many(promotionExecutionResults),
	}),
);

export const promotionExecutionResultsRelations = relations(
	promotionExecutionResults,
	({ one }) => ({
		execution: one(promotionExecutions, {
			fields: [promotionExecutionResults.executionId],
			references: [promotionExecutions.id],
		}),
		student: one(students, {
			fields: [promotionExecutionResults.studentId],
			references: [students.id],
		}),
	}),
);

export type Faculty = InferSelectModel<typeof faculties>;
export type NewFaculty = InferInsertModel<typeof faculties>;

export type StudyCycle = InferSelectModel<typeof studyCycles>;
export type NewStudyCycle = InferInsertModel<typeof studyCycles>;

export type CycleLevel = InferSelectModel<typeof cycleLevels>;
export type NewCycleLevel = InferInsertModel<typeof cycleLevels>;

export type Semester = InferSelectModel<typeof semesters>;
export type NewSemester = InferInsertModel<typeof semesters>;

export type Program = InferSelectModel<typeof programs>;
export type NewProgram = InferInsertModel<typeof programs>;
export type ProgramOption = InferSelectModel<typeof programOptions>;
export type NewProgramOption = InferInsertModel<typeof programOptions>;

export type AcademicYear = InferSelectModel<typeof academicYears>;
export type NewAcademicYear = InferInsertModel<typeof academicYears>;

export type Klass = InferSelectModel<typeof classes>;
export type NewKlass = InferInsertModel<typeof classes>;

export type Course = InferSelectModel<typeof courses>;
export type NewCourse = InferInsertModel<typeof courses>;

export type ClassCourse = InferSelectModel<typeof classCourses>;
export type NewClassCourse = InferInsertModel<typeof classCourses>;

export type Exam = InferSelectModel<typeof exams>;
export type NewExam = InferInsertModel<typeof exams>;

export type ExamScheduleRun = InferSelectModel<typeof examScheduleRuns>;
export type NewExamScheduleRun = InferInsertModel<typeof examScheduleRuns>;

export type TeachingUnit = InferSelectModel<typeof teachingUnits>;
export type NewTeachingUnit = InferInsertModel<typeof teachingUnits>;

export type ExamType = InferSelectModel<typeof examTypes>;
export type NewExamType = InferInsertModel<typeof examTypes>;

export type DomainUser = InferSelectModel<typeof domainUsers>;
export type NewDomainUser = InferInsertModel<typeof domainUsers>;

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;

export type Grade = InferSelectModel<typeof grades>;
export type NewGrade = InferInsertModel<typeof grades>;

export type CoursePrerequisite = InferSelectModel<typeof coursePrerequisites>;
export type NewCoursePrerequisite = InferInsertModel<
	typeof coursePrerequisites
>;

export type Enrollment = InferSelectModel<typeof enrollments>;
export type NewEnrollment = InferInsertModel<typeof enrollments>;

export type StudentCourseEnrollment = InferSelectModel<
	typeof studentCourseEnrollments
>;
export type NewStudentCourseEnrollment = InferInsertModel<
	typeof studentCourseEnrollments
>;

export type StudentCreditLedger = InferSelectModel<typeof studentCreditLedgers>;
export type NewStudentCreditLedger = InferInsertModel<
	typeof studentCreditLedgers
>;

export type EnrollmentWindow = InferSelectModel<typeof enrollmentWindows>;
export type NewEnrollmentWindow = InferInsertModel<typeof enrollmentWindows>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

export type Institution = InferSelectModel<typeof institutions>;
export type NewInstitution = InferInsertModel<typeof institutions>;

export type RegistrationNumberFormat = InferSelectModel<
	typeof registrationNumberFormats
>;
export type NewRegistrationNumberFormat = InferInsertModel<
	typeof registrationNumberFormats
>;
export type RegistrationNumberCounter = InferSelectModel<
	typeof registrationNumberCounters
>;
export type NewRegistrationNumberCounter = InferInsertModel<
	typeof registrationNumberCounters
>;

export type PromotionRule = InferSelectModel<typeof promotionRules>;
export type NewPromotionRule = InferInsertModel<typeof promotionRules>;
export type PromotionExecution = InferSelectModel<typeof promotionExecutions>;
export type NewPromotionExecution = InferInsertModel<
	typeof promotionExecutions
>;
export type PromotionExecutionResult = InferSelectModel<
	typeof promotionExecutionResults
>;
export type NewPromotionExecutionResult = InferInsertModel<
	typeof promotionExecutionResults
>;
