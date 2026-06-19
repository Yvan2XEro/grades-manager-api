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
// DOKPLOY_APP_IMAGE may include tag (e.g. ghcr.io/yvan2xero/tkams:dev).
// Split so individual instances can override the tag independently.
const _fullImage =
	process.env.DOKPLOY_APP_IMAGE ?? "ghcr.io/yvan2xero/tkams:latest";
const _colonIdx = _fullImage.lastIndexOf(":");
const APP_IMAGE_BASE =
	_colonIdx > 0 ? _fullImage.slice(0, _colonIdx) : _fullImage;
const DEFAULT_IMAGE_TAG =
	_colonIdx > 0 ? _fullImage.slice(_colonIdx + 1) : "latest";

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
	imageTag?: string;
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

/**
 * Phase 1 — Build and store seed YAML files.
 * Called immediately when the client submits the form, before admin approval.
 * For empty mode, this is a no-op.
 */
export async function prepareSeedData(
	input: ProvisionInput,
	payload: Payload,
): Promise<void> {
	const {
		requestId,
		orgName,
		subdomain,
		adminEmail,
		adminPassword,
		adminName,
		seedMode = "empty",
		seedFiles,
	} = input;

	if (seedMode === "empty") return;

	const seedToken = secret(24);
	let foundationYaml: string | undefined;
	let academicsYaml: string | undefined;
	let usersYaml: string | undefined;

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

/**
 * Phase 2 — Provision the instance on Dokploy.
 * Called when an admin approves the instance request.
 * Reads all required data from the Payload record.
 */
export async function deployToDokploy(
	requestId: string,
	payload: Payload,
): Promise<void> {
	const record = await payload.findByID({
		collection: "instance-requests",
		id: requestId,
	});

	const orgName = record.orgName;
	const subdomain = record.subdomain;
	const adminEmail = record.adminEmail;
	const adminPassword = (record.adminPasswordTemp as string | null) ?? "";
	const adminName = record.adminName ?? "";
	const institutionType =
		(record.institutionType as string | null) ?? "university";
	const country = (record.country as string | null) ?? "";
	const seedToken = record.seedToken as string | undefined;

	// Resolve image tag: global setting → env var default
	let imageTag = DEFAULT_IMAGE_TAG;
	try {
		const settings = await payload.findGlobal({ slug: "deploy-settings" });
		if (settings.defaultImageTag) imageTag = settings.defaultImageTag as string;
	} catch {
		// global not yet seeded — fall back to env default
	}
	const dockerImage = `${APP_IMAGE_BASE}:${imageTag}`;

	try {
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { status: "provisioning", progressStep: 0 },
		});

		// Step 1 — Create Dokploy project
		const { projectId, environmentId } = await dokploy.createProject(
			orgName,
			`TKAMS — ${orgName}`,
		);
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { progressStep: 1, dokployProjectId: projectId },
		});

		// Step 2 — Create PostgreSQL database
		const dbPassword = secret(24);
		const postgres = await dokploy.createPostgres({
			name: `${orgName} DB`,
			appName: `${subdomain}-db`,
			databaseName: "tkams",
			databaseUser: "tkams",
			databasePassword: dbPassword,
			environmentId,
		});
		const databaseUrl = `postgresql://tkams:${dbPassword}@${postgres.appName}:5432/tkams`;
		await dokploy.deployPostgres(postgres.postgresId);
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
			dockerImage,
		});
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: { progressStep: 3, dokployAppId: app.applicationId, imageTag },
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
			`DATABASE_HOST=${postgres.appName}`,
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

		// Clear temp password now that it's been passed to Dokploy env vars
		await payload.update({
			collection: "instance-requests",
			id: requestId,
			data: {
				status: "ready",
				progressStep: 5,
				instanceUrl,
				adminPasswordTemp: null,
			},
		});

		await payload
			.create({
				collection: "instance-events",
				data: {
					instance: requestId,
					eventType: "provisioned",
					actorEmail: "system",
				},
			})
			.catch(console.error);
	} catch (err) {
		await fail(
			payload,
			requestId,
			err instanceof Error ? err.message : String(err),
		);
		await payload
			.create({
				collection: "instance-events",
				data: {
					instance: requestId,
					eventType: "failed",
					actorEmail: "system",
				},
			})
			.catch(console.error);
	}
}

/**
 * Convenience wrapper — runs both phases in sequence.
 * Used for direct provisioning without the approval flow (e.g. admin bypass).
 */
export async function provisionInstance(input: ProvisionInput): Promise<void> {
	const payload = await getPayload({ config: configPromise });
	await prepareSeedData(input, payload);
	await deployToDokploy(input.requestId, payload);
}
