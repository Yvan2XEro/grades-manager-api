import { randomUUID } from "node:crypto";
import type {
	BusinessRole,
	DomainUser,
	Gender,
	NewDomainUser,
} from "../db/schema/app-schema";
import * as schema from "../db/schema/app-schema";
import { buildPermissions } from "../modules/authz";
import type { Context } from "./context";
import { auth, db } from "./test-db";

const DEFAULT_DATE = new Date("1990-01-01");
const DEFAULT_PLACE = "Yaoundé";

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
	if (!role) {
		return {
			session: null,
			profile: null,
			permissions: buildPermissions(null),
		} as Context;
	}
	const profile = {
		id: opts.profileOverrides?.id ?? randomUUID(),
		authUserId: opts.profileOverrides?.authUserId ?? userId,
		businessRole: role,
		firstName: opts.profileOverrides?.firstName ?? "Test",
		lastName: opts.profileOverrides?.lastName ?? "User",
		primaryEmail:
			opts.profileOverrides?.primaryEmail ??
			`profile-${randomUUID()}@example.com`,
		phone: opts.profileOverrides?.phone ?? null,
		dateOfBirth: opts.profileOverrides?.dateOfBirth ?? DEFAULT_DATE,
		placeOfBirth: opts.profileOverrides?.placeOfBirth ?? DEFAULT_PLACE,
		gender: opts.profileOverrides?.gender ?? "other",
		nationality: opts.profileOverrides?.nationality ?? null,
		status: opts.profileOverrides?.status ?? "active",
		createdAt: opts.profileOverrides?.createdAt ?? new Date(),
		updatedAt: opts.profileOverrides?.updatedAt ?? new Date(),
	} satisfies DomainUser;
	return {
		session: {
			user: { id: userId, role: opts.authRole ?? "admin" },
		},
		profile,
		permissions: buildPermissions(profile),
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

type RecapFixtureOverrides = {
	faculty?: Partial<schema.NewFaculty>;
	program?: Partial<schema.NewProgram>;
	academicYear?: Partial<schema.NewAcademicYear>;
	klass?: Partial<schema.NewKlass>;
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
	const faculty = await createFaculty(overrides.faculty);
	const program = await createProgram({
		faculty: faculty.id,
		...overrides.program,
	});
	const academicYear = await createAcademicYear(overrides.academicYear);
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
		...overrides.klass,
	});
	const course = await createCourse({
		program: program.id,
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
	const grade = await createGrade({
		student: student.id,
		exam: exam.id,
		...overrides.grade,
	});

	return {
		faculty,
		program,
		academicYear,
		klass,
		course,
		classCourse,
		exam,
		student,
		grade,
	};
}

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

export async function createAcademicYear(
	data: Partial<schema.NewAcademicYear> = {},
) {
	const [year] = await db
		.insert(schema.academicYears)
		.values({
			name: `AY-${randomUUID()}`,
			startDate: data.startDate ?? new Date("2024-01-01"),
			endDate: data.endDate ?? new Date("2024-12-31"),
			...data,
		})
		.returning();
	return year;
}

export async function createClass(data: Partial<schema.NewKlass> = {}) {
	const program = data.program ? { id: data.program } : await createProgram();
	const year = data.academicYear
		? { id: data.academicYear }
		: await createAcademicYear();
	const [klass] = await db
		.insert(schema.classes)
		.values({
			name: `Class-${randomUUID()}`,
			program: program.id,
			academicYear: year.id,
			...data,
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
			role: (data.role as any) ?? "ADMIN",
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
		dateOfBirth: data.dateOfBirth ?? DEFAULT_DATE,
		placeOfBirth: data.placeOfBirth ?? DEFAULT_PLACE,
	});
	return { ...u.user, profile };
}

export async function createCourse(data: Partial<schema.NewCourse> = {}) {
	const program = data.program ? { id: data.program } : await createProgram();
	const teacher = data.defaultTeacher
		? { id: data.defaultTeacher }
		: await createUser();
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

export async function createClassCourse(
	data: Partial<schema.NewClassCourse> = {},
) {
	const klass = data.class ? { id: data.class } : await createClass();
	const course = data.course ? { id: data.course } : await createCourse();
	const teacher = data.teacher ? { id: data.teacher } : await createUser();
	const [cc] = await db
		.insert(schema.classCourses)
		.values({
			class: klass.id,
			course: course.id,
			teacher: teacher.id,
			...data,
		})
		.returning();
	return cc;
}

export async function createExam(data: Partial<schema.NewExam> = {}) {
	const classCourse = data.classCourse
		? { id: data.classCourse }
		: await createClassCourse();
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

type StudentHelperInput = {
	class?: string;
	registrationNumber?: string;
	domainUserId?: string;
	profile?: Partial<NewDomainUser>;
};

export async function createStudent(data: StudentHelperInput = {}) {
	const klass = data.class ? { id: data.class } : await createClass();
	let profile = null;
	let profileId = data.domainUserId;
	if (!profileId) {
		profile = await createDomainUser({
			businessRole: "student",
			...data.profile,
		});
		profileId = profile.id;
	} else if (!profile) {
		profile = await db.query.domainUsers.findFirst({
			where: (du, { eq }) => eq(du.id, profileId as string),
		});
	}
	const [student] = await db
		.insert(schema.students)
		.values({
			domainUserId: profileId!,
			registrationNumber: data.registrationNumber ?? randomUUID(),
			class: klass.id,
		})
		.returning();
	return { ...student, profile };
}

export async function createGrade(data: Partial<schema.NewGrade> = {}) {
	const student = data.student ? { id: data.student } : await createStudent();
	const exam = data.exam ? { id: data.exam } : await createExam();
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
