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
import { user } from "./auth";

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
export const semesters = ["fall", "spring", "annual"] as const;
export type Semester = (typeof semesters)[number];

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

export const notificationChannels = ["email", "webhook"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationStatuses = ["pending", "sent", "failed"] as const;
export type NotificationStatus = (typeof notificationStatuses)[number];

/** Business profiles decoupled from Better Auth accounts. */
export const domainUsers = pgTable(
  "domain_users",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authUserId: text("auth_user_id").references(() => user.id, {
      onDelete: "cascade",
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
    unique("uq_domain_users_email").on(t.primaryEmail),
    index("idx_domain_users_role").on(t.businessRole),
  ],
);

/** Catalog of allowed exam types (CC, TP...). */
export const examTypes = pgTable(
  "exam_types",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("uq_exam_types_name").on(t.name)],
);

/** Catalog of allowed exam types (CC, TP...). */
/** Faculties (schools) grouping programs. */
export const faculties = pgTable(
  "faculties",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("uq_faculties_name").on(t.name)],
);

/** Official academic sessions (e.g., 2024–2025). */
export const academicYears = pgTable(
  "academic_years",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
  ],
);

/** Programs offered under a faculty. */
export const programs = pgTable(
  "programs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
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
    index("idx_programs_faculty_id").on(t.faculty),
  ],
);

/** UE/Module layer grouping courses inside a program. */
export const teachingUnits = pgTable(
  "teaching_units",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    credits: integer("credits").notNull().default(0),
    semester: text("semester").$type<Semester>().notNull().default("annual"),
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
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    program: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    academicYear: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
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
    index("idx_classes_program_id").on(t.program),
    index("idx_classes_academic_year_id").on(t.academicYear),
  ],
);

/** EC definitions tied to a program and teaching unit. */
export const courses = pgTable(
  "courses",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    credits: integer("credits").notNull(),
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
    check("chk_courses_credits", sql`${t.credits} >= 0`),
    check("chk_courses_hours", sql`${t.hours} > 0`),
    unique("uq_courses_name_program").on(t.name, t.program),
    index("idx_courses_program_id").on(t.program),
    index("idx_courses_teaching_unit_id").on(t.teachingUnitId),
    index("idx_courses_default_teacher_id").on(t.defaultTeacher),
  ],
);

/** Assigns a course to a class with a teacher (and workload). */
export const classCourses = pgTable(
  "class_courses",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    class: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    course: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    teacher: text("teacher_id")
      .notNull()
      .references(() => domainUsers.id, { onDelete: "restrict" }),
    weeklyHours: integer("weekly_hours").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("uq_class_courses").on(t.class, t.course),
    index("idx_class_courses_class_id").on(t.class),
    index("idx_class_courses_course_id").on(t.course),
    index("idx_class_courses_teacher_id").on(t.teacher),
  ],
);

/** Audit trail of bulk scheduling operations. */
export const examScheduleRuns = pgTable(
  "exam_schedule_runs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    index("idx_exams_class_course_id").on(t.classCourse),
    index("idx_exams_date").on(t.date),
  ],
);

/** Student records referencing domain profiles. */
export const students = pgTable(
  "students",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    index("idx_students_class_id").on(t.class),
    index("idx_students_domain_user_id").on(t.domainUserId),
  ],
);

/** Directed edges capturing course prerequisites. */
export const coursePrerequisites = pgTable(
  "course_prerequisites",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    index("idx_enrollments_student_id").on(t.studentId),
    index("idx_enrollments_class_id").on(t.classId),
    index("idx_enrollments_year_id").on(t.academicYearId),
  ],
);

/** Enrollment windows controlling when cohorts accept registrations. */
export const enrollmentWindows = pgTable(
  "enrollment_windows",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
  classes: many(classes),
  courses: many(courses),
  teachingUnits: many(teachingUnits),
}));

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
  classCourses: many(classCourses),
  students: many(students),
  enrollments: many(enrollments),
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
    exams: many(exams),
  }),
);

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
}));

export const domainUsersRelations = relations(domainUsers, ({ one }) => ({
  authUserRef: one(domainUsers, {
    fields: [domainUsers.authUserId],
    references: [domainUsers.id],
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

export type Faculty = InferSelectModel<typeof faculties>;
export type NewFaculty = InferInsertModel<typeof faculties>;

export type Program = InferSelectModel<typeof programs>;
export type NewProgram = InferInsertModel<typeof programs>;

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

export type EnrollmentWindow = InferSelectModel<typeof enrollmentWindows>;
export type NewEnrollmentWindow = InferInsertModel<typeof enrollmentWindows>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
