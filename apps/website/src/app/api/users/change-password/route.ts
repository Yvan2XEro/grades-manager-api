import configPromise from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import { getServerSideURL } from "@/utilities/getURL";

const schema = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
	const token = req.cookies.get("payload-token")?.value;
	if (!token)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success)
		return NextResponse.json({ error: "Validation error" }, { status: 422 });

	const { currentPassword, newPassword } = parsed.data;

	// Get current user identity
	const meRes = await fetch(`${getServerSideURL()}/api/users/me`, {
		headers: { Authorization: `JWT ${token}` },
		cache: "no-store",
	});
	if (!meRes.ok)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { user } = await meRes.json();
	if (!user?.email)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Verify current password via Payload login
	const loginRes = await fetch(`${getServerSideURL()}/api/users/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: user.email, password: currentPassword }),
		cache: "no-store",
	});

	if (!loginRes.ok)
		return NextResponse.json({ error: "wrong_password" }, { status: 401 });

	// Update password using Payload local API
	const payload = await getPayload({ config: configPromise });
	await payload.update({
		collection: "users",
		id: user.id,
		data: { password: newPassword },
		overrideAccess: true,
	});

	return NextResponse.json({ ok: true });
}
