import configPromise from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import { dokploy } from "@/lib/dokploy";
import { getRequestUser } from "@/lib/get-request-user";

const _fullImage =
	process.env.DOKPLOY_APP_IMAGE ?? "ghcr.io/yvan2xero/tkams:latest";
const _colonIdx = _fullImage.lastIndexOf(":");
const APP_IMAGE_BASE =
	_colonIdx > 0 ? _fullImage.slice(0, _colonIdx) : _fullImage;

const schema = z.object({
	action: z.enum(["restart", "stop", "start", "upgrade"]),
	imageTag: z.string().optional(),
});

const ACTION_TO_STATUS: Record<string, string> = {
	stop: "stopped",
	start: "ready",
	restart: "ready",
	upgrade: "ready",
};

const ACTION_TO_EVENT: Record<
	string,
	"restarted" | "stopped" | "started" | "upgraded"
> = {
	restart: "restarted",
	stop: "stopped",
	start: "started",
	upgrade: "upgraded",
};

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
		return NextResponse.json({ error: "Invalid action" }, { status: 422 });

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

	if (parsed.data.action === "upgrade" && !isAdmin)
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	const appId = record.dokployAppId as string | null;
	if (!appId)
		return NextResponse.json(
			{ error: "No Dokploy app linked to this instance" },
			{ status: 400 },
		);

	const { action, imageTag: requestedTag } = parsed.data;

	try {
		if (action === "restart") {
			await dokploy.deploy(appId);
		} else if (action === "stop") {
			await dokploy.stopApplication(appId);
		} else if (action === "start") {
			await dokploy.startApplication(appId);
		} else if (action === "upgrade") {
			const tag =
				requestedTag ?? (record.imageTag as string | null) ?? "latest";
			const dockerImage = `${APP_IMAGE_BASE}:${tag}`;
			await dokploy.saveDockerProvider({ applicationId: appId, dockerImage });
			await dokploy.deploy(appId);
			await payload.update({
				collection: "instance-requests",
				id,
				data: { imageTag: tag },
			});
		}

		// Update instance status in Payload
		const newStatus = ACTION_TO_STATUS[action];
		if (newStatus) {
			await payload.update({
				collection: "instance-requests",
				id,
				data: { status: newStatus as "ready" | "stopped" },
			});
		}

		// Log the event (fire-and-forget)
		payload
			.create({
				collection: "instance-events",
				data: {
					instance: id,
					eventType: ACTION_TO_EVENT[action],
					actorEmail: user.email ?? undefined,
				},
			})
			.catch(console.error);

		return NextResponse.json({ ok: true, status: newStatus });
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Dokploy error" },
			{ status: 502 },
		);
	}
}
