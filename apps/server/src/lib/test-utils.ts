import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import type {
	BusinessRole,
	DomainUser,
	Gender,
	Institution,
	NewDomainUser,
} from "../db/schema/app-schema";
import * as schema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";
import { buildPermissions } from "../modules/authz";
import * as creditLedger from "../modules/student-credit-ledger";
import type { Context } from "./context";
import { slugify } from "./strings";
import { getTestInstitution, setTestInstitution } from "./test-context-state";
import { auth, db } from "./test-db";

const DEFAULT_DATE = new Date("1990-01-01");
const DEFAULT_PLACE = "Yaoundé";

/**
 * Creates a test organization and institution, then sets it as the global test institution.
 * Call this at the beginning of test files that need tenant context.
 */
export async function setupTestInstitution(): Promise<Institution> {
	// Create organization
	const [org] = await db
		.insert(authSchema.organization)
		.values({
			id: randomUUID(),
			name: "Test Institution",
			slug: `test-${randomUUID().slice(0, 8)}`,
			createdAt: new Date(),
		})
		.returning();

	// Create institution linked to organization
	const [institution] = await db
		.insert(schema.institutions)
		.values({
			code: `TEST-${randomUUID().slice(0, 4)}`,
			shortName: "TEST",
			nameFr: "Institution de test",
			nameEn: "Test Institution",
			organizationId: org.id,
		})
		.returning();

	setTestInstitution(institution);
	return institution;
}

type TestContextOptions = {
	role?: BusinessRole;
	userId?: string;
	authRole?: string;
	profileOverrides?: Partial<DomainUser>;
};

/**
 * Utility helpers that create fully linked fixtures for tests.
 * These factories are designed to reproduce the "recap" dataset quickly
 * so we can assert existing behavior before extending the platform.
 */
export function makeTestContext(opts: TestContextOptions = {}): Context {
	const { role, userId } = {
		role: undefined as BusinessRole | undefined,
		userId: randomUUID(),
		...opts,
	};
	const institution = getTestInstitution();
	if (!role) {
		return {
			session: null,
			profile: null,
			member: null,
			memberRole: null,
			permissions: buildPermissions(null),
			institution,
			organizationId: institution.organizationId ?? null,
		} as Context;
	}
	const resolvedMemberId =
		opts.profileOverrides?.memberId !== undefined
			? opts.profileOverrides.memberId
			: randomUUID();
	const profile = {
		id: opts.profileOverrides?.id ?? randomUUID(),
		authUserId: opts.profileOverrides?.authUserId ?? userId,
		memberId: resolvedMemberId,
		businessRole: role,
		firstName: opts.profileOverrides?.firstName ?? "Test",
		lastName: opts.profileOverrides?.lastName ?? "User",
		primaryEmail:
			opts.profileOverrides?.primaryEmail ??
			`profile-${randomUUID()}@example.com`,
		phone: opts.profileOverrides?.phone ?? null,
		dateOfBirth:
			opts.profileOverrides?.dateOfBirth ??
			(typeof DEFAULT_DATE === "string"
				? DEFAULT_DATE
				: DEFAULT_DATE.toISOString()),
		placeOfBirth: opts.profileOverrides?.placeOfBirth ?? DEFAULT_PLACE,
		gender: opts.profileOverrides?.gender ?? "other",
		nationality: opts.profileOverrides?.nationality ?? null,
		status: opts.profileOverrides?.status ?? "active",
		createdAt: opts.profileOverrides?.createdAt ?? new Date(),
		updatedAt: opts.profileOverrides?.updatedAt ?? new Date(),
	} satisfies DomainUser;
	const member = resolvedMemberId
		? {
				id: resolvedMemberId,
				userId,
				organizationId: institution.organizationId ?? randomUUID(),
				role,
				createdAt: new Date(),
			}
		: null;
	return {
		session: {
			user: { id: userId, role: opts.authRole ?? "admin" },
		},
		profile,
		member,
		memberRole: role,
		permissions: buildPermissions(role),
		institution,
		organizationId: institution.organizationId ?? null,
	} as Context;
}

export const asAdmin = () => makeTestContext({ role: "administrator" });
export const asSuperAdmin = () => makeTestContext({ role: "super_admin" });
export const asUser = () => makeTestContext({ role: "student" });

const defaultProfilePayload = (
	data: Partial<NewDomainUser> & {
		businessRole?: BusinessRole;
		gender?: Gender;
	} = {},
) => ({
	authUserId: data.authUserId ?? null,
	memberId: data.memberId ?? null,
	businessRole: data.businessRole ?? "student",
	firstName: data.firstName ?? "John",
	lastName: data.lastName ?? "Doe",
	primaryEmail: data.primaryEmail ?? `profile-${randomUUID()}@example.com`,
	phone: data.phone ?? null,
	dateOfBirth: data.dateOfBirth ?? DEFAULT_DATE,
	placeOfBirth: data.placeOfBirth ?? DEFAULT_PLACE,
	gender: data.gender ?? "other",
	nationality: data.nationality ?? null,
	status: data.status ?? "active",
});

export async function createDomainUser(
	data: Partial<NewDomainUser> & { businessRole?: BusinessRole } = {},
) {
	const [profile] = await db
		.insert(schema.domainUsers)
		.values(defaultProfilePayload(data))
		.returning();
	return profile;
}

export async function createOrganization(
	data: Partial<authSchema.NewOrganization> = {},
) {
	const [org] = await db
		.insert(authSchema.organization)
		.values({
			id: data.id ?? randomUUID(),
			name: data.name ?? `Org-${randomUUID()}`,
			slug: data.slug ?? `org-${randomUUID()}`,
			logo: data.logo ?? null,
			metadata: data.metadata ?? null,
			createdAt: data.createdAt ?? new Date(),
		})
		.returning();
	return org;
}

export async function createOrganizationMember(
	data: Partial<authSchema.NewMember> & { userId?: string } = {},
) {
	const organizationId = data.organizationId ?? (await createOrganization()).id;
	const userId =
		data.userId ??
		(
			await db
				.insert(authSchema.user)
				.values({
					id: randomUUID(),
					name: "Org User",
					email: `org-user-${randomUUID()}@example.com`,
					emailVerified: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning()
		)[0].id;
	const [member] = await db
		.insert(authSchema.member)
		.values({
			id: data.id ?? randomUUID(),
			organizationId,
			userId,
			role: data.role ?? "teacher",
			createdAt: data.createdAt ?? new Date(),
		})
		.returning();
	return member;
}

type RecapFixtureOverrides = {
	program?: Partial<schema.NewProgram>;
	academicYear?: Partial<schema.NewAcademicYear>;
	klass?: Partial<schema.NewKlass>;
	teachingUnit?: Partial<schema.NewTeachingUnit>;
	course?: Partial<schema.NewCourse>;
	classCourse?: Partial<schema.NewClassCourse>;
	exam?: Partial<schema.NewExam>;
	student?: Partial<schema.NewStudent> & {
		profile?: Partial<schema.NewDomainUser>;
	};
	grade?: Partial<schema.NewGrade>;
};

export async function createRecapFixture(
	overrides: RecapFixtureOverrides = {},
) {
	// Use the test institution instead of creating a new faculty
	// so that data is in the same institution as the test context
	const institution = getTestInstitution();
	const program = await createProgram({
		institutionId: institution.id,
		...overrides.program,
	});
	const academicYear = await createAcademicYear(overrides.academicYear);
	const teachingUnit = await createTeachingUnit({
		programId: program.id,
		...overrides.teachingUnit,
	});
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
		...overrides.klass,
	});
	const course = await createCourse({
		program: program.id,
		teachingUnitId: teachingUnit.id,
		...overrides.course,
	});
	const classCourse = await createClassCourse({
		class: klass.id,
		course: course.id,
		...overrides.classCourse,
	});
	const exam = await createExam({
		classCourse: classCourse.id,
		...overrides.exam,
	});
	const student = await createStudent({
		class: klass.id,
		registrationNumber: overrides.student?.registrationNumber,
		domainUserId: overrides.student?.domainUserId,
		profile: overrides.student?.profile,
	});
	await ensureStudentCourseEnrollment(student.id, classCourse.id, "active");
	const grade = await createGrade({
		student: student.id,
		exam: exam.id,
		...overrides.grade,
	});
	const enrollment = await db.query.enrollments.findFirst({
		where: (en, { eq }) => eq(en.studentId, student.id),
	});

	return {
		institution,
		program,
		academicYear,
		teachingUnit,
		klass,
		course,
		classCourse,
		exam,
		student,
		enrollment,
		grade,
	};
}

export async function createFaculty(
	data: Partial<schema.NewInstitution> & { name?: string } = {},
) {
	const {
		code,
		name,
		descriptionFr: description,
		parentInstitutionId: providedInstitutionId,
		...rest
	} = data;
	const parentInstitution = getTestInstitution();
	const [facultyInstitution] = await db
		.insert(schema.institutions)
		.values({
			code: code ?? `FAC-${randomUUID().slice(0, 4)}`,
			type: "faculty",
			nameFr: name ?? `Faculty-${randomUUID()}`,
			nameEn: name ?? `Faculty-${randomUUID()}`,
			descriptionFr: description ?? null,
			// parentInstitutionId est optionnel - pas de hiérarchie obligatoire
			parentInstitutionId: providedInstitutionId,
			organizationId: parentInstitution.organizationId,
		})
		.returning();
	return facultyInstitution;
}

export async function createStudyCycle(
	data: Partial<schema.NewStudyCycle> = {},
) {
	const faculty = data.institutionId
		? { id: data.institutionId }
		: await createFaculty();
	const [cycle] = await db
		.insert(schema.studyCycles)
		.values({
			institutionId: faculty.id,
			code: data.code ?? `cycle-${randomUUID().slice(0, 6)}`,
			name: data.name ?? `Cycle-${randomUUID().slice(0, 4)}`,
			description: data.description ?? null,
			totalCreditsRequired: data.totalCreditsRequired ?? 180,
			durationYears: data.durationYears ?? 3,
		})
		.returning();
	return cycle;
}

export async function createCycleLevel(
	data: Partial<schema.NewCycleLevel> = {},
) {
	const cycle = data.cycleId ? { id: data.cycleId } : await createStudyCycle();
	const [last] = await db
		.select({ value: schema.cycleLevels.orderIndex })
		.from(schema.cycleLevels)
		.where(eq(schema.cycleLevels.cycleId, cycle.id))
		.orderBy(desc(schema.cycleLevels.orderIndex))
		.limit(1);
	const nextOrder = (last?.value ?? 0) + 1;
	const [level] = await db
		.insert(schema.cycleLevels)
		.values({
			cycleId: cycle.id,
			orderIndex: data.orderIndex ?? nextOrder,
			code: data.code ?? `L${randomUUID().slice(0, 2)}`,
			name: data.name ?? `Level ${randomUUID().slice(0, 2)}`,
			minCredits: data.minCredits ?? 60,
		})
		.returning();
	return level;
}

export async function createProgram(data: Partial<schema.NewProgram> = {}) {
	const {
		institutionId: providedInstitutionId,
		code,
		name,
		description,
		...rest
	} = data;
	// Utiliser l'institution de test par défaut si non spécifiée
	const institutionId = providedInstitutionId ?? getTestInstitution().id;

	const resolvedName = name ?? `Program-${randomUUID()}`;
	const slug = slugify(resolvedName);
	const [program] = await db
		.insert(schema.programs)
		.values({
			code: code ?? `PRG-${randomUUID().slice(0, 4)}`,
			name: resolvedName,
			slug,
			description: description ?? null,
			institutionId,
			...rest,
		})
		.returning();
	await db
		.insert(schema.programOptions)
		.values({
			programId: program.id,
			name: "Default option",
			code: "default",
			institutionId: program.institutionId,
		})
		.onConflictDoNothing();
	return program;
}

export async function createProgramOption(
	data: Partial<schema.NewProgramOption> = {},
) {
	const program = data.programId
		? await db.query.programs.findFirst({
				where: eq(schema.programs.id, data.programId),
			})
		: await createProgram();
	if (!program) {
		throw new Error("Program not found for option creation");
	}
	const [option] = await db
		.insert(schema.programOptions)
		.values({
			programId: program.id,
			institutionId: data.institutionId ?? program.institutionId,
			name: data.name ?? `Option-${randomUUID().slice(0, 4)}`,
			code: data.code ?? randomUUID().slice(0, 6),
			description: data.description ?? null,
		})
		.returning();
	return option;
}

export async function createTeachingUnit(
	data: Partial<schema.NewTeachingUnit> = {},
) {
	const program = data.programId
		? { id: data.programId }
		: await createProgram();
	const [unit] = await db
		.insert(schema.teachingUnits)
		.values({
			name: data.name ?? `UE-${randomUUID().slice(0, 6)}`,
			code: data.code ?? `UE-${randomUUID().slice(0, 6)}`,
			programId: program.id,
			credits: data.credits ?? 3,
			semester: data.semester ?? "annual",
			description: data.description ?? null,
			...data,
		})
		.returning();
	return unit;
}

export async function createAcademicYear(
	data: Partial<schema.NewAcademicYear> = {},
) {
	const { institutionId: providedInstitutionId, ...rest } = data;
	const institutionId = providedInstitutionId ?? getTestInstitution().id;
	const [year] = await db
		.insert(schema.academicYears)
		.values({
			name: `AY-${randomUUID()}`,
			startDate: data.startDate ?? new Date("2024-01-01"),
			endDate: data.endDate ?? new Date("2024-12-31"),
			institutionId,
			...rest,
		})
		.returning();
	return year;
}

async function ensureCycleLevelForFaculty(
	institutionId: string,
	cycleLevelId?: string,
) {
	if (cycleLevelId) {
		const level = await db.query.cycleLevels.findFirst({
			where: eq(schema.cycleLevels.id, cycleLevelId),
		});
		if (!level) throw new Error("Cycle level not found");
		const cycle = await db.query.studyCycles.findFirst({
			where: eq(schema.studyCycles.id, level.cycleId),
		});
		if (!cycle || cycle.institutionId !== institutionId) {
			throw new Error("Cycle level does not belong to institution");
		}
		return level.id;
	}
	let cycle = await db.query.studyCycles.findFirst({
		where: eq(schema.studyCycles.institutionId, institutionId),
	});
	if (!cycle) {
		cycle = await createStudyCycle({ institutionId });
	}
	const level = await db.query.cycleLevels.findFirst({
		where: eq(schema.cycleLevels.cycleId, cycle.id),
		orderBy: asc(schema.cycleLevels.orderIndex),
	});
	if (level) return level.id;
	const created = await createCycleLevel({ cycleId: cycle.id, orderIndex: 1 });
	return created.id;
}

async function ensureSemester(semesterId?: string): Promise<string> {
	if (semesterId) {
		const semester = await db.query.semesters.findFirst({
			where: eq(schema.semesters.id, semesterId),
		});
		if (!semester) throw new Error("Semester not found");
		return semester.id;
	}
	const existing = await db.query.semesters.findFirst({
		orderBy: asc(schema.semesters.orderIndex),
	});
	if (existing) return existing.id;
	const [created] = await db
		.insert(schema.semesters)
		.values({
			code: `S${randomUUID().slice(0, 2).toUpperCase()}`,
			name: "Semester 1",
			orderIndex: 1,
		})
		.returning();
	return created.id;
}

export async function createClass(data: Partial<schema.NewKlass> = {}) {
	const {
		program: programId,
		academicYear: academicYearId,
		cycleLevelId,
		programOptionId,
		semesterId,
		code,
		name,
		institutionId: providedInstitutionId,
		...rest
	} = data;
	const program = programId
		? await db.query.programs.findFirst({
				where: eq(schema.programs.id, programId),
			})
		: await createProgram();
	if (!program) throw new Error("Program not found");
	const year = academicYearId
		? { id: academicYearId }
		: await createAcademicYear();
	const levelId = await ensureCycleLevelForFaculty(
		program.institutionId,
		cycleLevelId,
	);
	const option =
		programOptionId ??
		(
			await db.query.programOptions.findFirst({
				where: eq(schema.programOptions.programId, program.id),
			})
		)?.id ??
		(
			await createProgramOption({
				programId: program.id,
			})
		).id;
	const resolvedSemesterId = await ensureSemester(semesterId);
	const [klass] = await db
		.insert(schema.classes)
		.values({
			code: code ?? `CLS-${randomUUID().slice(0, 6)}`,
			name: name ?? `Class-${randomUUID()}`,
			program: program.id,
			academicYear: year.id,
			cycleLevelId: levelId,
			programOptionId: option,
			semesterId: resolvedSemesterId,
			institutionId: providedInstitutionId ?? program.institutionId,
			...rest,
		})
		.returning();
	return klass;
}

type CreateUserOptions = {
	name?: string;
	email?: string;
	role?: string;
	password?: string;
	businessRole?: BusinessRole;
	gender?: Gender;
	dateOfBirth?: Date;
	placeOfBirth?: string;
};

export async function createUser(data: CreateUserOptions = {}) {
	const email = data.email ?? `user-${randomUUID()}@example.com`;
	const name = data.name ?? "John Doe";
	const u = await auth.api.createUser({
		body: {
			name,
			email,
			role: data.role ?? "admin",
			password: data.password ?? "password",
		},
	});
	const [firstName, ...rest] = name.split(" ");
	const profile = await createDomainUser({
		authUserId: u.user.id,
		businessRole: data.businessRole ?? "administrator",
		firstName: firstName || "John",
		lastName: rest.join(" ") || "Doe",
		primaryEmail: email,
		gender: data.gender ?? "other",
		dateOfBirth: data.dateOfBirth?.toISOString() ?? DEFAULT_DATE.toISOString(),
		placeOfBirth: data.placeOfBirth ?? DEFAULT_PLACE,
	});
	return { ...u.user, profile };
}

export async function createCourse(data: Partial<schema.NewCourse> = {}) {
	const {
		program: programId,
		teachingUnitId,
		defaultTeacher,
		name,
		hours,
		code,
		...rest
	} = data;
	const program = programId ? { id: programId } : await createProgram();
	const teachingUnit = teachingUnitId
		? { id: teachingUnitId }
		: await createTeachingUnit({ programId: program.id });
	const defaultTeacherId = defaultTeacher ?? (await createUser()).profile.id;
	const [course] = await db
		.insert(schema.courses)
		.values({
			code: code ?? `CRS-${randomUUID().slice(0, 6)}`,
			name: name ?? `Course-${randomUUID()}`,
			hours: hours ?? 30,
			program: program.id,
			teachingUnitId: teachingUnitId ?? teachingUnit.id,
			defaultTeacher: defaultTeacherId,
			...rest,
		})
		.returning();
	return course;
}

export async function createClassCourse(
	data: Partial<schema.NewClassCourse> = {},
) {
	const {
		class: classId,
		course: courseId,
		teacher: teacherId,
		weeklyHours,
		code,
		semesterId,
		institutionId: providedInstitutionId,
		...rest
	} = data;
	const klass = classId
		? await db.query.classes.findFirst({
				where: eq(schema.classes.id, classId),
			})
		: await createClass();
	if (!klass) {
		throw new Error("Class not found");
	}
	const course = courseId ? { id: courseId } : await createCourse();
	const teacher = teacherId
		? { id: teacherId }
		: { id: (await createUser()).profile.id };
	const resolvedSemesterId =
		semesterId ?? klass.semesterId ?? (await ensureSemester());
	const [cc] = await db
		.insert(schema.classCourses)
		.values({
			code: code ?? `CC-${randomUUID().slice(0, 6)}`,
			class: klass.id,
			course: course.id,
			teacher: teacher.id,
			semesterId: resolvedSemesterId,
			weeklyHours: weeklyHours ?? 2,
			institutionId: providedInstitutionId ?? klass.institutionId,
			...rest,
		})
		.returning();
	return cc;
}

export async function createExam(data: Partial<schema.NewExam> = {}) {
	const classCourse = data.classCourse
		? await db.query.classCourses.findFirst({
				where: eq(schema.classCourses.id, data.classCourse),
			})
		: await createClassCourse();
	if (!classCourse) {
		throw new Error("Class course not found for exam");
	}
	const [exam] = await db
		.insert(schema.exams)
		.values({
			name: data.name ?? `Exam-${randomUUID()}`,
			type: data.type ?? "WRITTEN",
			date: data.date ?? new Date(),
			percentage: data.percentage?.toString() ?? "50",
			classCourse: classCourse.id,
			status: data.status ?? "approved",
			isLocked: data.isLocked ?? false,
			scheduledBy: data.scheduledBy ?? null,
			validatedBy: data.validatedBy ?? null,
			scheduledAt: data.scheduledAt ?? new Date(),
			validatedAt:
				data.validatedAt ?? (data.status === "approved" ? new Date() : null),
			institutionId: data.institutionId ?? classCourse.institutionId,
		})
		.returning();
	return exam;
}

export async function createExamType(data: Partial<schema.NewExamType> = {}) {
	const { institutionId: providedInstitutionId, ...rest } = data;
	const institutionId = providedInstitutionId ?? getTestInstitution().id;
	const [examType] = await db
		.insert(schema.examTypes)
		.values({
			name: data.name ?? `ExamType-${randomUUID()}`,
			description: data.description ?? null,
			institutionId,
			...rest,
		})
		.returning();
	return examType;
}

type StudentHelperInput = {
	class?: string;
	registrationNumber?: string;
	domainUserId?: string;
	institutionId?: string;
	profile?: Partial<NewDomainUser>;
};

export async function createStudent(data: StudentHelperInput = {}) {
	const klass =
		data.class !== undefined
			? await db.query.classes.findFirst({
					where: eq(schema.classes.id, data.class),
				})
			: await createClass();
	if (!klass) {
		throw new Error("Class not found");
	}
	let profileId = data.domainUserId;
	if (!profileId) {
		const profile = await createDomainUser({
			businessRole: "student",
			...data.profile,
		});
		profileId = profile.id;
	}
	if (!profileId) {
		throw new Error("Failed to create domain user");
	}
	const [student] = await db
		.insert(schema.students)
		.values({
			domainUserId: profileId,
			registrationNumber: data.registrationNumber ?? randomUUID(),
			class: klass.id,
			institutionId: data.institutionId ?? klass.institutionId,
		})
		.returning();
	await db.insert(schema.enrollments).values({
		studentId: student.id,
		classId: klass.id,
		academicYearId: klass.academicYear,
		institutionId: klass.institutionId,
		status: "active",
	});
	return student;
}

export async function ensureStudentCourseEnrollment(
	studentId: string,
	classCourseId: string,
	status: schema.StudentCourseEnrollmentStatus = "active",
) {
	const classCourse = await db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, classCourseId),
	});
	if (!classCourse) {
		throw new Error("Class course not found");
	}
	const course = await db.query.courses.findFirst({
		where: eq(schema.courses.id, classCourse.course),
	});
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, classCourse.class),
	});
	if (!course || !klass) {
		throw new Error("Missing course or class for class course");
	}
	const unit = await db.query.teachingUnits.findFirst({
		where: eq(schema.teachingUnits.id, course.teachingUnitId),
	});
	if (!unit) {
		throw new Error("Teaching unit not found for course");
	}
	const existing = await db.query.studentCourseEnrollments.findFirst({
		where: and(
			eq(schema.studentCourseEnrollments.studentId, studentId),
			eq(schema.studentCourseEnrollments.classCourseId, classCourseId),
		),
	});
	if (existing) return existing;
	const [record] = await db
		.insert(schema.studentCourseEnrollments)
		.values({
			studentId,
			classCourseId,
			courseId: course.id,
			sourceClassId: classCourse.class,
			academicYearId: klass.academicYear,
			status,
			attempt: 1,
			creditsAttempted: unit.credits,
			creditsEarned: status === "completed" ? unit.credits : 0,
		})
		.returning();
	const contribution = creditLedger.contributionForStatus(status, unit.credits);
	await creditLedger.applyDelta(
		studentId,
		klass.academicYear,
		contribution.inProgress,
		contribution.earned,
	);
	return record;
}

export async function createGrade(data: Partial<schema.NewGrade> = {}) {
	const student = data.student ? { id: data.student } : await createStudent();
	const exam = data.exam ? { id: data.exam } : await createExam();
	const examRecord = await db.query.exams.findFirst({
		where: eq(schema.exams.id, exam.id),
	});
	if (!examRecord) {
		throw new Error("Exam not found");
	}
	await ensureStudentCourseEnrollment(
		student.id,
		examRecord.classCourse,
		"active",
	);
	const [grade] = await db
		.insert(schema.grades)
		.values({
			student: student.id,
			exam: exam.id,
			score: data.score?.toString() ?? "50",
		})
		.returning();
	return grade;
}
