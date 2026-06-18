import { randomBytes } from "node:crypto";
import configPromise from "@payload-config";
import type { Payload } from "payload";
import { getPayload } from "payload";
import type { FileData } from "@/marketing/SeedUploadStep";
import {
	buildDemoAcademicsYaml,
	buildDemoFoundationYaml,
	buildDemoUsersYaml,
} from "./demo-seed";
import { dokploy } from "./dokploy";
import type { ParseResult } from "./seed-templates";
import {
	buildAcademicsYaml,
	buildFoundationYaml,
	buildUsersYaml,
} from "./seed-templates";

const BASE_DOMAIN = process.env.TKAMS_BASE_DOMAIN ?? "tkams.com";
const WEBSITE_URL = process.env.WEBSITE_URL ?? "https://tkams.com";
const APP_IMAGE =
	process.env.DOKPLOY_APP_IMAGE ?? "ghcr.io/yvan2xero/tkams:latest";

const secret = (bytes = 32) => randomBytes(bytes).toString("hex");

export type SeedMode = "empty" | "demo" | "custom";

export type ProvisionInput = {
	requestId: string;
	orgName: string;
	subdomain: string;
	institutionType: string;
	country: string;
	adminName: string;
	adminEmail: string;
	adminPassword: string;
	seedMode?: SeedMode;
	seedFiles?: FileData[];
};

function fileToParseResult(file: FileData): ParseResult {
	return {
		sheets: file.sheets.map((s) => ({ ...s, headers: [] })),
		errors: [],
	};
}

async function step(payload: Payload, requestId: string, progressStep: number) {
	await payload.update({
		collection: "instance-requests",
		id: requestId,
		data: { progressStep },
	});
}

async function fail(payload: Payload, requestId: string, errorMessage: string) {
	await payload.update({
		collection: "instance-requests",
		id: requestId,
		data: { status: "failed", errorMessage },
	});
}

export async function provisionInstance(input: ProvisionInput) {
	const {
		requestId,
		orgName,
		subdomain,
		adminEmail,
		adminPassword,
		adminName,
		institutionType,
		country,
		seedMode = "empty",
		seedFiles,
	} = input;
	const payload = await getPayload({ config: configPromise });

	try {
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { status: "provisioning", progressStep: 0 },
		});

		// Build and store seed YAMLs before deploy — container downloads them on first boot.
		// empty mode: no YAMLs, no SEED_*_URL env vars (instance boots blank with just the admin)
		// demo mode: static fixture YAMLs (3 teachers, 4 programs, 2 faculties)
		// custom mode: user-uploaded Excel files converted to YAML
		let seedToken: string | undefined;
		let foundationYaml: string | undefined;
		let academicsYaml: string | undefined;
		let usersYaml: string | undefined;

		if (seedMode !== "empty") {
			seedToken = secret(24);

			if (seedMode === "demo") {
				foundationYaml = buildDemoFoundationYaml(subdomain, orgName);
				academicsYaml = buildDemoAcademicsYaml(subdomain);
				usersYaml = buildDemoUsersYaml(
					subdomain,
					adminEmail,
					adminName,
					adminPassword,
				);
			} else {
				const seedBase = {
					orgName,
					orgSlug: subdomain,
					adminEmail,
					adminName,
					adminPassword,
					structure: seedFiles?.find((f) => f.type === "structure")
						? fileToParseResult(seedFiles.find((f) => f.type === "structure")!)
						: undefined,
					programmes: seedFiles?.find((f) => f.type === "programmes")
						? fileToParseResult(seedFiles.find((f) => f.type === "programmes")!)
						: undefined,
					equipe: seedFiles?.find((f) => f.type === "equipe")
						? fileToParseResult(seedFiles.find((f) => f.type === "equipe")!)
						: undefined,
				};
				foundationYaml = buildFoundationYaml(seedBase);
				academicsYaml = buildAcademicsYaml(seedBase);
				usersYaml = buildUsersYaml(seedBase);
			}

			await payload.update({
				collection: "instance-requests",
				id: requestId,
				data: {
					seedToken,
					seedFoundationYaml: foundationYaml,
					seedAcademicsYaml: academicsYaml,
					seedUsersYaml: usersYaml,
				},
			});
		}

		// Step 1 — Create Dokploy project
		const project = await dokploy.createProject(orgName, `TKAMS — ${orgName}`);
		const projectFull = await dokploy.getProject(project.projectId);
		const environmentId = projectFull.environments?.[0]?.environmentId;
		if (!environmentId)
			throw new Error("No environment found on created project");
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { progressStep: 1, dokployProjectId: project.projectId },
		});

		// Step 2 — Create PostgreSQL database
		const dbPassword = secret(24);
		const pgAppName = `${subdomain}-db`;
		const postgres = await dokploy.createPostgres({
			name: `${orgName} DB`,
			appName: pgAppName,
			databaseName: "tkams",
			databaseUser: "tkams",
			databasePassword: dbPassword,
			environmentId,
		});
		const databaseUrl = `postgresql://tkams:${dbPassword}@${postgres.appName ?? pgAppName}:5432/tkams`;
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { progressStep: 2, dokployPostgresId: postgres.postgresId },
		});

		// Step 3 — Create application and set Docker image
		const app = await dokploy.createApplication({
			name: orgName,
			appName: subdomain,
			environmentId,
		});
		await dokploy.saveDockerProvider({
			applicationId: app.applicationId,
			dockerImage: APP_IMAGE,
		});
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { progressStep: 3, dokployAppId: app.applicationId },
		});

		// Step 4 — Configure environment variables
		const instanceUrl = `https://${subdomain}.${BASE_DOMAIN}`;
		const authSecret = secret();
		const seedEndpoint = `${WEBSITE_URL}/api/provision/${requestId}/seed`;
		const seedEnvLines = seedToken
			? [
					`SEED_FOUNDATION_URL=${seedEndpoint}/foundation?token=${seedToken}`,
					`SEED_ACADEMICS_URL=${seedEndpoint}/academics?token=${seedToken}`,
					`SEED_USERS_URL=${seedEndpoint}/users?token=${seedToken}`,
				]
			: [];
		const env = [
			`DATABASE_URL=${databaseUrl}`,
			`DATABASE_HOST=${pgAppName}`,
			"POSTGRES_USER=tkams",
			`BETTER_AUTH_SECRET=${authSecret}`,
			`BETTER_AUTH_URL=${instanceUrl}`,
			`CORS_ORIGINS=${instanceUrl}`,
			"PORT=3000",
			"NODE_ENV=production",
			`SERVER_PUBLIC_URL=${instanceUrl}`,
			"SERVE_FRONTEND=true",
			"RUN_SEED=true",
			`DEFAULT_ORGANIZATION_SLUG=${subdomain}`,
			`SEED_ORG_NAME=${orgName}`,
			`SEED_ORG_SLUG=${subdomain}`,
			`SEED_ORG_TYPE=${institutionType}`,
			`SEED_ORG_COUNTRY=${country}`,
			`SEED_ADMIN_NAME=${adminName}`,
			`SEED_ADMIN_EMAIL=${adminEmail}`,
			`SEED_ADMIN_PASSWORD=${adminPassword}`,
			...seedEnvLines,
		].join("\n");

		await dokploy.saveEnvironment({ applicationId: app.applicationId, env });

		// Configure domain + SSL
		await dokploy.createDomain({
			host: `${subdomain}.${BASE_DOMAIN}`,
			applicationId: app.applicationId,
			port: 3000,
			https: true,
			certificateType: "letsencrypt",
		});
		await step(payload, requestId, 4);

		// Step 5 — Deploy
		await dokploy.deploy(app.applicationId);

		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { status: "ready", progressStep: 5, instanceUrl },
		});
	} catch (err) {
		await fail(
			payload,
			requestId,
			err instanceof Error ? err.message : String(err),
		);
	}
}
