import configPromise from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import { dokploy } from "@/lib/dokploy";
import { getRequestUser } from "@/lib/get-request-user";

const EMAIL_KEYS = [
	"RESEND_API_KEY",
	"SMTP_HOST",
	"SMTP_PORT",
	"SMTP_USER",
	"SMTP_PASS",
	"EMAIL_FROM",
];

const schema = z.discriminatedUnion("provider", [
	z.object({
		provider: z.literal("resend"),
		resendApiKey: z.string().min(1),
		emailFrom: z.string().min(1),
	}),
	z.object({
		provider: z.literal("smtp"),
		smtpHost: z.string().min(1),
		smtpPort: z.string().optional(),
		smtpUser: z.string().optional(),
		smtpPass: z.string().optional(),
		emailFrom: z.string().min(1),
	}),
]);

function parseEnvString(env: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of env.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIdx = trimmed.indexOf("=");
		if (eqIdx === -1) continue;
		result[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1);
	}
	return result;
}

function buildEnvString(vars: Record<string, string>): string {
	return Object.entries(vars)
		.map(([k, v]) => `${k}=${v}`)
		.join("\n");
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const user = await getRequestUser(req);
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success)
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? "Invalid body" },
			{ status: 422 },
		);

	const payload = await getPayload({ config: configPromise });

	let record: Record<string, unknown>;
	try {
		record = (await payload.findByID({
			collection: "instance-requests",
			id,
		})) as unknown as Record<string, unknown>;
	} catch {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const clientField = record.client as
		| { id?: string }
		| string
		| null
		| undefined;
	const clientId =
		typeof clientField === "object" ? clientField?.id : clientField;
	const isAdmin = user.role === "super_admin";
	if (clientId && clientId !== String(user.id) && !isAdmin)
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	const appId = record.dokployAppId as string | null;
	if (!appId)
		return NextResponse.json(
			{ error: "No Dokploy app linked to this instance" },
			{ status: 400 },
		);

	try {
		const currentEnv = await dokploy.getApplicationEnv(appId);
		const vars = parseEnvString(currentEnv);

		for (const key of EMAIL_KEYS) {
			delete vars[key];
		}

		const { data } = parsed;
		vars.EMAIL_FROM = data.emailFrom;

		if (data.provider === "resend") {
			vars.RESEND_API_KEY = data.resendApiKey;
		} else {
			vars.SMTP_HOST = data.smtpHost;
			if (data.smtpPort) vars.SMTP_PORT = data.smtpPort;
			if (data.smtpUser) vars.SMTP_USER = data.smtpUser;
			if (data.smtpPass) vars.SMTP_PASS = data.smtpPass;
		}

		await dokploy.saveEnvironment({
			applicationId: appId,
			env: buildEnvString(vars),
		});

		await dokploy.deploy(appId);

		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Dokploy error" },
			{ status: 502 },
		);
	}
}
