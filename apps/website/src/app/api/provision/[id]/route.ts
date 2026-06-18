import configPromise from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { dokploy } from "@/lib/dokploy";
import { getRequestUser } from "@/lib/get-request-user";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const user = await getRequestUser(req);
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config: configPromise });

	try {
		const record = (await payload.findByID({
			collection: "instance-requests",
			id,
		})) as unknown as Record<string, unknown>;

		const clientField = record.client as
			| { id?: string }
			| string
			| null
			| undefined;
		const clientId =
			typeof clientField === "object" ? clientField?.id : clientField;
		if (clientId && clientId !== String(user.id)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		return NextResponse.json({
			id: record.id,
			status: record.status,
			progressStep: record.progressStep ?? 0,
			instanceUrl: record.instanceUrl ?? null,
			errorMessage: record.errorMessage ?? null,
			dokployAppId: record.dokployAppId ?? null,
		});
	} catch {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const user = await getRequestUser(req);
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
	if (clientId && clientId !== String(user.id)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	// Best-effort cleanup of Dokploy resources — failures don't block deletion
	const appId = record.dokployAppId as string | null;
	const postgresId = record.dokployPostgresId as string | null;
	const projectId = record.dokployProjectId as string | null;

	await Promise.allSettled([
		appId ? dokploy.deleteApplication(appId) : Promise.resolve(),
		postgresId ? dokploy.deletePostgres(postgresId) : Promise.resolve(),
	]);

	if (projectId) await Promise.allSettled([dokploy.deleteProject(projectId)]);

	await payload.delete({ collection: "instance-requests", id });

	return NextResponse.json({ ok: true });
}
