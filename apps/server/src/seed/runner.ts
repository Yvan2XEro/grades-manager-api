import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
import { and, asc, eq } from "drizzle-orm";
import { parse as parseYaml } from "yaml";
import { db as appDb } from "../db";
import type {
	BusinessRole,
	DomainUserStatus,
	EnrollmentStatus,
	EnrollmentWindowStatus,
	Gender,
	StudentCourseEnrollmentStatus,
	TeachingUnitSemester,
} from "../db/schema/app-schema";
import * as schema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";
import type { RegistrationNumberFormatDefinition } from "../db/schema/registration-number-types";
import type { OrganizationRoleName } from "../lib/organization-roles";
import { normalizeCode, slugify } from "../lib/strings";
import * as studentCreditLedgerService from "../modules/student-credit-ledger/student-credit-ledger.service";

type SeedLogger = Pick<Console, "log" | "error">;

export type SeedMeta = {
	version?: string;
	generatedAt?: string;
	dataset?: string;
};

export type FoundationSeed = {
	meta?: SeedMeta;
	organizations?: Array<{
		slug: string;
		name: string;
		logo?: string;
	}>;
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
	institutions?: Array<{
		code: string;
		type?: "main" | "faculty" | "department" | "other";
		shortName?: string;
		nameFr: string;
		nameEn: string;
		legalNameFr?: string;
		legalNameEn?: string;
		sloganFr?: string;
		sloganEn?: string;
		descriptionFr?: string;
		descriptionEn?: string;
		addressFr?: string;
		addressEn?: string;
		contactEmail?: string;
		contactPhone?: string;
		fax?: string;
		postalBox?: string;
		website?: string;
		logoUrl?: string;
		coverImageUrl?: string;
		defaultAcademicYearCode?: string;
		registrationFormatName?: string;
		timezone?: string;
		organizationSlug?: string;
		parentInstitutionCode?: string;
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

type ExamSeed = {
	id: string;
	classCourseCode: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	status?: "draft" | "scheduled" | "submitted" | "approved" | "rejected";
	isLocked?: boolean;
	scheduledByCode?: string;
	validatedByCode?: string;
	scheduledAt?: string;
	validatedAt?: string;
};

type EnrollmentWindowSeed = {
	classCode: string;
	academicYearCode: string;
	status?: EnrollmentWindowStatus;
	openedAt?: string;
	closedAt?: string;
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
	exams?: ExamSeed[];
	enrollmentWindows?: EnrollmentWindowSeed[];
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
	organizationSlug?: string;
	memberRole?: OrganizationRoleName;
};

const STAFF_BUSINESS_ROLES: BusinessRole[] = [
	"super_admin",
	"administrator",
	"dean",
	"teacher",
	"staff",
];

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
	// External admission fields
	admissionType?: "normal" | "transfer" | "direct" | "equivalence";
	transferInstitution?: string;
	transferCredits?: number;
	transferLevel?: string;
	admissionJustification?: string;
	admissionDate?: string;
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
	institutionId: string;
};

type ClassRecord = {
	id: string;
	code: string;
	academicYearCode: string;
	programCode: string;
	institutionId: string;
};

type CourseRecord = {
	id: string;
	code: string;
	programCode: string;
	institutionId: string;
};

type SeedState = {
	defaultInstitutionId?: string;
	organizations: Map<string, { id: string; slug: string }>;
	institutions: Map<
		string,
		{ id: string; code: string; organizationId: string | null }
	>;
	faculties: Map<string, { id: string; code: string }>;
	studyCycles: Map<string, { id: string; facultyCode: string; code: string }>;
	cycleLevels: Map<
		string,
		{ id: string; facultyCode: string; cycleCode: string; code: string }
	>;
	semesters: Map<string, string>;
	academicYears: Map<string, string>;
	programs: Map<string, ProgramRecord>;
	programOptions: Map<
		string,
		{ id: string; programCode: string; institutionId: string }
	>;
	teachingUnits: Map<
		string,
		{ id: string; programCode: string; institutionId: string }
	>;
	courses: Map<string, Map<string, CourseRecord>>;
	classes: Map<string, Map<string, ClassRecord>>;
	classCourses: Map<
		string,
		{ id: string; classId: string; courseId: string; institutionId: string }
	>;
	pendingClassCourses: ClassCourseSeed[];
	pendingExams: ExamSeed[];
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
			`[seed] Applying foundation layer${
				foundation.meta?.version ? ` (${foundation.meta.version})` : ""
			}`,
		);
		await seedFoundation(db, state, foundation, logger);
	}
	const academics = await loadSeedFile<AcademicsSeed>(academicsPath, logger);
	if (academics) {
		logger.log(
			`[seed] Applying academics layer${
				academics.meta?.version ? ` (${academics.meta.version})` : ""
			}`,
		);
		await seedAcademics(db, state, academics, logger);
	}
	const users = await loadSeedFile<UsersSeed>(usersPath, logger);
	if (users) {
		logger.log(
			`[seed] Applying users layer${
				users.meta?.version ? ` (${users.meta.version})` : ""
			}`,
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
		defaultInstitutionId: undefined,
		organizations: new Map(),
		institutions: new Map(),
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
		pendingExams: [],
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

/**
 * Fallback to get or create a default institution for seeds that don't define institutions.
 *
 * TODO (Phase 3b): This should eventually require organizations to be defined in seed YAML.
 * For now, it maintains backward compatibility by auto-creating a default institution,
 * but this institution won't have an organizationId, which will cause issues with the
 * new organization-based tenant resolution.
 *
 * Proper solution: Seeds should define organizations first, then institutions linked to them.
 */
async function ensureSeedInstitutionId(db: typeof appDb, state: SeedState) {
	if (state.defaultInstitutionId) {
		return state.defaultInstitutionId;
	}
	const existing = await db
		.select({ id: schema.institutions.id })
		.from(schema.institutions)
		.orderBy(asc(schema.institutions.createdAt))
		.limit(1);
	const found = existing.at(0);
	if (found) {
		state.defaultInstitutionId = found.id;
		return found.id;
	}
	const [created] = await db
		.insert(schema.institutions)
		.values({
			code: "default",
			shortName: "DEFAULT",
			nameFr: "Institution par défaut",
			nameEn: "Default Institution",
			// NOTE: organizationId is null, which will cause issues with new tenant resolution
		})
		.returning();
	state.defaultInstitutionId = created.id;
	return created.id;
}

async function seedFoundation(
	db: typeof appDb,
	state: SeedState,
	data: FoundationSeed,
	logger: SeedLogger,
) {
	const now = new Date();

	// Seed organizations first (Better Auth)
	for (const entry of data.organizations ?? []) {
		const slug = entry.slug;
		const [org] = await db
			.insert(authSchema.organization)
			.values({
				id: randomUUID(),
				name: entry.name,
				slug: slug,
				logo: entry.logo ?? null,
				createdAt: now,
			})
			.onConflictDoUpdate({
				target: authSchema.organization.slug,
				set: {
					name: entry.name,
					logo: entry.logo ?? null,
				},
			})
			.returning();
		state.organizations.set(slug, { id: org.id, slug: org.slug });
	}
	if (data.organizations?.length) {
		logger.log(`[seed] • Organizations: ${data.organizations.length}`);
	}

	const institutionId = await ensureSeedInstitutionId(db, state);

	// Process institutions early so that institutions with type="faculty" can populate state.faculties
	// before they are needed by studyCycles
	const institutions = data.institutions ?? [];
	for (let idx = 0; idx < institutions.length; idx++) {
		const entry = institutions[idx];
		const code = normalizeCode(entry.code);
		const defaultAcademicYearId = entry.defaultAcademicYearCode
			? state.academicYears.get(normalizeCode(entry.defaultAcademicYearCode))
			: undefined;
		let registrationFormatId: string | undefined;
		if (entry.registrationFormatName) {
			const format = await db.query.registrationNumberFormats.findFirst({
				where: eq(
					schema.registrationNumberFormats.name,
					entry.registrationFormatName,
				),
			});
			registrationFormatId = format?.id;
		}

		// Resolve organization ID from slug if provided
		let organizationId: string | null = null;
		if (entry.organizationSlug) {
			const org = state.organizations.get(entry.organizationSlug);
			if (!org) {
				throw new Error(
					`Organization with slug "${entry.organizationSlug}" not found for institution ${entry.code}. Ensure organizations are defined before institutions.`,
				);
			}
			organizationId = org.id;
		}

		// Resolve parent institution ID from code if provided
		let parentInstitutionId: string | null = null;
		if (entry.parentInstitutionCode) {
			const parent = state.institutions.get(normalizeCode(entry.parentInstitutionCode));
			if (!parent) {
				throw new Error(
					`Parent institution with code "${entry.parentInstitutionCode}" not found for institution ${entry.code}. Ensure parent institutions are defined before children.`,
				);
			}
			parentInstitutionId = parent.id;
		}

		const payload = {
			code,
			type: entry.type ?? "other",
			shortName: entry.shortName ?? null,
			nameFr: entry.nameFr,
			nameEn: entry.nameEn,
			legalNameFr: entry.legalNameFr ?? null,
			legalNameEn: entry.legalNameEn ?? null,
			sloganFr: entry.sloganFr ?? null,
			sloganEn: entry.sloganEn ?? null,
			descriptionFr: entry.descriptionFr ?? null,
			descriptionEn: entry.descriptionEn ?? null,
			addressFr: entry.addressFr ?? null,
			addressEn: entry.addressEn ?? null,
			contactEmail: entry.contactEmail ?? null,
			contactPhone: entry.contactPhone ?? null,
			fax: entry.fax ?? null,
			postalBox: entry.postalBox ?? null,
			website: entry.website ?? null,
			logoUrl: entry.logoUrl ?? null,
			coverImageUrl: entry.coverImageUrl ?? null,
			defaultAcademicYearId: defaultAcademicYearId ?? null,
			registrationFormatId: registrationFormatId ?? null,
			timezone: entry.timezone ?? "UTC",
			organizationId,
			parentInstitutionId,
			updatedAt: new Date(),
		};

		let institutionRecordId: string;
		if (idx === 0 && state.defaultInstitutionId) {
			await db
				.update(schema.institutions)
				.set(payload)
				.where(eq(schema.institutions.id, state.defaultInstitutionId));
			institutionRecordId = state.defaultInstitutionId;
		} else {
			const [inst] = await db
				.insert(schema.institutions)
				.values(payload)
				.onConflictDoUpdate({
					target: schema.institutions.code,
					set: payload,
				})
				.returning();
			institutionRecordId = inst.id;
		}

		state.institutions.set(code, {
			id: institutionRecordId,
			code,
			organizationId,
		});

		// Register all institutions in state.faculties for backward compatibility
		// This allows studyCycles and programs to reference any institution via facultyCode
		// Supports both faculty-based structures and single-institution setups
		state.faculties.set(code, { id: institutionRecordId, code });

		// Set as default institution if it's the first one
		if (idx === 0 && !state.defaultInstitutionId) {
			state.defaultInstitutionId = institutionRecordId;
		}
	}
	if (data.institutions?.length) {
		logger.log(`[seed] • Institutions: ${data.institutions.length}`);
	}

	for (const entry of data.examTypes ?? []) {
		await db
			.insert(schema.examTypes)
			.values({
				name: entry.name,
				description: entry.description ?? null,
				institutionId,
			})
			.onConflictDoUpdate({
				target: [schema.examTypes.institutionId, schema.examTypes.name],
				set: { description: entry.description ?? null },
			});
	}
	if (data.examTypes?.length) {
		logger.log(`[seed] • Exam types: ${data.examTypes.length}`);
	}

	// Get organization ID from the main institution (optional for backward compatibility)
	const [mainInst] = await db
		.select({ organizationId: schema.institutions.organizationId })
		.from(schema.institutions)
		.where(eq(schema.institutions.id, institutionId))
		.limit(1);

	let organizationId = mainInst?.organizationId;

	// If no organization exists, create a default one for faculties
	if (!organizationId && (data.faculties?.length ?? 0) > 0) {
		const [defaultOrg] = await db
			.insert(authSchema.organization)
			.values({
				id: randomUUID(),
				name: "Default Organization",
				slug: "default-org",
				createdAt: now,
			})
			.onConflictDoUpdate({
				target: authSchema.organization.slug,
				set: {
					name: "Default Organization",
				},
			})
			.returning();
		organizationId = defaultOrg.id;

		// Update the main institution with this organizationId
		await db
			.update(schema.institutions)
			.set({ organizationId: defaultOrg.id })
			.where(eq(schema.institutions.id, institutionId));
	}

	for (const entry of data.faculties ?? []) {
		const code = normalizeCode(entry.code);

		// Use the organizationId from the main institution or the default one we just created
		if (!organizationId) {
			throw new Error(
				"Cannot create faculties without an organization. Please define organizations in your seed data.",
			);
		}
		const facultyOrgId = organizationId;

		// Vérifier si l'institution existe déjà
		const existing = await db.query.institutions.findFirst({
			where: and(
				eq(schema.institutions.organizationId, facultyOrgId),
				eq(schema.institutions.code, code),
			),
		});

		let faculty;
		if (existing) {
			// Mettre à jour
			const [updated] = await db
				.update(schema.institutions)
				.set({
					nameFr: entry.name,
					nameEn: entry.name,
					descriptionFr: entry.description ?? null,
				})
				.where(eq(schema.institutions.id, existing.id))
				.returning();
			faculty = updated;
		} else {
			// Créer nouveau
			const [created] = await db
				.insert(schema.institutions)
				.values({
					code,
					type: "faculty",
					nameFr: entry.name,
					nameEn: entry.name,
					shortName: code,
					descriptionFr: entry.description ?? null,
					// Une institution n'est pas forcément parrainée par une autre
					// parentInstitutionId est complètement optionnel
					parentInstitutionId: null,
					organizationId: facultyOrgId,
				})
				.returning();
			faculty = created;
		}

		state.faculties.set(code, { id: faculty.id, code });
	}
	if (data.faculties?.length) {
		logger.log(
			`[seed] • Faculties (as institutions): ${data.faculties.length}`,
		);
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
				institutionId: faculty.id,
				code,
				name: entry.name,
				description: entry.description ?? null,
				totalCreditsRequired: entry.totalCreditsRequired ?? 180,
				durationYears: entry.durationYears ?? 3,
			})
			.onConflictDoUpdate({
				target: [schema.studyCycles.institutionId, schema.studyCycles.code],
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
						institutionId,
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
						institutionId,
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
				.where(
					and(
						eq(schema.registrationNumberFormats.isActive, true),
						eq(schema.registrationNumberFormats.institutionId, institutionId),
					),
				);
		}
		const existing = await db.query.registrationNumberFormats.findFirst({
			where: and(
				eq(schema.registrationNumberFormats.name, entry.name),
				eq(schema.registrationNumberFormats.institutionId, institutionId),
			),
		});
		if (existing) {
			await db
				.update(schema.registrationNumberFormats)
				.set({
					description: entry.description ?? existing.description,
					definition: entry.definition,
					isActive: entry.isActive ?? existing.isActive,
					updatedAt: new Date(),
					institutionId,
				})
				.where(eq(schema.registrationNumberFormats.id, existing.id));
		} else {
			await db.insert(schema.registrationNumberFormats).values({
				name: entry.name,
				description: entry.description ?? null,
				definition: entry.definition,
				isActive: entry.isActive ?? false,
				institutionId,
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
	const institutionId = await ensureSeedInstitutionId(db, state);
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
				institutionId: faculty.id,
			})
			.onConflictDoUpdate({
				target: [schema.programs.code, schema.programs.institutionId],
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
			institutionId: faculty.id,
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
				institutionId: program.institutionId,
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
			institutionId,
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
				institutionId: program.institutionId,
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
			institutionId,
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
				institutionId: program.institutionId,
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
			institutionId,
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
				institutionId,
			})
			.onConflictDoUpdate({
				target: [schema.classes.code, schema.classes.academicYear],
				set: {
					name: entry.name,
					programOptionId: option.id,
					cycleLevelId: cycleLevel.id,
					semesterId,
					institutionId: program.institutionId,
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
			institutionId,
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
	if (data.exams?.length) {
		state.pendingExams.push(...data.exams);
		logger.log(
			`[seed] • Queued exams: ${data.exams.length} (waiting for class courses)`,
		);
	}
	if (data.enrollmentWindows?.length) {
		await seedEnrollmentWindows(db, state, data.enrollmentWindows, logger);
	}
	logger.log("[seed] Academics layer applied.");
}

function resolveSeedOrganization(
	state: SeedState,
	slug?: string,
): { id: string; slug: string } {
	if (slug) {
		const org = state.organizations.get(slug);
		if (!org) {
			throw new Error(
				`Unknown organization slug "${slug}" referenced in users seed. Define the organization in 00-foundation.yaml.`,
			);
		}
		return org;
	}
	const firstOrg = state.organizations.values().next().value;
	if (!firstOrg) {
		throw new Error(
			"No organizations are available in the seed state. Add at least one organization to the foundation seed before seeding users.",
		);
	}
	return firstOrg;
}

function determineMemberRole(
	seed: DomainUserSeed,
): OrganizationRoleName | null {
	if (seed.memberRole) {
		return seed.memberRole;
	}
	if (!STAFF_BUSINESS_ROLES.includes(seed.businessRole)) {
		return null;
	}
	return seed.businessRole;
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

		const targetMemberRole = determineMemberRole(entry);
		if (authUserId && targetMemberRole) {
			const organization = resolveSeedOrganization(
				state,
				entry.organizationSlug,
			);
			const existingMember = await db.query.member.findFirst({
				where: and(
					eq(authSchema.member.userId, authUserId),
					eq(authSchema.member.organizationId, organization.id),
				),
			});

			let memberId: string;
			if (existingMember) {
				memberId = existingMember.id;
				if (
					existingMember.role !== targetMemberRole &&
					existingMember.role !== "owner"
				) {
					await db
						.update(authSchema.member)
						.set({ role: targetMemberRole })
						.where(eq(authSchema.member.id, existingMember.id));
				}
			} else {
				const [member] = await db
					.insert(authSchema.member)
					.values({
						id: randomUUID(),
						organizationId: organization.id,
						userId: authUserId,
						role: targetMemberRole,
						createdAt: now,
					})
					.returning();
				memberId = member.id;
			}

			await db
				.update(schema.domainUsers)
				.set({ memberId })
				.where(eq(schema.domainUsers.id, profile.id));
		}
	}
	if (data.domainUsers?.length) {
		logger.log(`[seed] • Domain users: ${data.domainUsers.length}`);
	}

	if (state.pendingClassCourses.length) {
		await seedClassCourses(db, state, logger);
	}
	if (state.pendingExams.length) {
		await seedExams(db, state, logger);
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
				institutionId: klass.institutionId,
			})
			.onConflictDoUpdate({
				target: schema.students.registrationNumber,
				set: {
					domainUserId: domainUser.id,
					class: klass.id,
					institutionId: klass.institutionId,
				},
			})
			.returning();
		state.students.set(normalizeCode(entry.code), { id: student.id });

		// Auto-create a default enrollment if not explicitly provided in enrollments section
		// This ensures backward compatibility with seeds that don't specify enrollments
		const explicitEnrollment = data.enrollments?.find(
			(e) => normalizeCode(e.studentCode) === normalizeCode(entry.code),
		);
		if (!explicitEnrollment) {
			const academicYearId = state.academicYears.get(klass.academicYearCode);
			if (academicYearId) {
				const enrollmentExists = await db.query.enrollments.findFirst({
					where: and(
						eq(schema.enrollments.studentId, student.id),
						eq(schema.enrollments.classId, klass.id),
						eq(schema.enrollments.academicYearId, academicYearId),
					),
				});
				if (!enrollmentExists) {
					await db.insert(schema.enrollments).values({
						studentId: student.id,
						classId: klass.id,
						academicYearId,
						status: "active",
						enrolledAt: now,
						institutionId: klass.institutionId,
						admissionType: "normal",
						transferCredits: 0,
					});
				}
			}
		}
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
					institutionId: klass.institutionId,
					// Update admission fields if provided
					admissionType: entry.admissionType ?? existing.admissionType,
					transferInstitution:
						entry.transferInstitution ?? existing.transferInstitution,
					transferCredits: entry.transferCredits ?? existing.transferCredits,
					transferLevel: entry.transferLevel ?? existing.transferLevel,
					admissionJustification:
						entry.admissionJustification ?? existing.admissionJustification,
					admissionDate: entry.admissionDate
						? new Date(entry.admissionDate)
						: existing.admissionDate,
				})
				.where(eq(schema.enrollments.id, existing.id));
		} else {
			await db.insert(schema.enrollments).values({
				studentId: student.id,
				classId: klass.id,
				academicYearId,
				status: entry.status ?? "active",
				enrolledAt: now,
				institutionId: klass.institutionId,
				// External admission fields
				admissionType: entry.admissionType ?? "normal",
				transferInstitution: entry.transferInstitution ?? null,
				transferCredits: entry.transferCredits ?? 0,
				transferLevel: entry.transferLevel ?? null,
				admissionJustification: entry.admissionJustification ?? null,
				admissionDate: entry.admissionDate
					? new Date(entry.admissionDate)
					: null,
			});

			// Register transfer credits in student credit ledger if any
			if (entry.transferCredits && entry.transferCredits > 0) {
				await studentCreditLedgerService.applyDelta(
					student.id,
					academicYearId,
					0, // deltaProgress = 0 (transfer credits are already earned)
					entry.transferCredits, // deltaEarned
					60, // Default required credits (will be updated based on class requirements)
				);
			}
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
				institutionId: classRecord.institutionId,
			})
			.onConflictDoUpdate({
				target: schema.classCourses.code,
				set: {
					class: classRecord.id,
					course: courseRecord.id,
					teacher: teacher.id,
					semesterId,
					weeklyHours: entry.weeklyHours ?? 0,
					institutionId: classRecord.institutionId,
				},
			})
			.returning();
		state.classCourses.set(code, {
			id: classCourse.id,
			classId: classRecord.id,
			courseId: courseRecord.id,
			institutionId: classRecord.institutionId,
		});
	}
	if (toSeed.length) {
		logger.log(`[seed] • Class courses: ${toSeed.length}`);
	}
}

async function seedExams(
	db: typeof appDb,
	state: SeedState,
	logger: SeedLogger,
) {
	const toSeed = state.pendingExams.splice(0);
	if (!toSeed.length) return;
	for (const entry of toSeed) {
		const classCourse = state.classCourses.get(
			normalizeCode(entry.classCourseCode),
		);
		if (!classCourse) {
			throw new Error(
				`Unknown class course ${entry.classCourseCode} for exam ${entry.id}`,
			);
		}
		const scheduledBy = entry.scheduledByCode
			? resolveDomainUserId(state, entry.scheduledByCode, entry.id)
			: null;
		const validatedBy = entry.validatedByCode
			? resolveDomainUserId(state, entry.validatedByCode, entry.id)
			: null;
		const insertPayload = {
			id: entry.id,
			name: entry.name,
			type: entry.type,
			date: new Date(entry.date),
			percentage: entry.percentage,
			classCourse: classCourse.id,
			institutionId: classCourse.institutionId,
			status: entry.status ?? "draft",
			isLocked: entry.isLocked ?? false,
			scheduledBy,
			validatedBy,
			scheduledAt: entry.scheduledAt ? new Date(entry.scheduledAt) : null,
			validatedAt: entry.validatedAt ? new Date(entry.validatedAt) : null,
		};
		const updatePayload = { ...insertPayload };
		delete updatePayload.id;
		await db.insert(schema.exams).values(insertPayload).onConflictDoUpdate({
			target: schema.exams.id,
			set: updatePayload,
		});
	}
	logger.log(`[seed] • Exams: ${toSeed.length}`);
}

async function seedEnrollmentWindows(
	db: typeof appDb,
	state: SeedState,
	windows: EnrollmentWindowSeed[],
	logger: SeedLogger,
) {
	for (const entry of windows) {
		const classRecord = findClassRecord(
			state,
			entry.classCode,
			entry.academicYearCode,
		);
		if (!classRecord) {
			throw new Error(
				`Unknown class ${entry.classCode} for enrollment window seed`,
			);
		}
		const academicYearId = state.academicYears.get(
			normalizeCode(entry.academicYearCode),
		);
		if (!academicYearId) {
			throw new Error(
				`Unknown academic year ${entry.academicYearCode} for enrollment window`,
			);
		}
		const status = entry.status ?? "open";
		await db
			.insert(schema.enrollmentWindows)
			.values({
				classId: classRecord.id,
				academicYearId,
				status,
				openedAt: entry.openedAt ? new Date(entry.openedAt) : new Date(),
				closedAt: entry.closedAt ? new Date(entry.closedAt) : null,
			})
			.onConflictDoUpdate({
				target: [
					schema.enrollmentWindows.classId,
					schema.enrollmentWindows.academicYearId,
				],
				set: {
					status,
					openedAt: entry.openedAt ? new Date(entry.openedAt) : new Date(),
					closedAt: entry.closedAt ? new Date(entry.closedAt) : null,
				},
			});
	}
	if (windows.length) {
		logger.log(`[seed] • Enrollment windows: ${windows.length}`);
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

	function resolveDomainUserId(
		state: SeedState,
		code: string,
		context: string,
	) {
		const record = state.domainUsers.get(normalizeCode(code));
		if (!record) {
			throw new Error(
				`Unknown domain user code "${code}" referenced while seeding ${context}`,
			);
		}
		return record.id;
	}
	throw new Error(
		`Class ${classCode} exists for multiple academic years. Provide classAcademicYearCode to disambiguate.`,
	);
}
