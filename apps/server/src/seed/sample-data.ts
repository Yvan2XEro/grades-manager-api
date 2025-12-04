import { constants } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";
import type { AcademicsSeed, FoundationSeed, UsersSeed } from "./runner";

type ScaffoldOptions = {
	force?: boolean;
	logger?: Pick<Console, "log" | "error">;
};

const sampleFoundation: FoundationSeed = {
	meta: {
		version: "2024.12",
		generatedAt: "2024-12-05T00:00:00Z",
		dataset: "demo",
	},
	examTypes: [
		{ name: "CC", description: "Contrôle continu" },
		{ name: "TP", description: "Travaux pratiques" },
		{ name: "FINAL", description: "Examen final" },
	],
	faculties: [
		{
			code: "ENG",
			name: "Faculty of Engineering",
			description: "Engineering and technology programs",
		},
	],
	studyCycles: [
		{
			code: "BSC",
			name: "Bachelor Cycle",
			facultyCode: "ENG",
			description: "Three-year bachelor sequence",
			totalCreditsRequired: 180,
			durationYears: 3,
		},
	],
	cycleLevels: [
		{
			code: "L1",
			name: "Licence 1",
			orderIndex: 1,
			minCredits: 60,
			studyCycleCode: "BSC",
			facultyCode: "ENG",
		},
		{
			code: "L2",
			name: "Licence 2",
			orderIndex: 2,
			minCredits: 120,
			studyCycleCode: "BSC",
			facultyCode: "ENG",
		},
		{
			code: "L3",
			name: "Licence 3",
			orderIndex: 3,
			minCredits: 180,
			studyCycleCode: "BSC",
			facultyCode: "ENG",
		},
	],
	semesters: [
		{ code: "S1", name: "Semester 1", orderIndex: 1 },
		{ code: "S2", name: "Semester 2", orderIndex: 2 },
	],
	academicYears: [
		{
			code: "AY-2024",
			name: "2024-2025",
			startDate: "2024-09-02",
			endDate: "2025-06-30",
			isActive: true,
		},
		{
			code: "AY-2023",
			name: "2023-2024",
			startDate: "2023-09-04",
			endDate: "2024-06-28",
			isActive: false,
		},
	],
};

const sampleAcademics: AcademicsSeed = {
	meta: {
		version: "2024.12",
		generatedAt: "2024-12-05T00:05:00Z",
		dataset: "demo",
	},
	programs: [
		{
			code: "ENG-SWE-BSC",
			name: "Software Engineering Bachelor",
			slug: "software-engineering-bsc",
			description: "Three-year software engineering curriculum",
			facultyCode: "ENG",
		},
	],
	programOptions: [
		{
			programCode: "ENG-SWE-BSC",
			code: "CORE",
			name: "Core Curriculum",
			description: "Default option for first-year cohorts",
		},
		{
			programCode: "ENG-SWE-BSC",
			code: "AIS",
			name: "Intelligent Systems",
			description: "AI-focused track used later in the program",
		},
	],
	teachingUnits: [
		{
			programCode: "ENG-SWE-BSC",
			code: "ENG-FND",
			name: "Engineering Fundamentals",
			description: "Mathematics and general engineering",
			credits: 18,
			semester: "annual",
		},
		{
			programCode: "ENG-SWE-BSC",
			code: "ENG-SOF",
			name: "Software Foundations",
			description: "Programming and architecture",
			credits: 12,
			semester: "annual",
		},
	],
	courses: [
		{
			programCode: "ENG-SWE-BSC",
			teachingUnitCode: "ENG-FND",
			code: "ENG101",
			name: "Programming Fundamentals",
			hours: 45,
		},
		{
			programCode: "ENG-SWE-BSC",
			teachingUnitCode: "ENG-FND",
			code: "ENG102",
			name: "Discrete Mathematics",
			hours: 30,
		},
		{
			programCode: "ENG-SWE-BSC",
			teachingUnitCode: "ENG-SOF",
			code: "ENG201",
			name: "Software Architecture",
			hours: 40,
		},
	],
	classes: [
		{
			code: "ENG24-L1A",
			name: "Software Engineering L1 - Cohort A",
			programCode: "ENG-SWE-BSC",
			programOptionCode: "CORE",
			academicYearCode: "AY-2024",
			studyCycleCode: "BSC",
			cycleLevelCode: "L1",
			semesterCode: "S1",
		},
		{
			code: "ENG24-L1B",
			name: "Software Engineering L1 - Cohort B",
			programCode: "ENG-SWE-BSC",
			programOptionCode: "CORE",
			academicYearCode: "AY-2024",
			studyCycleCode: "BSC",
			cycleLevelCode: "L1",
			semesterCode: "S1",
		},
	],
	classCourses: [
		{
			code: "CC-ENG101-L1A",
			classCode: "ENG24-L1A",
			classAcademicYearCode: "AY-2024",
			courseCode: "ENG101",
			teacherCode: "TEACH-ALICE",
			semesterCode: "S1",
			weeklyHours: 4,
		},
		{
			code: "CC-ENG101-L1B",
			classCode: "ENG24-L1B",
			classAcademicYearCode: "AY-2024",
			courseCode: "ENG101",
			teacherCode: "TEACH-ALICE",
			semesterCode: "S1",
			weeklyHours: 4,
		},
		{
			code: "CC-ENG102-L1A",
			classCode: "ENG24-L1A",
			classAcademicYearCode: "AY-2024",
			courseCode: "ENG102",
			teacherCode: "TEACH-JAMAL",
			semesterCode: "S1",
			weeklyHours: 3,
		},
	],
};

const sampleUsers: UsersSeed = {
	meta: {
		version: "2024.12",
		generatedAt: "2024-12-05T00:10:00Z",
		dataset: "demo",
	},
	authUsers: [
		{
			code: "ADMIN-ROOT",
			email: "admin@example.com",
			name: "Admin Demo",
			password: "ChangeMe123!",
			role: "admin",
		},
		{
			code: "TEACH-ALICE",
			email: "alice.teacher@example.com",
			name: "Alice Nkom",
			password: "Password123!",
			role: "admin",
		},
		{
			code: "TEACH-JAMAL",
			email: "jamal.teacher@example.com",
			name: "Jamal Kouassi",
			password: "Password123!",
			role: "admin",
		},
		{
			code: "STUDENT-AMELIA",
			email: "amelia.student@example.com",
			name: "Amelia Tabe",
			password: "Password123!",
			role: "user",
		},
	],
	domainUsers: [
		{
			code: "ADMIN-ROOT",
			authUserCode: "ADMIN-ROOT",
			businessRole: "administrator",
			firstName: "Admin",
			lastName: "Demo",
			primaryEmail: "admin@example.com",
			status: "active",
		},
		{
			code: "TEACH-ALICE",
			authUserCode: "TEACH-ALICE",
			businessRole: "teacher",
			firstName: "Alice",
			lastName: "Nkom",
			primaryEmail: "alice.teacher@example.com",
			status: "active",
		},
		{
			code: "TEACH-JAMAL",
			authUserCode: "TEACH-JAMAL",
			businessRole: "teacher",
			firstName: "Jamal",
			lastName: "Kouassi",
			primaryEmail: "jamal.teacher@example.com",
			status: "active",
		},
		{
			code: "STUDENT-AMELIA",
			authUserCode: "STUDENT-AMELIA",
			businessRole: "student",
			firstName: "Amelia",
			lastName: "Tabe",
			primaryEmail: "amelia.student@example.com",
			status: "active",
		},
	],
	students: [
		{
			code: "STUDENT-AMELIA",
			domainUserCode: "STUDENT-AMELIA",
			classCode: "ENG24-L1A",
			classAcademicYearCode: "AY-2024",
			registrationNumber: "ENG24-0001",
		},
	],
	enrollments: [
		{
			studentCode: "STUDENT-AMELIA",
			classCode: "ENG24-L1A",
			classAcademicYearCode: "AY-2024",
			academicYearCode: "AY-2024",
			status: "active",
		},
	],
	studentCourseEnrollments: [
		{
			studentCode: "STUDENT-AMELIA",
			classCourseCode: "CC-ENG101-L1A",
			courseCode: "ENG101",
			sourceClassCode: "ENG24-L1A",
			sourceClassAcademicYearCode: "AY-2024",
			academicYearCode: "AY-2024",
			status: "active",
			attempt: 1,
			creditsAttempted: 6,
			creditsEarned: 0,
		},
	],
};

const sampleFiles = [
	{
		filename: "00-foundation.yaml",
		payload: sampleFoundation,
	},
	{
		filename: "10-academics.yaml",
		payload: sampleAcademics,
	},
	{
		filename: "20-users.yaml",
		payload: sampleUsers,
	},
];

export async function scaffoldSampleSeeds(
	baseDir: string,
	options: ScaffoldOptions = {},
) {
	const targetDir = path.isAbsolute(baseDir)
		? baseDir
		: path.resolve(process.cwd(), baseDir);
	await mkdir(targetDir, { recursive: true });
	for (const file of sampleFiles) {
		const filePath = path.join(targetDir, file.filename);
		if (!options.force) {
			try {
				await access(filePath, constants.F_OK);
				options.logger?.log(
					`[seed] Skipping existing ${file.filename} (use --force to overwrite).`,
				);
				continue;
			} catch {
				// file does not exist, fall through
			}
		}
		await writeFile(filePath, stringify(file.payload, { indent: 2 }));
		options.logger?.log(`[seed] Wrote ${filePath}`);
	}
	return targetDir;
}

export const sampleSeedFiles = sampleFiles;
