import { trpcServer } from "@hono/trpc-server";
import "dotenv/config";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";
import * as schema from "./db/schema/app-schema";
import {
	type DiplomationApiKey,
	diplomationDocuments,
	institutions,
} from "./db/schema/app-schema";
import { organization } from "./db/schema/auth";
import { apiKeyMiddleware } from "./lib/api-key-auth";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { startBackgroundJobs } from "./lib/jobs";
import { exportDiplomation } from "./modules/deliberations/deliberations.service";
import { buildTranscriptExport } from "./modules/exports/transcript-export.service";
import { appRouter } from "./routers/index";

const app = new Hono();

app.use(logger());
app.use("/static/*", serveStatic({ root: "./" }));
if ((process.env.STORAGE_DRIVER ?? "local") === "local") {
	const uploadsPath = process.env.STORAGE_LOCAL_PUBLIC_PATH ?? "/uploads";
	const uploadsRoot = process.env.STORAGE_LOCAL_ROOT ?? "./storage/uploads";
	app.use(
		`${uploadsPath}/*`,
		serveStatic({
			root: uploadsRoot,
			rewriteRequestPath: (path) =>
				path.replace(new RegExp(`^${uploadsPath}`), ""),
		}),
	);
}
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGINS?.split(",") || [],
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"X-Organization-Slug",
			"X-Api-Key",
		],
		credentials: true,
	}),
);

app.get("/api/public/branding/:slug", async (c) => {
	const slug = c.req.param("slug");
	const [result] = await db
		.select({
			slug: organization.slug,
			nameFr: institutions.nameFr,
			nameEn: institutions.nameEn,
			shortName: institutions.shortName,
			sloganFr: institutions.sloganFr,
			sloganEn: institutions.sloganEn,
			logoUrl: institutions.logoUrl,
			coverImageUrl: institutions.coverImageUrl,
			contactEmail: institutions.contactEmail,
			website: institutions.website,
		})
		.from(organization)
		.innerJoin(institutions, eq(institutions.organizationId, organization.id))
		.where(eq(organization.slug, slug))
		.limit(1);
	if (!result) {
		return c.json({ error: "Organization or institution not found" }, 404);
	}
	return c.json(result);
});

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);
app.get("/", (c) => {
	return c.text("OK");
});

// ---------------------------------------------------------------------------
// Diplomation REST API
// ---------------------------------------------------------------------------

type DiplomationVars = { apiKeyRecord: DiplomationApiKey };
const diplomationApi = new Hono<{ Variables: DiplomationVars }>();

// Permissive CORS for diplomation routes — secured by X-Api-Key, not by origin.
// Needed for Electron dev (localhost:5173) and any LAN client IP.
diplomationApi.use(
	"/*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "X-Api-Key"],
		credentials: false,
	}),
);
diplomationApi.use("/*", apiKeyMiddleware);

diplomationApi.get("/deliberations", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const { status } = c.req.query();
	const rows = await db.query.deliberations.findMany({
		where: and(
			eq(schema.deliberations.institutionId, apiKey.institutionId),
			status ? eq(schema.deliberations.status, status as any) : undefined,
		),
		with: {
			classRef: { with: { program: true } },
			academicYear: true,
		},
		orderBy: [desc(schema.deliberations.createdAt)],
		limit: 100,
	});
	return c.json(rows);
});

diplomationApi.get("/deliberations/:id", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const id = c.req.param("id");
	try {
		const data = await exportDiplomation(
			{ id },
			apiKey.institutionId,
			"system",
		);
		return c.json(data);
	} catch (err: any) {
		if (err?.code === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
		return c.json({ error: err?.message ?? "Error" }, 500);
	}
});

diplomationApi.get("/deliberations/:id/status", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const id = c.req.param("id");
	const delib = await db.query.deliberations.findFirst({
		where: and(
			eq(schema.deliberations.id, id),
			eq(schema.deliberations.institutionId, apiKey.institutionId),
		),
		columns: { id: true, status: true, type: true, signedAt: true },
	});
	if (!delib) return c.json({ error: "Not found" }, 404);
	return c.json(delib);
});

// Transcripts by deliberation ID (resolves classId internally)
diplomationApi.get("/deliberations/:id/transcript", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const id = c.req.param("id");
	const delib = await db.query.deliberations.findFirst({
		where: and(
			eq(schema.deliberations.id, id),
			eq(schema.deliberations.institutionId, apiKey.institutionId),
		),
		columns: { classId: true },
	});
	if (!delib) return c.json({ error: "Not found" }, 404);
	try {
		const data = await buildTranscriptExport(
			delib.classId,
			apiKey.institutionId,
		);
		return c.json(data);
	} catch (err: any) {
		if (err?.code === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
		return c.json({ error: err?.message ?? "Error" }, 500);
	}
});

diplomationApi.get("/transcripts/class/:classId", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const classId = c.req.param("classId");
	try {
		const data = await buildTranscriptExport(classId, apiKey.institutionId);
		return c.json(data);
	} catch (err: any) {
		if (err?.code === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
		return c.json({ error: err?.message ?? "Error" }, 500);
	}
});

// Full config snapshot for DIPLOMATION auto-setup
diplomationApi.get("/config", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const institutionId = apiKey.institutionId;

	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
	});
	if (!institution) return c.json({ error: "Institution not found" }, 404);

	const docParams = (institution.metadata as schema.InstitutionMetadata)
		?.document_params;

	const programs = await db.query.programs.findMany({
		where: eq(schema.programs.institutionId, institutionId),
		columns: {
			id: true,
			name: true,
			code: true,
			diplomaTitleFr: true,
			diplomaTitleEn: true,
			attestationValidityFr: true,
			attestationValidityEn: true,
		},
	});

	const academicYears = await db.query.academicYears.findMany({
		where: eq(schema.academicYears.institutionId, institutionId),
		columns: {
			id: true,
			name: true,
			startDate: true,
			endDate: true,
			isActive: true,
		},
		orderBy: [desc(schema.academicYears.startDate)],
	});

	return c.json({
		institution: {
			nameFr: institution.nameFr,
			nameEn: institution.nameEn,
			shortName: institution.shortName,
			code: institution.code,
			logoUrl: institution.logoUrl,
			sloganFr: institution.sloganFr,
			address: institution.addressFr,
			contactEmail: institution.contactEmail,
			website: institution.website,
			signatoryName: docParams?.signatoryName ?? null,
			signatoryTitle: docParams?.signatoryTitle ?? null,
			city: docParams?.city ?? null,
		},
		programs,
		academicYears,
	});
});

// Active classes list for AcademicConfig auto-creation in DIPLOMATION
diplomationApi.get("/classes", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const institutionId = apiKey.institutionId;

	const classes = await db.query.classes.findMany({
		where: eq(schema.classes.institutionId, institutionId),
		with: {
			program: { columns: { id: true, name: true, code: true } },
			cycleLevel: {
				columns: { name: true },
				with: { cycle: { columns: { name: true } } },
			},
			academicYear: { columns: { id: true, name: true, isActive: true } },
			semester: { columns: { id: true, name: true, code: true } },
		},
		orderBy: [desc(schema.classes.createdAt)],
		limit: 200,
	});

	return c.json(
		(classes as any[]).map((cls) => ({
			id: cls.id,
			name: cls.name,
			programId: cls.program?.id ?? null,
			programName: cls.program?.name ?? null,
			programCode: cls.program?.code ?? null,
			cycle: cls.cycleLevel?.cycle?.name ?? null,
			level: cls.cycleLevel?.name ?? null,
			academicYearId: cls.academicYear?.id ?? null,
			academicYearName: cls.academicYear?.name ?? null,
			isActiveYear: cls.academicYear?.isActive ?? false,
			semesterName: cls.semester?.name ?? null,
			semesterCode: cls.semester?.code ?? null,
		})),
	);
});

diplomationApi.post("/documents", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const body = await c.req.json();
	await db.insert(diplomationDocuments).values({
		institutionId: apiKey.institutionId,
		sourceId: body.sourceId,
		documentType: body.documentType,
		studentId: body.studentId ?? null,
		generatedAt: new Date(body.generatedAt ?? Date.now()),
		fileReference: body.fileReference ?? null,
		generatedByApiKeyId: apiKey.id,
	});
	return c.json({ ok: true });
});

app.route("/api/diplomation", diplomationApi);

const cleanupJobs = await startBackgroundJobs();

// Graceful shutdown
process.on("SIGTERM", async () => {
	await cleanupJobs();
	process.exit(0);
});

export default app;
