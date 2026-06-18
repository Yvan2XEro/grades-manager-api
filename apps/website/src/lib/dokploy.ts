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
	postgresCreate,
	postgresDeploy,
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
	if (result.error) {
		const err = result.error as { message?: string };
		throw new Error(err?.message ?? JSON.stringify(result.error));
	}
	return result.data as T;
}

export type CreatedProject = {
	projectId: string;
	environmentId: string;
};

export type CreatedPostgres = {
	postgresId: string;
	appName: string;
};

export type CreatedApplication = {
	applicationId: string;
	appName: string;
};

export const dokploy = {
	async createProject(
		name: string,
		description?: string,
	): Promise<CreatedProject> {
		configure();
		const res = unwrap(
			await projectCreate({ body: { name, description } }),
		) as unknown as {
			project: { projectId: string };
			environment: { environmentId: string };
		};
		return {
			projectId: res.project.projectId,
			environmentId: res.environment.environmentId,
		};
	},

	async createPostgres(body: {
		name: string;
		appName: string;
		databaseName: string;
		databaseUser: string;
		databasePassword: string;
		environmentId: string;
	}): Promise<CreatedPostgres> {
		configure();
		const res = unwrap(await postgresCreate({ body })) as unknown as {
			postgresId: string;
			appName: string;
		};
		return { postgresId: res.postgresId, appName: res.appName };
	},

	async createApplication(body: {
		name: string;
		appName: string;
		environmentId: string;
	}): Promise<CreatedApplication> {
		configure();
		const res = unwrap(await applicationCreate({ body })) as unknown as {
			applicationId: string;
			appName: string;
		};
		return { applicationId: res.applicationId, appName: res.appName };
	},

	async saveDockerProvider(body: {
		applicationId: string;
		dockerImage: string;
		username?: string | null;
		password?: string | null;
		registryUrl?: string | null;
	}) {
		configure();
		unwrap(
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
		unwrap(
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
		unwrap(await domainCreate({ body }));
	},

	async deploy(applicationId: string) {
		configure();
		unwrap(await applicationRedeploy({ body: { applicationId } }));
	},

	async getApplicationStatus(appName: string) {
		configure();
		return unwrap(
			await applicationReadAppMonitoring({ query: { appName } }),
		) as {
			appStatus?: string;
		};
	},

	async stopApplication(applicationId: string) {
		configure();
		unwrap(await applicationStop({ body: { applicationId } }));
	},

	async startApplication(applicationId: string) {
		configure();
		unwrap(await applicationStart({ body: { applicationId } }));
	},

	async deleteApplication(applicationId: string) {
		configure();
		unwrap(await applicationDelete({ body: { applicationId } }));
	},

	async deployPostgres(postgresId: string) {
		configure();
		unwrap(await postgresDeploy({ body: { postgresId } }));
	},

	async deletePostgres(postgresId: string) {
		configure();
		unwrap(await postgresRemove({ body: { postgresId } }));
	},

	async deleteProject(projectId: string) {
		configure();
		unwrap(await projectRemove({ body: { projectId } }));
	},
};
