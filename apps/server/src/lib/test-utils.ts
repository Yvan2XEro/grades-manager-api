import type { Context } from "./context";
import { db } from "./test-db";
import * as schema from "../db/schema/app-schema";
import { randomUUID } from "node:crypto";

export function makeTestContext(opts: { role?: string; userId?: string } = {}): Context {
  const { role, userId } = { role: undefined as string | undefined, userId: randomUUID(), ...opts };
  if (!role) return { session: null } as unknown as Context;
  return {
    session: {
      user: { id: userId, role },
    },
  } as Context;
}

export const asAdmin = () => makeTestContext({ role: "ADMIN" });
export const asSuperAdmin = () => makeTestContext({ role: "superadmin" });
export const asUser = () => makeTestContext({ role: "USER" });

export async function createFaculty(data: Partial<schema.NewFaculty> = {}) {
  const [faculty] = await db
    .insert(schema.faculties)
    .values({ name: `Faculty-${randomUUID()}`, ...data })
    .returning();
  return faculty;
}

export async function createProgram(data: Partial<schema.NewProgram> = {}) {
  const faculty = data.faculty ? { id: data.faculty } : await createFaculty();
  const [program] = await db
    .insert(schema.programs)
    .values({ name: `Program-${randomUUID()}`, faculty: faculty.id, ...data })
    .returning();
  return program;
}

export async function createAcademicYear(data: Partial<schema.NewAcademicYear> = {}) {
  const [year] = await db
    .insert(schema.academicYears)
    .values({
      name: `AY-${randomUUID()}`,
      startDate: data.startDate ?? new Date("2024-01-01").toISOString(),
      endDate: data.endDate ?? new Date("2024-12-31").toISOString(),
      ...data,
    })
    .returning();
  return year;
}

export async function createClass(data: Partial<schema.NewKlass> = {}) {
  const program = data.program ? { id: data.program } : await createProgram();
  const year = data.academicYear ? { id: data.academicYear } : await createAcademicYear();
  const [klass] = await db
    .insert(schema.classes)
    .values({ name: `Class-${randomUUID()}`, program: program.id, academicYear: year.id, ...data })
    .returning();
  return klass;
}

export async function createProfile(data: Partial<schema.NewProfile> = {}) {
  const [profile] = await db
    .insert(schema.profiles)
    .values({
      id: randomUUID(),
      firstName: "John",
      lastName: "Doe",
      email: `user-${randomUUID()}@example.com`,
      role: data.role ?? "ADMIN",
      ...data,
    })
    .returning();
  return profile;
}

export async function createCourse(data: Partial<schema.NewCourse> = {}) {
  const program = data.program ? { id: data.program } : await createProgram();
  const teacher = data.defaultTeacher ? { id: data.defaultTeacher } : await createProfile();
  const [course] = await db
    .insert(schema.courses)
    .values({
      name: `Course-${randomUUID()}`,
      credits: data.credits ?? 3,
      hours: data.hours ?? 30,
      program: program.id,
      defaultTeacher: teacher.id,
      ...data,
    })
    .returning();
  return course;
}

export async function createClassCourse(data: Partial<schema.NewClassCourse> = {}) {
  const klass = data.class ? { id: data.class } : await createClass();
  const course = data.course ? { id: data.course } : await createCourse();
  const teacher = data.teacher ? { id: data.teacher } : await createProfile();
  const [cc] = await db
    .insert(schema.classCourses)
    .values({ class: klass.id, course: course.id, teacher: teacher.id, ...data })
    .returning();
  return cc;
}

export async function createExam(data: Partial<schema.NewExam> = {}) {
  const classCourse = data.classCourse ? { id: data.classCourse } : await createClassCourse();
  const [exam] = await db
    .insert(schema.exams)
    .values({
      name: `Exam-${randomUUID()}`,
      type: data.type ?? "WRITTEN",
      date: data.date ?? new Date(),
      percentage: data.percentage?.toString() ?? "50",
      classCourse: classCourse.id,
      ...data,
    })
    .returning();
  return exam;
}

export async function createStudent(data: Partial<schema.NewStudent> = {}) {
  const klass = data.class ? { id: data.class } : await createClass();
  const [student] = await db
    .insert(schema.students)
    .values({
      firstName: "Stu",
      lastName: "Dent",
      email: data.email ?? `student-${randomUUID()}@example.com`,
      registrationNumber: data.registrationNumber ?? randomUUID(),
      class: klass.id,
      ...data,
    })
    .returning();
  return student;
}

export async function createGrade(data: Partial<schema.NewGrade> = {}) {
  const student = data.student ? { id: data.student } : await createStudent();
  const exam = data.exam ? { id: data.exam } : await createExam();
  const [grade] = await db
    .insert(schema.grades)
    .values({ student: student.id, exam: exam.id, score: data.score?.toString() ?? "50" })
    .returning();
  return grade;
}
