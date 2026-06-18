const DOKPLOY_URL = (process.env.DOKPLOY_URL ?? "").replace(/\/$/, "");
const DOKPLOY_API_KEY = process.env.DOKPLOY_API_KEY ?? "";

async function call<T>(
	endpoint: string,
	opts: { body?: unknown; params?: Record<string, string> } = {},
): Promise<T> {
	const { body, params } = opts;
	let url = `${DOKPLOY_URL}/api/${endpoint}`;
	if (params) url += `?${new URLSearchParams(params)}`;

	const res = await fetch(url, {
		method: body !== undefined ? "POST" : "GET",
		headers: {
			"x-api-key": DOKPLOY_API_KEY,
			"Content-Type": "application/json",
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
		cache: "no-store",
	});

	const text = await res.text();
	if (!res.ok) throw new Error(`Dokploy /${endpoint}: ${res.status} — ${text}`);
	return text ? JSON.parse(text) : ({} as T);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DokployProject = {
	projectId: string;
	name: string;
	environments: Array<{ environmentId: string; name: string }>;
};

export type DokployPostgres = {
	postgresId: string;
	appName: string;
	databaseUser: string;
	databasePassword: string;
	databaseName: string;
};

export type DokployApplication = {
	applicationId: string;
	appName: string;
};

// ─── Client ───────────────────────────────────────────────────────────────────

export const dokploy = {
	createProject: (name: string, description?: string) =>
		call<DokployProject>("project.create", { body: { name, description } }),

	getProject: (projectId: string) =>
		call<DokployProject>("project.one", { params: { projectId } }),

	createPostgres: (body: {
		name: string;
		appName: string;
		databaseName: string;
		databaseUser: string;
		databasePassword: string;
		environmentId: string;
	}) => call<DokployPostgres>("postgres.create", { body }),

	createApplication: (body: {
		name: string;
		appName: string;
		environmentId: string;
	}) => call<DokployApplication>("application.create", { body }),

	saveDockerProvider: (body: {
		applicationId: string;
		dockerImage: string;
		username?: string | null;
		password?: string | null;
		registryUrl?: string | null;
	}) =>
		call<void>("application.saveDockerProvider", {
			body: { username: null, password: null, registryUrl: null, ...body },
		}),

	saveEnvironment: (body: {
		applicationId: string;
		env: string;
		buildArgs?: string | null;
		buildSecrets?: string | null;
		createEnvFile?: boolean;
	}) =>
		call<void>("application.saveEnvironment", {
			body: {
				buildArgs: null,
				buildSecrets: null,
				createEnvFile: false,
				...body,
			},
		}),

	createDomain: (body: {
		host: string;
		applicationId: string;
		port?: number;
		https?: boolean;
		certificateType?: "letsencrypt" | "none" | "custom";
		path?: string;
	}) => call<void>("domain.create", { body }),

	deploy: (applicationId: string) =>
		call<void>("application.redeploy", { body: { applicationId } }),

	getApplicationStatus: (appName: string) =>
		call<{ appStatus?: string }>("application.readAppMonitoring", {
			params: { appName },
		}),

	stopApplication: (applicationId: string) =>
		call<void>("application.stop", { body: { applicationId } }),

	startApplication: (applicationId: string) =>
		call<void>("application.start", { body: { applicationId } }),

	deleteApplication: (applicationId: string) =>
		call<void>("application.delete", {
			body: { applicationId, deleteVolumes: false },
		}),

	deletePostgres: (postgresId: string) =>
		call<void>("postgres.remove", {
			body: { postgresId, deleteVolumes: false },
		}),

	deleteProject: (projectId: string) =>
		call<void>("project.delete", { body: { projectId } }),
};
