import {
  pgTable,
  uuid,
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

export const faculties = pgTable(
  "faculties",
  {
    id: uuid("id")
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
    id: uuid("id")
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

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("uq_profiles_email").on(t.email)],
);

export const programs = pgTable(
  "programs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description"),
    faculty: uuid("faculty_id")
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    program: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    academicYear: uuid("academic_year_id")
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    credits: integer("credits").notNull(),
    hours: integer("hours").notNull(),
    program: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    defaultTeacher: uuid("default_teacher_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    class: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    course: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    teacher: uuid("teacher_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    type: text("type").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
    classCourse: uuid("class_course_id")
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    registrationNumber: text("registration_number").notNull(),
    class: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("uq_students_email").on(t.email),
    unique("uq_students_registration").on(t.registrationNumber),
    index("idx_students_class_id").on(t.class),
  ],
);

export const grades = pgTable(
  "grades",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    student: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    exam: uuid("exam_id")
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

export const profilesRelations = relations(profiles, ({ many }) => ({
  defaultCourses: many(courses),
  classCourses: many(classCourses),
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
  defaultTeacherRef: one(profiles, {
    fields: [courses.defaultTeacher],
    references: [profiles.id],
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
    teacherRef: one(profiles, {
      fields: [classCourses.teacher],
      references: [profiles.id],
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
  grades: many(grades),
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

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

export type Klass = InferSelectModel<typeof classes>;
export type NewKlass = InferInsertModel<typeof classes>;

export type Course = InferSelectModel<typeof courses>;
export type NewCourse = InferInsertModel<typeof courses>;

export type ClassCourse = InferSelectModel<typeof classCourses>;
export type NewClassCourse = InferInsertModel<typeof classCourses>;

export type Exam = InferSelectModel<typeof exams>;
export type NewExam = InferInsertModel<typeof exams>;

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;

export type Grade = InferSelectModel<typeof grades>;
export type NewGrade = InferInsertModel<typeof grades>;
