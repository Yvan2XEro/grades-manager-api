import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  date,
  numeric,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { user } from "./auth";

export const businessRoles = [
  "super_admin",
  "administrator",
  "teacher",
  "staff",
  "student",
] as const;
export type BusinessRole = (typeof businessRoles)[number];

export const genders = ["male", "female", "other"] as const;
export type Gender = (typeof genders)[number];

export const domainStatuses = ["active", "inactive", "suspended"] as const;
export type DomainUserStatus = (typeof domainStatuses)[number];

export const domainUsers = pgTable(
  "domain_users",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authUserId: text("auth_user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    businessRole: text("business_role")
      .$type<BusinessRole>()
      .notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    primaryEmail: text("primary_email").notNull(),
    phone: text("phone"),
    dateOfBirth: date("date_of_birth").notNull(),
    placeOfBirth: text("place_of_birth").notNull(),
    gender: text("gender")
      .$type<Gender>()
      .notNull(),
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
    defaultTeacher: text("default_teacher_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("chk_courses_credits", sql`${t.credits} >= 0`),
    check("chk_courses_hours", sql`${t.hours} > 0`),
    unique("uq_courses_name_program").on(t.name, t.program),
    index("idx_courses_program_id").on(t.program),
    index("idx_courses_default_teacher_id").on(t.defaultTeacher),
  ],
);

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
      .references(() => user.id, { onDelete: "restrict" }),
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
}));

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
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  program: one(programs, {
    fields: [courses.program],
    references: [programs.id],
  }),
  defaultTeacherRef: one(user, {
    fields: [courses.defaultTeacher],
    references: [user.id],
  }),
  classCourses: many(classCourses),
}));

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
    teacherRef: one(user, {
      fields: [classCourses.teacher],
      references: [user.id],
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
}));

export const domainUsersRelations = relations(domainUsers, ({ one }) => ({
  authUserRef: one(user, {
    fields: [domainUsers.authUserId],
    references: [user.id],
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

export type DomainUser = InferSelectModel<typeof domainUsers>;
export type NewDomainUser = InferInsertModel<typeof domainUsers>;

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;

export type Grade = InferSelectModel<typeof grades>;
export type NewGrade = InferInsertModel<typeof grades>;
