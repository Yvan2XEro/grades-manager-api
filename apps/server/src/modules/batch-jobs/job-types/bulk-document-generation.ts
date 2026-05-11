import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { getStorageAdapter } from "@/lib/storage";
import * as academicDocs from "@/modules/academic-documents/academic-documents.service";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const documentKindSchema = z.enum(["diploma", "transcript", "attestation"]);

const paramsSchema = z.object({
	kind: documentKindSchema,
	classId: z.string(),
	studentIds: z.array(z.string()).min(1),
	demoMode: z.boolean().default(false),
});

type Params = z.infer<typeof paramsSchema>;

/**
 * Bulk PDF document generation.
 *
 * Step 0 — generate every PDF sequentially via the academic-documents service
 * (Puppeteer doesn't tolerate many parallel headless browsers; sequential is
 * safe and the per-PDF cost is dominated by Chromium spin-up anyway). Each
 * PDF is collected in memory.
 * Step 1 — package the PDFs into a single ZIP and persist via the storage
 * adapter; the returned download URL is stored on `batch_jobs.metadata.zipUrl`
 * so the UI can offer a download button when the job finishes.
 *
 * The job is intentionally idempotent at the per-student level: a per-PDF
 * failure is logged and counted as `itemsFailed`, but the job continues so a
 * single broken record never blocks the whole class.
 */
export const bulkDocumentGenerationJob: BatchJobDefinition<Params> = {
	type: "documents.generateBulk",
	label: "Génération en lot de documents",

	parseParams(raw) {
		return paramsSchema.parse(raw);
	},

	async preview(params, ctx) {
		// Validate the class belongs to the institution.
		const cls = await db.query.classes.findFirst({
			where: eq(schema.classes.id, params.classId),
		});
		if (!cls || cls.institutionId !== ctx.institutionId) {
			throw new Error(`Class not found: ${params.classId}`);
		}

		// Sanity-check that all studentIds are part of this class.
		const studentRows = await db.query.students.findMany({
			where: eq(schema.students.class, params.classId),
		});
		const validIds = new Set(studentRows.map((s) => s.id));
		const missing = params.studentIds.filter((id) => !validIds.has(id));
		if (missing.length > 0) {
			throw new Error(
				`${missing.length} studentId(s) do not belong to class ${params.classId}`,
			);
		}

		await ctx.log(
			"info",
			`Preview: ${params.studentIds.length} ${params.kind} document(s) to generate for class ${cls.name}`,
		);

		const steps = [
			{
				name: "Génération des PDFs",
				estimatedItems: params.studentIds.length,
			},
			{
				name: "Création du ZIP",
				estimatedItems: 1,
			},
		];

		return {
			steps,
			summary: {
				kind: params.kind,
				className: cls.name,
				classCode: cls.code,
				studentCount: params.studentIds.length,
			},
			totalItems: params.studentIds.length + 1,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		// We accumulate generated PDFs in `metadata.pdfs` between step 0 and
		// step 1 so the package step can read them without recomputing. They
		// are intentionally NOT stored on the job row (would bloat the JSON
		// column). Instead we write them to a temp module-level cache keyed
		// by jobId — fine for in-process workers, and the cache is cleared at
		// the end of step 1.
		if (step.stepIndex === 0) {
			const generated: GeneratedPdf[] = [];
			let processed = 0;
			let failed = 0;
			for (const studentId of params.studentIds) {
				try {
					const result = await academicDocs.generateDocument(
						ctx.institutionId,
						{
							kind: params.kind,
							studentId,
							format: "pdf",
							demoMode: params.demoMode,
							period: "annual",
						},
					);
					generated.push({
						studentId,
						filename: `${params.kind}_${studentId}.pdf`,
						pdfBase64: result.content,
					});
					processed++;
				} catch (err) {
					failed++;
					const msg = err instanceof Error ? err.message : String(err);
					await ctx.log(
						"warn",
						`Document generation failed for student ${studentId}: ${msg}`,
					);
				}
				if (
					(processed + failed) % 5 === 0 ||
					processed + failed === params.studentIds.length
				) {
					await ctx.reportStepProgress(step.id, {
						itemsProcessed: processed,
						itemsFailed: failed,
					});
				}
			}
			pdfCache.set(ctx.jobId, generated);
			await ctx.log(
				"info",
				`Generated ${generated.length} PDF(s) (${failed} failure${failed === 1 ? "" : "s"})`,
			);
		} else if (step.stepIndex === 1) {
			const generated = pdfCache.get(ctx.jobId) ?? [];
			pdfCache.delete(ctx.jobId);
			if (generated.length === 0) {
				throw new Error(
					"No PDF was generated successfully — nothing to package.",
				);
			}

			// Resolve the class for nicer file names.
			const cls = await db.query.classes.findFirst({
				where: eq(schema.classes.id, params.classId),
			});
			const studentMap = new Map(
				(
					await db.query.students.findMany({
						where: eq(schema.students.class, params.classId),
						with: { profile: true },
					})
				).map((s) => [s.id, s]),
			);

			const JSZip = (await import("jszip")).default;
			const zip = new JSZip();
			for (const item of generated) {
				const student = studentMap.get(item.studentId);
				const safeName = student
					? slugify(
							`${student.profile.lastName ?? ""}_${student.profile.firstName ?? ""}_${student.registrationNumber}`,
						)
					: item.studentId;
				zip.file(`${params.kind}_${safeName}.pdf`, item.pdfBase64, {
					base64: true,
				});
			}

			const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
			const stamp = new Date().toISOString().slice(0, 10);
			const filename = `${params.kind}_${cls?.code ?? "batch"}_${stamp}.zip`;

			const stored = await getStorageAdapter().save({
				buffer: zipBuffer,
				filename,
				mimeType: "application/zip",
			});

			// Persist the download URL on the job so the UI can grab it.
			await persistDownloadUrl(ctx.jobId, {
				url: stored.url,
				filename,
				size: stored.size,
				count: generated.length,
			});

			await ctx.reportStepProgress(step.id, { itemsProcessed: 1 });
			await ctx.log(
				"info",
				`Packaged ${generated.length} PDF(s) → ${filename} (${formatBytes(stored.size)})`,
			);
		}
	},
};

// ── Internal helpers ──────────────────────────────────────────────────

type GeneratedPdf = {
	studentId: string;
	filename: string;
	pdfBase64: string;
};

// In-memory cache keyed by jobId. Bridges step 0 → step 1 within a single
// process. Acceptable here because batch jobs in this app are processed in
// the same node as the API; if we ever move to a distributed worker pool,
// switch this to a temp directory on disk.
const pdfCache = new Map<string, GeneratedPdf[]>();

async function persistDownloadUrl(
	jobId: string,
	payload: { url: string; filename: string; size: number; count: number },
) {
	// Stored on `execution_result.download` so the frontend can render a
	// download button (and the polling endpoint exposes it as part of the
	// job payload).
	const job = await db.query.batchJobs.findFirst({
		where: eq(schema.batchJobs.id, jobId),
	});
	const existing = (job?.executionResult ?? {}) as Record<string, unknown>;
	await db
		.update(schema.batchJobs)
		.set({
			executionResult: {
				...existing,
				download: payload,
			},
			updatedAt: new Date(),
		})
		.where(eq(schema.batchJobs.id, jobId));
}

function slugify(s: string): string {
	return s
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-zA-Z0-9_-]+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");
}

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
