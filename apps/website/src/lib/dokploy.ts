import {
	applicationCreate,
	applicationDelete,
	applicationReadAppMonitoring,
	applicationRedeploy,
	applicationSaveDockerProvider,
	applicationSaveEnvironment,
	applicationStart,
	applicationStop,
	client,
	domainCreate,
	environmentByProjectId,
	postgresCreate,
	postgresRemove,
	projectCreate,
	projectRemove,
} from "@dokploy/sdk";

function configure() {
	const url = (process.env.DOKPLOY_URL ?? "").replace(/\/$/, "");
	client.setConfig({
		baseUrl: `${url}/api`,
		headers: { "x-api-key": process.env.DOKPLOY_API_KEY ?? "" },
	});
}

function unwrap<T>(result: { data?: T; error?: unknown }): T {
	if (result.error) throw result.error;
	return result.data as T;
}

export const dokploy = {
	async createProject(name: string, description?: string) {
		configure();
		return unwrap(await projectCreate({ body: { name, description } }));
	},

	async getEnvironmentId(projectId: string): Promise<string> {
		configure();
		const envs = unwrap(await environmentByProjectId({ query: { projectId } }));
		const env = Array.isArray(envs)
			? (envs.find((e: { isDefault?: boolean }) => e.isDefault) ?? envs[0])
			: null;
		if (!env?.environmentId)
			throw new Error("No environment found on created project");
		return env.environmentId as string;
	},

	async createPostgres(body: {
		name: string;
		appName: string;
		databaseName: string;
		databaseUser: string;
		databasePassword: string;
		environmentId: string;
	}) {
		configure();
		return unwrap(await postgresCreate({ body }));
	},

	async createApplication(body: {
		name: string;
		appName: string;
		environmentId: string;
	}) {
		configure();
		return unwrap(await applicationCreate({ body }));
	},

	async saveDockerProvider(body: {
		applicationId: string;
		dockerImage: string;
		username?: string | null;
		password?: string | null;
		registryUrl?: string | null;
	}) {
		configure();
		return unwrap(
			await applicationSaveDockerProvider({
				body: {
					username: null,
					password: null,
					registryUrl: null,
					...body,
					dockerImage: body.dockerImage ?? null,
				},
			}),
		);
	},

	async saveEnvironment(body: { applicationId: string; env: string }) {
		configure();
		return unwrap(
			await applicationSaveEnvironment({
				body: {
					buildArgs: null,
					buildSecrets: null,
					createEnvFile: false,
					...body,
				},
			}),
		);
	},

	async createDomain(body: {
		host: string;
		applicationId: string;
		port?: number;
		https?: boolean;
		certificateType?: "letsencrypt" | "none" | "custom";
	}) {
		configure();
		return unwrap(await domainCreate({ body }));
	},

	async deploy(applicationId: string) {
		configure();
		return unwrap(await applicationRedeploy({ body: { applicationId } }));
	},

	async getApplicationStatus(appName: string) {
		configure();
		return unwrap(await applicationReadAppMonitoring({ query: { appName } }));
	},

	async stopApplication(applicationId: string) {
		configure();
		return unwrap(await applicationStop({ body: { applicationId } }));
	},

	async startApplication(applicationId: string) {
		configure();
		return unwrap(await applicationStart({ body: { applicationId } }));
	},

	async deleteApplication(applicationId: string) {
		configure();
		return unwrap(await applicationDelete({ body: { applicationId } }));
	},

	async deletePostgres(postgresId: string) {
		configure();
		return unwrap(await postgresRemove({ body: { postgresId } }));
	},

	async deleteProject(projectId: string) {
		configure();
		return unwrap(await projectRemove({ body: { projectId } }));
	},
};
