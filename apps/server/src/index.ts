import { trpcServer } from "@hono/trpc-server";
import "dotenv/config";
import { and, desc, eq, gt } from "drizzle-orm";
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
// Permissive CORS for diplomation routes — must be registered before the
// general "/*" middleware so the parent app doesn't block preflight requests.
app.use(
	"/api/diplomation/*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "X-Api-Key"],
		credentials: false,
	}),
);

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
// Needed for Electron dev (localhost:5174) and any LAN client IP.
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
	const { status, cursor, limit: limitStr, academicYearId } = c.req.query();
	const limit = Math.min(Number(limitStr) || 50, 200);
	const rows = await db.query.deliberations.findMany({
		where: and(
			eq(schema.deliberations.institutionId, apiKey.institutionId),
			status ? eq(schema.deliberations.status, status as any) : undefined,
			academicYearId
				? eq(schema.deliberations.academicYearId, academicYearId)
				: undefined,
			cursor ? gt(schema.deliberations.id, cursor) : undefined,
		),
		with: {
			classRef: { with: { program: true } },
			academicYear: true,
		},
		orderBy: [desc(schema.deliberations.createdAt)],
		limit,
	});
	const nextCursor =
		rows.length === limit ? rows[rows.length - 1].id : undefined;
	return c.json({ items: rows, nextCursor });
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
	// semesterKey = "S1" | "S2" | null — filters courses by teachingUnit.semester
	const semesterKey = c.req.query("semesterKey") ?? null;
	try {
		const data = await buildTranscriptExport(
			classId,
			apiKey.institutionId,
			semesterKey,
		);
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

	// Resolve parent and grandparent institutions for logo hierarchy
	const parentCols = {
		id: true,
		nameFr: true,
		nameEn: true,
		shortName: true,
		abbreviation: true,
		logoUrl: true,
		type: true,
		parentInstitutionId: true,
		postalBox: true,
		contactEmail: true,
	} as const;

	let parentInstitution: typeof parentCols extends infer T
		? { [K in keyof T]: any }
		: never | null = null;
	let grandParentInstitution: {
		logoUrl: string | null;
		nameFr: string;
		nameEn: string;
		shortName?: string | null;
		abbreviation?: string | null;
	} | null = null;

	if (institution.parentInstitutionId) {
		parentInstitution =
			(await db.query.institutions.findFirst({
				where: eq(schema.institutions.id, institution.parentInstitutionId),
				columns: parentCols,
			})) ?? null;

		if (parentInstitution?.parentInstitutionId) {
			grandParentInstitution =
				(await db.query.institutions.findFirst({
					where: eq(
						schema.institutions.id,
						parentInstitution.parentInstitutionId,
					),
					columns: {
						logoUrl: true,
						nameFr: true,
						nameEn: true,
						shortName: true,
						abbreviation: true,
					},
				})) ?? null;
		}
	}

	const programs = await db.query.programs.findMany({
		where: eq(schema.programs.institutionId, institutionId),
		columns: {
			id: true,
			name: true,
			nameEn: true,
			code: true,
			abbreviation: true,
			domainFr: true,
			domainEn: true,
			specialiteFr: true,
			specialiteEn: true,
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
			abbreviation: institution.abbreviation ?? null,
			code: institution.code,
			/** Type: "university" | "faculty" | "institution" */
			type: institution.type,
			logoUrl: institution.logoUrl,
			sloganFr: institution.sloganFr,
			address: institution.addressFr,
			postalBox: institution.postalBox ?? null,
			phone: institution.contactPhone ?? null,
			contactEmail: institution.contactEmail,
			website: institution.website,
			signatoryName: docParams?.signatoryName ?? null,
			signatoryTitle: docParams?.signatoryTitle ?? null,
			city: docParams?.city ?? null,
			/** Direct parent institution (e.g. faculty for an IPES) */
			parentLogoUrl: parentInstitution?.logoUrl ?? null,
			parentNameFr: parentInstitution?.nameFr ?? null,
			parentNameEn: parentInstitution?.nameEn ?? null,
			parentShortName: parentInstitution?.shortName ?? null,
			parentAbbreviation: parentInstitution?.abbreviation ?? null,
			parentPostalBox: parentInstitution?.postalBox ?? null,
			parentEmail: parentInstitution?.contactEmail ?? null,
			/** Grandparent institution (e.g. university for an IPES) */
			grandParentLogoUrl: grandParentInstitution?.logoUrl ?? null,
			grandParentNameFr: grandParentInstitution?.nameFr ?? null,
			grandParentNameEn: grandParentInstitution?.nameEn ?? null,
			grandParentShortName: grandParentInstitution?.shortName ?? null,
			grandParentAbbreviation: grandParentInstitution?.abbreviation ?? null,
		},
		programs,
		academicYears,
	});
});

// Active classes list for AcademicConfig auto-creation in DIPLOMATION.
// Returns one entry per class. The `semesterKeys` array lists which semester
// keys ("fall", "spring") exist in the class's course assignments so the
// client can fetch each semester's UE/EC structure separately and group them
// into one ClassConfig with multiple Semester entries.
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
			classCourses: {
				columns: {},
				with: {
					courseRef: {
						columns: {},
						with: { teachingUnit: { columns: { semester: true } } },
					},
				},
			},
		},
		orderBy: [desc(schema.classes.createdAt)],
		limit: 200,
	});

	const semesterOrder = ["fall", "spring"];

	return c.json(
		(classes as any[]).map((cls) => {
			// Collect distinct non-"annual" semester keys, sorted fall → spring
			const keys = new Set<string>();
			for (const cc of cls.classCourses ?? []) {
				const sem = cc.courseRef?.teachingUnit?.semester;
				if (sem && sem !== "annual") keys.add(sem);
			}
			const semesterKeys = [...keys].sort(
				(a, b) => semesterOrder.indexOf(a) - semesterOrder.indexOf(b),
			);

			return {
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
				// Available semester keys for this class (empty = all courses are "annual")
				semesterKeys,
			};
		}),
	);
});

/**
 * Resolve a logoUrl (relative path or full URL) and return its base64 data-URL.
 * Returns null if the file doesn't exist or the fetch fails.
 */
async function logoUrlToBase64(logoUrl: string): Promise<string | null> {
	try {
		let buffer: ArrayBuffer;
		let mimeType = "image/png";

		if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
			const res = await fetch(logoUrl);
			if (!res.ok) return null;
			buffer = await res.arrayBuffer();
			const ct = res.headers.get("content-type");
			if (ct) mimeType = ct.split(";")[0].trim();
		} else {
			const uploadsPublicPath =
				process.env.STORAGE_LOCAL_PUBLIC_PATH ?? "/uploads";
			const uploadsRoot = process.env.STORAGE_LOCAL_ROOT ?? "./storage/uploads";
			const relativePath = logoUrl.startsWith(uploadsPublicPath)
				? logoUrl.slice(uploadsPublicPath.length)
				: logoUrl;
			const filePath = `${uploadsRoot.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
			const file = Bun.file(filePath);
			if (!(await file.exists())) return null;
			buffer = await file.arrayBuffer();
			mimeType = file.type || "image/png";
		}

		const base64 = Buffer.from(buffer).toString("base64");
		return `data:${mimeType};base64,${base64}`;
	} catch {
		return null;
	}
}

/**
 * GET /api/diplomation/logo?level=self|parent|grandparent
 *
 * Returns the institution logo (or a parent's logo) as a base64 data-URL.
 * Bypasses CORS issues with /uploads/* static files in the Electron client.
 *
 * level:
 *   - "self"        → own logo (default)
 *   - "parent"      → direct parent institution's logo (faculty for an IPES)
 *   - "grandparent" → grandparent institution's logo (university for an IPES)
 */
diplomationApi.get("/logo", async (c) => {
	const apiKey = c.get("apiKeyRecord") as any;
	const { level = "self" } = c.req.query();

	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, apiKey.institutionId),
		columns: { logoUrl: true, parentInstitutionId: true },
	});
	if (!institution) return c.json({ base64: null });

	// Resolve the target logoUrl based on level
	let targetLogoUrl: string | null = null;

	if (level === "self") {
		targetLogoUrl = institution.logoUrl;
	} else if (level === "parent" || level === "grandparent") {
		if (!institution.parentInstitutionId) return c.json({ base64: null });

		const parent = await db.query.institutions.findFirst({
			where: eq(schema.institutions.id, institution.parentInstitutionId),
			columns: { logoUrl: true, parentInstitutionId: true },
		});
		if (!parent) return c.json({ base64: null });

		if (level === "parent") {
			targetLogoUrl = parent.logoUrl;
		} else {
			// grandparent
			if (!parent.parentInstitutionId) return c.json({ base64: null });
			const grandParent = await db.query.institutions.findFirst({
				where: eq(schema.institutions.id, parent.parentInstitutionId),
				columns: { logoUrl: true },
			});
			targetLogoUrl = grandParent?.logoUrl ?? null;
		}
	}

	if (!targetLogoUrl) return c.json({ base64: null });

	const base64 = await logoUrlToBase64(targetLogoUrl);
	return c.json({ base64 });
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
