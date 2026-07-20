import * as yaml from "yaml";

export function buildDemoFoundationYaml(
	orgSlug: string,
	orgName: string,
): string {
	return yaml.stringify({
		meta: {
			version: "2025",
			generatedAt: new Date().toISOString(),
			dataset: orgSlug,
		},
		organizations: [{ slug: orgSlug, name: orgName }],
		institutions: [
			{
				code: orgSlug.toUpperCase(),
				organizationSlug: orgSlug,
				nameFr: orgName,
				nameEn: orgName,
				shortName: orgSlug.toUpperCase().slice(0, 10),
				isDefault: true,
			},
		],
		examTypes: [
			{ name: "CC", description: "Contrôle Continu", defaultPercentage: 40 },
			{ name: "FINAL", description: "Examen Final", defaultPercentage: 60 },
		],
		faculties: [
			{
				code: "SCI",
				name: "Faculté des Sciences et Technologies",
				description: "Sciences, Informatique, Génie",
			},
			{
				code: "GES",
				name: "Faculté des Sciences de Gestion",
				description: "Économie, Finance, Commerce",
			},
		],
		studyCycles: [
			{
				code: "LIC-SCI",
				name: "Licence",
				facultyCode: "SCI",
				durationYears: 3,
				totalCreditsRequired: 180,
			},
			{
				code: "BTS-INFO",
				name: "BTS Informatique",
				facultyCode: "SCI",
				durationYears: 2,
				totalCreditsRequired: 120,
			},
			{
				code: "BTS-GES",
				name: "BTS Gestion",
				facultyCode: "GES",
				durationYears: 2,
				totalCreditsRequired: 120,
			},
		],
	});
}

export function buildDemoAcademicsYaml(orgSlug: string): string {
	return yaml.stringify({
		meta: {
			version: "2025",
			generatedAt: new Date().toISOString(),
			dataset: orgSlug,
		},
		programs: [
			{
				code: "GINF",
				nameFr: "Génie Informatique",
				studyCycleCode: "LIC-SCI",
				facultyCode: "SCI",
				durationYears: 3,
				totalCredits: 180,
			},
			{
				code: "RESIN",
				nameFr: "Réseaux et Sécurité Informatique",
				studyCycleCode: "BTS-INFO",
				facultyCode: "SCI",
				durationYears: 2,
				totalCredits: 120,
			},
			{
				code: "COMPTA",
				nameFr: "Comptabilité et Finance",
				studyCycleCode: "BTS-GES",
				facultyCode: "GES",
				durationYears: 2,
				totalCredits: 120,
			},
			{
				code: "MKT",
				nameFr: "Marketing et Commerce",
				studyCycleCode: "BTS-GES",
				facultyCode: "GES",
				durationYears: 2,
				totalCredits: 120,
			},
		],
	});
}

export function buildDemoUsersYaml(
	orgSlug: string,
	adminEmail: string,
	adminName: string,
	adminPassword: string,
): string {
	const teachers = [
		{
			code: "TEACH-001",
			email: `prof.dupont@${orgSlug}.demo`,
			lastName: "Dupont",
			firstName: "Jean",
			role: "teacher",
		},
		{
			code: "TEACH-002",
			email: `prof.ngo@${orgSlug}.demo`,
			lastName: "Ngo",
			firstName: "Marie",
			role: "teacher",
		},
		{
			code: "TEACH-003",
			email: `prof.mbarga@${orgSlug}.demo`,
			lastName: "Mbarga",
			firstName: "Paul",
			role: "teacher",
		},
	];

	return yaml.stringify({
		meta: {
			version: "2025",
			generatedAt: new Date().toISOString(),
			dataset: orgSlug,
		},
		authUsers: [
			{
				code: "ADMIN-ROOT",
				email: adminEmail,
				name: adminName,
				password: adminPassword,
				role: "admin",
			},
			...teachers.map((t) => ({
				code: t.code,
				email: t.email,
				name: `${t.firstName} ${t.lastName}`,
				password: "Teacher@2026",
				role: "user",
			})),
		],
		domainUsers: [
			{
				code: "DOMAIN-ROOT",
				authUserEmail: adminEmail,
				firstName: adminName.split(" ")[0] ?? adminName,
				lastName: adminName.split(" ").slice(1).join(" ") || adminName,
				primaryEmail: adminEmail,
				memberRole: "super_admin",
			},
			...teachers.map((t) => ({
				code: `DOMAIN-${t.code.split("-")[1]}`,
				authUserEmail: t.email,
				firstName: t.firstName,
				lastName: t.lastName,
				primaryEmail: t.email,
				memberRole: t.role,
			})),
		],
	});
}
