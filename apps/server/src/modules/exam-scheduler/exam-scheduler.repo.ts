import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { paginate } from "@/modules/_shared/pagination";

export async function findAcademicYearById(id: string) {
  return db.query.academicYears.findFirst({
    where: eq(schema.academicYears.id, id),
  });
}

export async function findExamTypeById(id: string) {
  return db.query.examTypes.findFirst({
    where: eq(schema.examTypes.id, id),
  });
}

export type SchedulerClass = {
  id: string;
  name: string;
  programId: string;
  programName: string;
  classCourseCount: number;
};

type ClassFetchInput = {
  institutionId: string;
  academicYearId: string;
  classIds?: string[];
};

export async function getClassesForScheduling(
  params: ClassFetchInput,
): Promise<SchedulerClass[]> {
  const programs = await db
    .select({
      id: schema.programs.id,
      name: schema.programs.name,
    })
    .from(schema.programs)
    .where(eq(schema.programs.institutionId, params.institutionId));

  if (!programs.length) return [];
  const programIds = programs.map((p) => p.id);
  const filters = [
    eq(schema.classes.academicYear, params.academicYearId),
    inArray(schema.classes.program, programIds),
    eq(schema.classes.institutionId, params.institutionId),
  ];
  if (params.classIds && params.classIds.length > 0) {
    filters.push(inArray(schema.classes.id, params.classIds));
  }
  const [first, ...rest] = filters;
  const condition = rest.length ? and(first, ...rest) : first;
  const classes = await db
    .select({
      id: schema.classes.id,
      name: schema.classes.name,
      programId: schema.classes.program,
    })
    .from(schema.classes)
    .where(condition)
    .orderBy(schema.classes.name);

  if (!classes.length) return [];
  const classIds = classes.map((klass) => klass.id);
  const counts =
    classIds.length === 0
      ? []
      : await db
          .select({
            classId: schema.classCourses.class,
            count: sql<number>`count(*)`,
          })
          .from(schema.classCourses)
          .where(inArray(schema.classCourses.class, classIds))
          .groupBy(schema.classCourses.class);
  const countMap = new Map(
    counts.map((item) => [item.classId, Number(item.count)]),
  );
  const programNames = new Map(
    programs.map((program) => [program.id, program.name]),
  );
  return classes.map((klass) => ({
    id: klass.id,
    name: klass.name,
    programId: klass.programId,
    programName: programNames.get(klass.programId) ?? "",
    classCourseCount: countMap.get(klass.id) ?? 0,
  }));
}

export type SchedulerClassCourse = {
  id: string;
  classId: string;
  courseId: string;
  courseName: string;
};

export async function getClassCourses(
  classIds: string[],
): Promise<SchedulerClassCourse[]> {
  if (classIds.length === 0) return [];
  return db
    .select({
      id: schema.classCourses.id,
      classId: schema.classCourses.class,
      courseId: schema.classCourses.course,
      courseName: schema.courses.name,
    })
    .from(schema.classCourses)
    .innerJoin(
      schema.courses,
      eq(schema.courses.id, schema.classCourses.course),
    )
    .where(inArray(schema.classCourses.class, classIds))
    .orderBy(schema.classCourses.class, schema.courses.name);
}

export async function findExistingTypeExams(
  classCourseIds: string[],
  typeName: string,
  institutionId: string,
) {
  if (classCourseIds.length === 0) return [];
  return db
    .select({
      id: schema.exams.id,
      classCourseId: schema.exams.classCourse,
    })
    .from(schema.exams)
    .where(
      and(
        inArray(schema.exams.classCourse, classCourseIds),
        eq(schema.exams.type, typeName),
        eq(schema.exams.institutionId, institutionId),
      ),
    );
}

export async function recordRun(data: schema.NewExamScheduleRun) {
  const [run] = await db
    .insert(schema.examScheduleRuns)
    .values(data)
    .returning();
  return run;
}

export async function findDomainUserById(id: string) {
  return db.query.domainUsers.findFirst({
    where: eq(schema.domainUsers.id, id),
  });
}

type HistoryFilters = {
  institutionId?: string;
  academicYearId?: string;
  examTypeId?: string;
  cursor?: string;
  limit?: number;
};

export async function listRuns(filters: HistoryFilters, institutionId: string) {
  const limit = filters.limit ?? 50;
  const conditions = [
    filters.institutionId
      ? eq(schema.examScheduleRuns.institutionId, filters.institutionId)
      : undefined,
    filters.academicYearId
      ? eq(schema.examScheduleRuns.academicYearId, filters.academicYearId)
      : undefined,
    filters.examTypeId
      ? eq(schema.examScheduleRuns.examTypeId, filters.examTypeId)
      : undefined,
    filters.cursor ? gt(schema.examScheduleRuns.id, filters.cursor) : undefined,
    eq(schema.examScheduleRuns.institutionId, institutionId),
  ].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
  const condition =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);
  const rows = await db
    .select({
      id: schema.examScheduleRuns.id,
      institutionId: schema.examScheduleRuns.institutionId,
      institutionName: schema.institutions.nameFr,
      academicYearId: schema.examScheduleRuns.academicYearId,
      academicYearName: schema.academicYears.name,
      examTypeId: schema.examScheduleRuns.examTypeId,
      examTypeName: schema.examTypes.name,
      percentage: schema.examScheduleRuns.percentage,
      dateStart: schema.examScheduleRuns.dateStart,
      dateEnd: schema.examScheduleRuns.dateEnd,
      classIds: schema.examScheduleRuns.classIds,
      classCount: schema.examScheduleRuns.classCount,
      classCourseCount: schema.examScheduleRuns.classCourseCount,
      createdCount: schema.examScheduleRuns.createdCount,
      skippedCount: schema.examScheduleRuns.skippedCount,
      duplicateCount: schema.examScheduleRuns.duplicateCount,
      conflictCount: schema.examScheduleRuns.conflictCount,
      scheduledBy: schema.examScheduleRuns.scheduledBy,
      createdAt: schema.examScheduleRuns.createdAt,
    })
    .from(schema.examScheduleRuns)
    .leftJoin(
      schema.institutions,
      eq(schema.institutions.id, schema.examScheduleRuns.institutionId),
    )
    .leftJoin(
      schema.academicYears,
      eq(schema.academicYears.id, schema.examScheduleRuns.academicYearId),
    )
    .leftJoin(
      schema.examTypes,
      eq(schema.examTypes.id, schema.examScheduleRuns.examTypeId),
    )
    .where(condition)
    .orderBy(schema.examScheduleRuns.id)
    .limit(limit);
  return paginate(rows, limit);
}

export async function getRunDetails(runId: string, institutionId: string) {
  const [run] = await db
    .select({
      id: schema.examScheduleRuns.id,
      institutionId: schema.examScheduleRuns.institutionId,
      institutionName: schema.institutions.nameFr,
      academicYearId: schema.examScheduleRuns.academicYearId,
      academicYearName: schema.academicYears.name,
      examTypeId: schema.examScheduleRuns.examTypeId,
      examTypeName: schema.examTypes.name,
      percentage: schema.examScheduleRuns.percentage,
      dateStart: schema.examScheduleRuns.dateStart,
      dateEnd: schema.examScheduleRuns.dateEnd,
      classIds: schema.examScheduleRuns.classIds,
      classCount: schema.examScheduleRuns.classCount,
      classCourseCount: schema.examScheduleRuns.classCourseCount,
      createdCount: schema.examScheduleRuns.createdCount,
      skippedCount: schema.examScheduleRuns.skippedCount,
      duplicateCount: schema.examScheduleRuns.duplicateCount,
      conflictCount: schema.examScheduleRuns.conflictCount,
      scheduledBy: schema.examScheduleRuns.scheduledBy,
      createdAt: schema.examScheduleRuns.createdAt,
    })
    .from(schema.examScheduleRuns)
    .leftJoin(
      schema.institutions,
      eq(schema.institutions.id, schema.examScheduleRuns.institutionId),
    )
    .leftJoin(
      schema.academicYears,
      eq(schema.academicYears.id, schema.examScheduleRuns.academicYearId),
    )
    .leftJoin(
      schema.examTypes,
      eq(schema.examTypes.id, schema.examScheduleRuns.examTypeId),
    )
    .where(
      and(
        eq(schema.examScheduleRuns.id, runId),
        eq(schema.examScheduleRuns.institutionId, institutionId),
      ),
    )
    .limit(1);
  if (!run) return null;
  const exams = await db
    .select({
      id: schema.exams.id,
      name: schema.exams.name,
      type: schema.exams.type,
      date: schema.exams.date,
      status: schema.exams.status,
      isLocked: schema.exams.isLocked,
      classId: schema.classCourses.class,
      className: schema.classes.name,
      courseId: schema.classCourses.course,
      courseName: schema.courses.name,
    })
    .from(schema.exams)
    .leftJoin(
      schema.classCourses,
      eq(schema.classCourses.id, schema.exams.classCourse),
    )
    .leftJoin(schema.classes, eq(schema.classes.id, schema.classCourses.class))
    .leftJoin(schema.courses, eq(schema.courses.id, schema.classCourses.course))
    .where(eq(schema.exams.scheduleRunId, runId));
  return { run, exams };
}
