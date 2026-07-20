import configPromise from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";
import { getRequestUser } from "@/lib/get-request-user";

const schema = z.object({
	subject: z.string().min(2).max(200),
	message: z.string().min(10).max(5000),
	instanceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
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
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? "Validation error" },
			{ status: 422 },
		);
	}

	const { subject, message, instanceId } = parsed.data;
	const payload = await getPayload({ config: configPromise });

	await payload.create({
		collection: "support-tickets",
		data: {
			subject,
			message,
			from: user.id as string,
			instance: instanceId ?? undefined,
			status: "open",
		},
	});

	return NextResponse.json({ ok: true }, { status: 201 });
}
