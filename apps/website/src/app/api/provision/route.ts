import configPromise from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import { getRequestUser } from "@/lib/get-request-user";
import type { SeedMode } from "@/lib/provision";
import { prepareSeedData } from "@/lib/provision";
import type { FileData } from "@/marketing/SeedUploadStep";

const schema = z.object({
	orgName: z.string().min(2).max(100),
	subdomain: z
		.string()
		.min(2)
		.max(40)
		.regex(
			/^[a-z0-9-]+$/,
			"Subdomain must be lowercase alphanumeric with hyphens",
		),
	institutionType: z.string(),
	country: z.string(),
	adminName: z.string().min(2),
	adminEmail: z.string().email(),
	adminPassword: z.string().min(8),
	seedMode: z.enum(["empty", "demo", "custom"]).optional().default("empty"),
	seedFiles: z.array(z.any()).optional(),
});

export async function POST(req: NextRequest) {
	const user = await getRequestUser(req);
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? "Validation error" },
			{ status: 422 },
		);
	}

	const data = parsed.data;
	const payload = await getPayload({ config: configPromise });

	const existing = await payload.find({
		collection: "instance-requests",
		where: { subdomain: { equals: data.subdomain } },
		limit: 1,
	});
	if (existing.docs.length > 0) {
		return NextResponse.json(
			{ error: "This subdomain is already in use." },
			{ status: 409 },
		);
	}

	const record = await payload.create({
		collection: "instance-requests",
		data: {
			orgName: data.orgName,
			subdomain: data.subdomain,
			institutionType: data.institutionType as
				| "university"
				| "school"
				| "institute"
				| "secondary"
				| "other",
			country: data.country,
			adminName: data.adminName,
			adminEmail: data.adminEmail,
			adminPasswordTemp: data.adminPassword,
			client: user.id as string,
			status: "pending_approval",
			progressStep: 0,
			seedMode: data.seedMode as "empty" | "demo" | "custom",
		},
	});

	// Build and store seed YAMLs immediately so they're ready when admin approves.
	// Fire-and-forget — fast (string building + one DB write).
	prepareSeedData(
		{
			requestId: String(record.id),
			orgName: data.orgName,
			subdomain: data.subdomain,
			institutionType: data.institutionType,
			country: data.country,
			adminName: data.adminName,
			adminEmail: data.adminEmail,
			adminPassword: data.adminPassword,
			seedMode: data.seedMode as SeedMode,
			seedFiles: data.seedFiles as FileData[] | undefined,
		},
		payload,
	).catch((err) => console.error("[provision] seed prep error:", err));

	return NextResponse.json({ id: record.id }, { status: 202 });
}
