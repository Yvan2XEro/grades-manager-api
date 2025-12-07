import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { parse as parseYaml } from "yaml";
import { db as appDb } from "../db";
import type {
	BusinessRole,
	DomainUserStatus,
	EnrollmentStatus,
	Gender,
	StudentCourseEnrollmentStatus,
	TeachingUnitSemester,
} from "../db/schema/app-schema";
import type { RegistrationNumberFormatDefinition } from "../db/schema/registration-number-types";
import * as schema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";
import { normalizeCode, slugify } from "../lib/strings";

type SeedLogger = Pick<Console, "log" | "error">;

export type SeedMeta = {
	version?: string;
	generatedAt?: string;
	dataset?: string;
};

export type FoundationSeed = {
	meta?: SeedMeta;
	examTypes?: Array<{ name: string; description?: string }>;
	faculties?: Array<{ code: string; name: string; description?: string }>;
	studyCycles?: Array<{
		code: string;
		name: string;
		facultyCode: string;
		description?: string;
		totalCreditsRequired?: number;
		durationYears?: number;
	}>;
	cycleLevels?: Array<{
		code: string;
		name: string;
		orderIndex: number;
		minCredits?: number;
		studyCycleCode: string;
		facultyCode: string;
	}>;
	semesters?: Array<{ code: string; name: string; orderIndex: number }>;
	academicYears?: Array<{
		code: string;
		name?: string;
		startDate: string;
		endDate: string;
		isActive?: boolean;
	}>;
	registrationNumberFormats?: Array<{
		name: string;
		description?: string;
		definition: RegistrationNumberFormatDefinition;
		isActive?: boolean;
	}>;
};

type ProgramSeed = {
	code: string;
	name: string;
	slug?: string;
	description?: string;
	facultyCode: string;
};

type ClassSeed = {
	code: string;
	name: string;
	programCode: string;
	programOptionCode: string;
	academicYearCode: string;
	studyCycleCode: string;
	cycleLevelCode: string;
	semesterCode?: string;
};

type ClassCourseSeed = {
	code: string;
	classCode: string;
	classAcademicYearCode?: string;
	courseCode: string;
	teacherCode: string;
	semesterCode?: string;
	weeklyHours?: number;
};

export type AcademicsSeed = {
	meta?: SeedMeta;
	programs?: ProgramSeed[];
	programOptions?: Array<{
		programCode: string;
		code: string;
		name: string;
		description?: string;
	}>;
	teachingUnits?: Array<{
		programCode: string;
		code: string;
		name: string;
		description?: string;
		credits?: number;
		semester?: TeachingUnitSemester;
	}>;
	courses?: Array<{
		programCode: string;
		teachingUnitCode: string;
		code: string;
		name: string;
		hours: number;
		defaultTeacherCode?: string;
	}>;
	classes?: ClassSeed[];
	classCourses?: ClassCourseSeed[];
};

type AuthUserSeed = {
	code: string;
	email: string;
	password: string;
	name: string;
	role?: string;
};

type DomainUserSeed = {
	code: string;
	authUserCode?: string;
	authUserEmail?: string;
	businessRole: BusinessRole;
	firstName: string;
	lastName: string;
	primaryEmail: string;
	phone?: string;
	dateOfBirth?: string;
	placeOfBirth?: string;
	gender?: Gender;
	nationality?: string;
	status?: DomainUserStatus;
};

type StudentSeed = {
	code: string;
	domainUserCode: string;
	classCode: string;
	classAcademicYearCode?: string;
	registrationNumber: string;
};

type EnrollmentSeed = {
	studentCode: string;
	classCode: string;
	classAcademicYearCode?: string;
	academicYearCode: string;
	status?: EnrollmentStatus;
};

type StudentCourseEnrollmentSeed = {
	studentCode: string;
	classCourseCode: string;
	courseCode: string;
	sourceClassCode: string;
	sourceClassAcademicYearCode?: string;
	academicYearCode: string;
	status?: StudentCourseEnrollmentStatus;
	attempt?: number;
	creditsAttempted: number;
	creditsEarned?: number;
};

export type UsersSeed = {
	meta?: SeedMeta;
	authUsers?: AuthUserSeed[];
	domainUsers?: DomainUserSeed[];
	students?: StudentSeed[];
	enrollments?: EnrollmentSeed[];
	studentCourseEnrollments?: StudentCourseEnrollmentSeed[];
};

type ProgramRecord = {
	id: string;
	code: string;
	facultyCode: string;
};

type ClassRecord = {
	id: string;
	code: string;
	academicYearCode: string;
	programCode: string;
};

type CourseRecord = {
	id: string;
	code: string;
	programCode: string;
};

type SeedState = {
	faculties: Map<string, { id: string; code: string }>;
	studyCycles: Map<string, { id: string; facultyCode: string; code: string }>;
	cycleLevels: Map<
		string,
		{ id: string; facultyCode: string; cycleCode: string; code: string }
	>;
	semesters: Map<string, string>;
	academicYears: Map<string, string>;
	programs: Map<string, ProgramRecord>;
	programOptions: Map<string, { id: string; programCode: string }>;
	teachingUnits: Map<string, { id: string; programCode: string }>;
	courses: Map<string, Map<string, CourseRecord>>;
	classes: Map<string, Map<string, ClassRecord>>;
	classCourses: Map<string, { id: string; classId: string; courseId: string }>;
	pendingClassCourses: ClassCourseSeed[];
	authUsers: Map<string, string>;
	domainUsers: Map<string, { id: string; businessRole: BusinessRole }>;
	students: Map<string, { id: string }>;
};

export type RunSeedOptions = {
	db?: typeof appDb;
	logger?: SeedLogger;
	baseDir?: string;
	foundationPath?: string;
	academicsPath?: string;
	usersPath?: string;
};

const defaultSeedRelativeDir = path.join("seed", "local");

export async function runSeed(options: RunSeedOptions = {}) {
	const logger = options.logger ?? console;
	const db = options.db ?? appDb;
	const seedBaseDir = resolveSeedDir(options.baseDir);
	const defaults = {
		foundationPath: path.join(seedBaseDir, "00-foundation.yaml"),
		academicsPath: path.join(seedBaseDir, "10-academics.yaml"),
		usersPath: path.join(seedBaseDir, "20-users.yaml"),
	};
	const foundationPath = options.foundationPath ?? defaults.foundationPath;
	const academicsPath = options.academicsPath ?? defaults.academicsPath;
	const usersPath = options.usersPath ?? defaults.usersPath;

	const state = createSeedState();
	const foundation = await loadSeedFile<FoundationSeed>(foundationPath, logger);
	if (foundation) {
		logger.log(
			`[seed] Applying foundation layer${foundation.meta?.version ? ` (${foundation.meta.version})` : ""}`,
		);
		await seedFoundation(db, state, foundation, logger);
	}
	const academics = await loadSeedFile<AcademicsSeed>(academicsPath, logger);
	if (academics) {
		logger.log(
			`[seed] Applying academics layer${academics.meta?.version ? ` (${academics.meta.version})` : ""}`,
		);
		await seedAcademics(db, state, academics, logger);
	}
	const users = await loadSeedFile<UsersSeed>(usersPath, logger);
	if (users) {
		logger.log(
			`[seed] Applying users layer${users.meta?.version ? ` (${users.meta.version})` : ""}`,
		);
		await seedUsers(db, state, users, logger);
	}
	if (!foundation && !academics && !users) {
		logger.log(
			"[seed] No seed layers were applied. Provide at least one file or override the paths.",
		);
	}
}

function createSeedState(): SeedState {
	return {
		faculties: new Map(),
		studyCycles: new Map(),
		cycleLevels: new Map(),
		semesters: new Map(),
		academicYears: new Map(),
		programs: new Map(),
		programOptions: new Map(),
		teachingUnits: new Map(),
		courses: new Map(),
		classes: new Map(),
		classCourses: new Map(),
		pendingClassCourses: [],
		authUsers: new Map(),
		domainUsers: new Map(),
		students: new Map(),
	};
}

async function loadSeedFile<T>(
	filePath: string | undefined,
	logger: SeedLogger,
): Promise<T | null> {
	if (!filePath) return null;
	const absolutePath = path.isAbsolute(filePath)
		? filePath
		: path.resolve(process.cwd(), filePath);
	try {
		const content = await readFile(absolutePath, "utf8");
		if (!content.trim()) return null;
		if (absolutePath.endsWith(".json")) {
			return JSON.parse(content) as T;
		}
		if (absolutePath.endsWith(".yaml") || absolutePath.endsWith(".yml")) {
			return parseYaml(content) as T;
		}
		throw new Error(`Unsupported seed file format: ${absolutePath}`);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			logger.log(
				`[seed] Skipping missing file ${absolutePath}. Run "bun run --filter server seed:scaffold" to generate sample templates.`,
			);
			return null;
		}
		throw error;
	}
}

function resolveSeedDir(dirOverride?: string) {
	const candidate = dirOverride ?? process.env.SEED_DIR;
	if (candidate) {
		return path.isAbsolute(candidate)
			? candidate
			: path.resolve(process.cwd(), candidate);
	}
	return path.resolve(process.cwd(), defaultSeedRelativeDir);
}

async function seedFoundation(
	db: typeof appDb,
	state: SeedState,
	data: FoundationSeed,
	logger: SeedLogger,
) {
	const now = new Date();
	for (const entry of data.examTypes ?? []) {
		await db
			.insert(schema.examTypes)
			.values({
				name: entry.name,
				description: entry.description ?? null,
			})
			.onConflictDoUpdate({
				target: schema.examTypes.name,
				set: { description: entry.description ?? null },
			});
	}
	if (data.examTypes?.length) {
		logger.log(`[seed] • Exam types: ${data.examTypes.length}`);
	}

	for (const entry of data.faculties ?? []) {
		const code = normalizeCode(entry.code);
		const [faculty] = await db
			.insert(schema.faculties)
			.values({
				code,
				name: entry.name,
				description: entry.description ?? null,
			})
			.onConflictDoUpdate({
				target: schema.faculties.code,
				set: {
					name: entry.name,
					description: entry.description ?? null,
				},
			})
			.returning();
		state.faculties.set(code, { id: faculty.id, code });
	}
	if (data.faculties?.length) {
		logger.log(`[seed] • Faculties: ${data.faculties.length}`);
	}

	for (const entry of data.studyCycles ?? []) {
		const facultyCode = normalizeCode(entry.facultyCode);
		const faculty = state.faculties.get(facultyCode);
		if (!faculty) {
			throw new Error(
				`Unknown faculty code "${entry.facultyCode}" for study cycle ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const [cycle] = await db
			.insert(schema.studyCycles)
			.values({
				facultyId: faculty.id,
				code,
				name: entry.name,
				description: entry.description ?? null,
				totalCreditsRequired: entry.totalCreditsRequired ?? 180,
				durationYears: entry.durationYears ?? 3,
			})
			.onConflictDoUpdate({
				target: [schema.studyCycles.facultyId, schema.studyCycles.code],
				set: {
					name: entry.name,
					description: entry.description ?? null,
					totalCreditsRequired: entry.totalCreditsRequired ?? 180,
					durationYears: entry.durationYears ?? 3,
				},
			})
			.returning();
		state.studyCycles.set(`${facultyCode}::${code}`, {
			id: cycle.id,
			code,
			facultyCode,
		});
	}
	if (data.studyCycles?.length) {
		logger.log(`[seed] • Study cycles: ${data.studyCycles.length}`);
	}

	for (const entry of data.cycleLevels ?? []) {
		const facultyCode = normalizeCode(entry.facultyCode);
		const cycleCode = normalizeCode(entry.studyCycleCode);
		const cycle = state.studyCycles.get(`${facultyCode}::${cycleCode}`);
		if (!cycle) {
			throw new Error(
				`Unknown study cycle ${entry.studyCycleCode} for level ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const [level] = await db
			.insert(schema.cycleLevels)
			.values({
				cycleId: cycle.id,
				code,
				name: entry.name,
				orderIndex: entry.orderIndex,
				minCredits: entry.minCredits ?? 60,
			})
			.onConflictDoUpdate({
				target: [schema.cycleLevels.cycleId, schema.cycleLevels.code],
				set: {
					name: entry.name,
					orderIndex: entry.orderIndex,
					minCredits: entry.minCredits ?? 60,
				},
			})
			.returning();
		state.cycleLevels.set(`${facultyCode}::${cycleCode}::${code}`, {
			id: level.id,
			code,
			facultyCode,
			cycleCode,
		});
	}
	if (data.cycleLevels?.length) {
		logger.log(`[seed] • Cycle levels: ${data.cycleLevels.length}`);
	}

	for (const entry of data.semesters ?? []) {
		const code = normalizeCode(entry.code);
		const [semester] = await db
			.insert(schema.semesters)
			.values({
				code,
				name: entry.name,
				orderIndex: entry.orderIndex,
			})
			.onConflictDoUpdate({
				target: schema.semesters.code,
				set: {
					name: entry.name,
					orderIndex: entry.orderIndex,
				},
			})
			.returning();
		state.semesters.set(code, semester.id);
	}
	if (data.semesters?.length) {
		logger.log(`[seed] • Semesters: ${data.semesters.length}`);
	}

	for (const entry of data.academicYears ?? []) {
		const code = normalizeCode(entry.code);
		const name = entry.name ?? entry.code;
		const existing = await db.query.academicYears.findFirst({
			where: eq(schema.academicYears.name, name),
		});
		let academicYear = existing;
		if (existing) {
			academicYear = (
				await db
					.update(schema.academicYears)
					.set({
						startDate: new Date(entry.startDate),
						endDate: new Date(entry.endDate),
						isActive: entry.isActive ?? existing.isActive,
					})
					.where(eq(schema.academicYears.id, existing.id))
					.returning()
			)[0];
		} else {
			academicYear = (
				await db
					.insert(schema.academicYears)
					.values({
						name,
						startDate: new Date(entry.startDate),
						endDate: new Date(entry.endDate),
						isActive: entry.isActive ?? false,
					})
					.returning()
			)[0];
		}
		state.academicYears.set(code, academicYear.id);
	}
	if (data.academicYears?.length) {
		logger.log(`[seed] • Academic years: ${data.academicYears.length}`);
	}

	for (const entry of data.registrationNumberFormats ?? []) {
		if (entry.isActive) {
			await db
				.update(schema.registrationNumberFormats)
				.set({ isActive: false })
				.where(eq(schema.registrationNumberFormats.isActive, true));
		}
		const existing = await db.query.registrationNumberFormats.findFirst({
			where: eq(schema.registrationNumberFormats.name, entry.name),
		});
		if (existing) {
			await db
				.update(schema.registrationNumberFormats)
				.set({
					description: entry.description ?? existing.description,
					definition: entry.definition,
					isActive: entry.isActive ?? existing.isActive,
					updatedAt: new Date(),
				})
				.where(eq(schema.registrationNumberFormats.id, existing.id));
		} else {
			await db.insert(schema.registrationNumberFormats).values({
				name: entry.name,
				description: entry.description ?? null,
				definition: entry.definition,
				isActive: entry.isActive ?? false,
			});
		}
	}
	if (data.registrationNumberFormats?.length) {
		logger.log(
			`[seed] • Registration formats: ${data.registrationNumberFormats.length}`,
		);
	}
	logger.log("[seed] Foundation layer applied.");
}

async function seedAcademics(
	db: typeof appDb,
	state: SeedState,
	data: AcademicsSeed,
	logger: SeedLogger,
) {
	const now = new Date();
	for (const entry of data.programs ?? []) {
		const facultyCode = normalizeCode(entry.facultyCode);
		const faculty = state.faculties.get(facultyCode);
		if (!faculty) {
			throw new Error(
				`Unknown faculty code "${entry.facultyCode}" for program ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const slug = entry.slug ?? slugify(entry.name);
		const [program] = await db
			.insert(schema.programs)
			.values({
				code,
				name: entry.name,
				slug,
				description: entry.description ?? null,
				faculty: faculty.id,
			})
			.onConflictDoUpdate({
				target: [schema.programs.code, schema.programs.faculty],
				set: {
					name: entry.name,
					slug,
					description: entry.description ?? null,
				},
			})
			.returning();
		state.programs.set(code, {
			id: program.id,
			code,
			facultyCode,
		});
	}
	if (data.programs?.length) {
		logger.log(`[seed] • Programs: ${data.programs.length}`);
	}

	for (const entry of data.programOptions ?? []) {
		const programCode = normalizeCode(entry.programCode);
		const program = state.programs.get(programCode);
		if (!program) {
			throw new Error(
				`Unknown program code "${entry.programCode}" for option ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const [option] = await db
			.insert(schema.programOptions)
			.values({
				programId: program.id,
				code,
				name: entry.name,
				description: entry.description ?? null,
			})
			.onConflictDoUpdate({
				target: [schema.programOptions.programId, schema.programOptions.code],
				set: {
					name: entry.name,
					description: entry.description ?? null,
				},
			})
			.returning();
		state.programOptions.set(`${programCode}::${code}`, {
			id: option.id,
			programCode,
		});
	}
	if (data.programOptions?.length) {
		logger.log(`[seed] • Program options: ${data.programOptions.length}`);
	}

	for (const entry of data.teachingUnits ?? []) {
		const programCode = normalizeCode(entry.programCode);
		const program = state.programs.get(programCode);
		if (!program) {
			throw new Error(
				`Unknown program code "${entry.programCode}" for teaching unit ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const [unit] = await db
			.insert(schema.teachingUnits)
			.values({
				programId: program.id,
				code,
				name: entry.name,
				description: entry.description ?? null,
				credits: entry.credits ?? 0,
				semester: entry.semester ?? "annual",
			})
			.onConflictDoUpdate({
				target: [schema.teachingUnits.programId, schema.teachingUnits.code],
				set: {
					name: entry.name,
					description: entry.description ?? null,
					credits: entry.credits ?? 0,
					semester: entry.semester ?? "annual",
				},
			})
			.returning();
		state.teachingUnits.set(`${programCode}::${code}`, {
			id: unit.id,
			programCode,
		});
	}
	if (data.teachingUnits?.length) {
		logger.log(`[seed] • Teaching units: ${data.teachingUnits.length}`);
	}

	for (const entry of data.courses ?? []) {
		const programCode = normalizeCode(entry.programCode);
		const program = state.programs.get(programCode);
		if (!program) {
			throw new Error(
				`Unknown program code "${entry.programCode}" for course ${entry.code}`,
			);
		}
		const unitCode = normalizeCode(entry.teachingUnitCode);
		const teachingUnit = state.teachingUnits.get(`${programCode}::${unitCode}`);
		if (!teachingUnit) {
			throw new Error(
				`Unknown teaching unit ${entry.teachingUnitCode} for course ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const [course] = await db
			.insert(schema.courses)
			.values({
				program: program.id,
				teachingUnitId: teachingUnit.id,
				code,
				name: entry.name,
				hours: entry.hours,
				defaultTeacher: null,
			})
			.onConflictDoUpdate({
				target: [schema.courses.program, schema.courses.code],
				set: {
					name: entry.name,
					hours: entry.hours,
				},
			})
			.returning();
		let programCourses = state.courses.get(code);
		if (!programCourses) {
			programCourses = new Map();
			state.courses.set(code, programCourses);
		}
		programCourses.set(programCode, {
			id: course.id,
			code,
			programCode,
		});
	}
	if (data.courses?.length) {
		logger.log(`[seed] • Courses: ${data.courses.length}`);
	}

	for (const entry of data.classes ?? []) {
		const programCode = normalizeCode(entry.programCode);
		const program = state.programs.get(programCode);
		if (!program) {
			throw new Error(
				`Unknown program code "${entry.programCode}" for class ${entry.code}`,
			);
		}
		const optionCode = normalizeCode(entry.programOptionCode);
		const option = state.programOptions.get(`${programCode}::${optionCode}`);
		if (!option) {
			throw new Error(
				`Unknown option ${entry.programOptionCode} for class ${entry.code}`,
			);
		}
		const academicYearId = state.academicYears.get(
			normalizeCode(entry.academicYearCode),
		);
		if (!academicYearId) {
			throw new Error(
				`Unknown academic year ${entry.academicYearCode} for class ${entry.code}`,
			);
		}
		const semesterId = entry.semesterCode
			? (state.semesters.get(normalizeCode(entry.semesterCode)) ?? null)
			: null;
		if (entry.semesterCode && !semesterId) {
			throw new Error(
				`Unknown semester ${entry.semesterCode} for class ${entry.code}`,
			);
		}
		const facultyCode = program.facultyCode;
		const cycleKey = `${facultyCode}::${normalizeCode(entry.studyCycleCode)}`;
		const cycleLevelKey = `${cycleKey}::${normalizeCode(entry.cycleLevelCode)}`;
		const cycleLevel = state.cycleLevels.get(cycleLevelKey);
		if (!cycleLevel) {
			throw new Error(
				`Unknown cycle level ${entry.cycleLevelCode} for class ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const [klass] = await db
			.insert(schema.classes)
			.values({
				code,
				name: entry.name,
				program: program.id,
				academicYear: academicYearId,
				cycleLevelId: cycleLevel.id,
				programOptionId: option.id,
				semesterId,
			})
			.onConflictDoUpdate({
				target: [schema.classes.code, schema.classes.academicYear],
				set: {
					name: entry.name,
					programOptionId: option.id,
					cycleLevelId: cycleLevel.id,
					semesterId,
				},
			})
			.returning();
		let byYear = state.classes.get(code);
		if (!byYear) {
			byYear = new Map();
			state.classes.set(code, byYear);
		}
		byYear.set(normalizeCode(entry.academicYearCode), {
			id: klass.id,
			code,
			academicYearCode: normalizeCode(entry.academicYearCode),
			programCode,
		});
	}
	if (data.classes?.length) {
		logger.log(`[seed] • Classes: ${data.classes.length}`);
	}

	if (data.classCourses?.length) {
		state.pendingClassCourses.push(...data.classCourses);
		logger.log(
			`[seed] • Queued class courses: ${data.classCourses.length} (waiting for teachers)`,
		);
	}
	logger.log("[seed] Academics layer applied.");
}

async function seedUsers(
	db: typeof appDb,
	state: SeedState,
	data: UsersSeed,
	logger: SeedLogger,
) {
	const now = new Date();
	for (const entry of data.authUsers ?? []) {
		const id = await ensureAuthUser(db, entry);
		state.authUsers.set(normalizeCode(entry.code), id);
	}
	if (data.authUsers?.length) {
		logger.log(`[seed] • Auth users: ${data.authUsers.length}`);
	}

	for (const entry of data.domainUsers ?? []) {
		const code = normalizeCode(entry.code);
		const authUserId =
			(entry.authUserCode
				? state.authUsers.get(normalizeCode(entry.authUserCode))
				: undefined) ??
			(entry.authUserEmail
				? await findAuthUserIdByEmail(db, entry.authUserEmail)
				: undefined) ??
			null;
		const [profile] = await db
			.insert(schema.domainUsers)
			.values({
				authUserId,
				businessRole: entry.businessRole,
				firstName: entry.firstName,
				lastName: entry.lastName,
				primaryEmail: entry.primaryEmail,
				phone: entry.phone ?? null,
				dateOfBirth: entry.dateOfBirth ? new Date(entry.dateOfBirth) : null,
				placeOfBirth: entry.placeOfBirth ?? null,
				gender: entry.gender ?? null,
				nationality: entry.nationality ?? null,
				status: entry.status ?? "active",
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: schema.domainUsers.primaryEmail,
				set: {
					authUserId,
					businessRole: entry.businessRole,
					firstName: entry.firstName,
					lastName: entry.lastName,
					phone: entry.phone ?? null,
					dateOfBirth: entry.dateOfBirth ? new Date(entry.dateOfBirth) : null,
					placeOfBirth: entry.placeOfBirth ?? null,
					gender: entry.gender ?? null,
					nationality: entry.nationality ?? null,
					status: entry.status ?? "active",
					updatedAt: now,
				},
			})
			.returning();
		state.domainUsers.set(code, {
			id: profile.id,
			businessRole: profile.businessRole,
		});
	}
	if (data.domainUsers?.length) {
		logger.log(`[seed] • Domain users: ${data.domainUsers.length}`);
	}

	if (state.pendingClassCourses.length) {
		await seedClassCourses(db, state, logger);
	}

	for (const entry of data.students ?? []) {
		const domainUser = state.domainUsers.get(
			normalizeCode(entry.domainUserCode),
		);
		if (!domainUser) {
			throw new Error(
				`Unknown domain user code "${entry.domainUserCode}" for student ${entry.code}`,
			);
		}
		const klass = findClassRecord(
			state,
			entry.classCode,
			entry.classAcademicYearCode,
		);
		if (!klass) {
			throw new Error(
				`Unknown class ${entry.classCode} for student ${entry.code}`,
			);
		}
		const [student] = await db
			.insert(schema.students)
			.values({
				domainUserId: domainUser.id,
				class: klass.id,
				registrationNumber: entry.registrationNumber,
			})
			.onConflictDoUpdate({
				target: schema.students.registrationNumber,
				set: {
					domainUserId: domainUser.id,
					class: klass.id,
				},
			})
			.returning();
		state.students.set(normalizeCode(entry.code), { id: student.id });
	}
	if (data.students?.length) {
		logger.log(`[seed] • Students: ${data.students.length}`);
	}

	for (const entry of data.enrollments ?? []) {
		const student = state.students.get(normalizeCode(entry.studentCode));
		if (!student) {
			throw new Error(
				`Unknown student code "${entry.studentCode}" for enrollment`,
			);
		}
		const klass = findClassRecord(
			state,
			entry.classCode,
			entry.classAcademicYearCode ?? entry.academicYearCode,
		);
		if (!klass) {
			throw new Error(
				`Unknown class ${entry.classCode} for enrollment of ${entry.studentCode}`,
			);
		}
		const academicYearId = state.academicYears.get(
			normalizeCode(entry.academicYearCode),
		);
		if (!academicYearId) {
			throw new Error(
				`Unknown academic year ${entry.academicYearCode} for enrollment`,
			);
		}
		const existing = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, student.id),
				eq(schema.enrollments.classId, klass.id),
				eq(schema.enrollments.academicYearId, academicYearId),
			),
		});
		if (existing) {
			await db
				.update(schema.enrollments)
				.set({
					status: entry.status ?? existing.status,
					enrolledAt: existing.enrolledAt,
				})
				.where(eq(schema.enrollments.id, existing.id));
		} else {
			await db.insert(schema.enrollments).values({
				studentId: student.id,
				classId: klass.id,
				academicYearId,
				status: entry.status ?? "active",
				enrolledAt: now,
			});
		}
	}
	if (data.enrollments?.length) {
		logger.log(`[seed] • Enrollments: ${data.enrollments.length}`);
	}

	for (const entry of data.studentCourseEnrollments ?? []) {
		const student = state.students.get(normalizeCode(entry.studentCode));
		if (!student) {
			throw new Error(
				`Unknown student code "${entry.studentCode}" for course enrollment`,
			);
		}
		const classCourse = state.classCourses.get(
			normalizeCode(entry.classCourseCode),
		);
		if (!classCourse) {
			throw new Error(
				`Unknown classCourse ${entry.classCourseCode} for student course enrollment`,
			);
		}
		const sourceClass = findClassRecord(
			state,
			entry.sourceClassCode,
			entry.sourceClassAcademicYearCode,
		);
		if (!sourceClass) {
			throw new Error(
				`Unknown source class ${entry.sourceClassCode} for student course enrollment`,
			);
		}
		const academicYearId = state.academicYears.get(
			normalizeCode(entry.academicYearCode),
		);
		if (!academicYearId) {
			throw new Error(
				`Unknown academic year ${entry.academicYearCode} for student course enrollment`,
			);
		}
		const courseGroup = state.courses.get(normalizeCode(entry.courseCode));
		const courseRecord = courseGroup
			? // Prefer course belonging to class program if available.
				(courseGroup.get(sourceClass.programCode) ??
				Array.from(courseGroup.values())[0])
			: null;
		if (!courseRecord) {
			throw new Error(
				`Unknown course ${entry.courseCode} for student course enrollment`,
			);
		}
		await db
			.insert(schema.studentCourseEnrollments)
			.values({
				studentId: student.id,
				classCourseId: classCourse.id,
				courseId: courseRecord.id,
				sourceClassId: sourceClass.id,
				academicYearId,
				status: entry.status ?? "active",
				attempt: entry.attempt ?? 1,
				creditsAttempted: entry.creditsAttempted,
				creditsEarned: entry.creditsEarned ?? 0,
			})
			.onConflictDoUpdate({
				target: [
					schema.studentCourseEnrollments.studentId,
					schema.studentCourseEnrollments.courseId,
					schema.studentCourseEnrollments.academicYearId,
					schema.studentCourseEnrollments.attempt,
				],
				set: {
					classCourseId: classCourse.id,
					sourceClassId: sourceClass.id,
					status: entry.status ?? "active",
					creditsAttempted: entry.creditsAttempted,
					creditsEarned: entry.creditsEarned ?? 0,
				},
			});
	}
	if (data.studentCourseEnrollments?.length) {
		logger.log(
			`[seed] • Student course enrollments: ${data.studentCourseEnrollments.length}`,
		);
	}

	logger.log("[seed] Users layer applied.");
}

async function ensureAuthUser(db: typeof appDb, entry: AuthUserSeed) {
	const now = new Date();
	const normalizedEmail = entry.email.trim().toLowerCase();
	const [user] = await db
		.insert(authSchema.user)
		.values({
			id: `seed_${normalizeCode(entry.code)}_${randomUUID()}`,
			email: normalizedEmail,
			name: entry.name,
			emailVerified: true,
			role: entry.role ?? "user",
			banned: false,
			banReason: null,
			banExpires: null,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: authSchema.user.email,
			set: {
				name: entry.name,
				role: entry.role ?? "user",
				updatedAt: now,
			},
		})
		.returning();
	const hashedPassword = await hashPassword(entry.password);
	const [existingAccount] = await db
		.select()
		.from(authSchema.account)
		.where(
			and(
				eq(authSchema.account.userId, user.id),
				eq(authSchema.account.providerId, "credential"),
			),
		)
		.limit(1);
	if (existingAccount) {
		await db
			.update(authSchema.account)
			.set({
				password: hashedPassword,
				updatedAt: now,
			})
			.where(eq(authSchema.account.id, existingAccount.id));
	} else {
		await db.insert(authSchema.account).values({
			id: randomUUID(),
			userId: user.id,
			accountId: user.id,
			providerId: "credential",
			password: hashedPassword,
			createdAt: now,
			updatedAt: now,
		});
	}
	return user.id;
}

async function findAuthUserIdByEmail(db: typeof appDb, email: string) {
	const normalized = email.trim().toLowerCase();
	const record = await db.query.user.findFirst({
		where: eq(authSchema.user.email, normalized),
	});
	return record?.id ?? null;
}

async function seedClassCourses(
	db: typeof appDb,
	state: SeedState,
	logger: SeedLogger,
) {
	const toSeed = state.pendingClassCourses.splice(0);
	for (const entry of toSeed) {
		const classRecord = findClassRecord(
			state,
			entry.classCode,
			entry.classAcademicYearCode,
		);
		if (!classRecord) {
			throw new Error(
				`Unknown class ${entry.classCode} for class course ${entry.code}`,
			);
		}
		const teacher = state.domainUsers.get(normalizeCode(entry.teacherCode));
		if (!teacher) {
			throw new Error(
				`Unknown teacher code ${entry.teacherCode} for class course ${entry.code}`,
			);
		}
		const courseGroup = state.courses.get(normalizeCode(entry.courseCode));
		const courseRecord = courseGroup
			? (courseGroup.get(classRecord.programCode) ??
				Array.from(courseGroup.values())[0])
			: null;
		if (!courseRecord) {
			throw new Error(
				`Unknown course ${entry.courseCode} for class course ${entry.code}`,
			);
		}
		const semesterId = entry.semesterCode
			? (state.semesters.get(normalizeCode(entry.semesterCode)) ?? null)
			: null;
		if (entry.semesterCode && !semesterId) {
			throw new Error(
				`Unknown semester ${entry.semesterCode} for class course ${entry.code}`,
			);
		}
		const code = normalizeCode(entry.code);
		const [classCourse] = await db
			.insert(schema.classCourses)
			.values({
				code,
				class: classRecord.id,
				course: courseRecord.id,
				teacher: teacher.id,
				semesterId,
				weeklyHours: entry.weeklyHours ?? 0,
			})
			.onConflictDoUpdate({
				target: schema.classCourses.code,
				set: {
					class: classRecord.id,
					course: courseRecord.id,
					teacher: teacher.id,
					semesterId,
					weeklyHours: entry.weeklyHours ?? 0,
				},
			})
			.returning();
		state.classCourses.set(code, {
			id: classCourse.id,
			classId: classRecord.id,
			courseId: courseRecord.id,
		});
	}
	if (toSeed.length) {
		logger.log(`[seed] • Class courses: ${toSeed.length}`);
	}
}

function findClassRecord(
	state: SeedState,
	classCode: string,
	academicYearCode?: string,
) {
	const code = normalizeCode(classCode);
	const byYear = state.classes.get(code);
	if (!byYear) return null;
	if (academicYearCode) {
		return byYear.get(normalizeCode(academicYearCode)) ?? null;
	}
	if (byYear.size === 1) {
		return Array.from(byYear.values())[0];
	}
	throw new Error(
		`Class ${classCode} exists for multiple academic years. Provide classAcademicYearCode to disambiguate.`,
	);
}
