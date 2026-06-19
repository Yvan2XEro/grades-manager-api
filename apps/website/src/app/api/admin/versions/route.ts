import { type NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/get-request-user";
import { listAvailableTags } from "@/lib/ghcr";

export async function GET(req: NextRequest) {
	const user = await getRequestUser(req);
	if (!user || user.role !== "super_admin") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}
	try {
		const tags = await listAvailableTags();
		return NextResponse.json({ tags });
	} catch (err) {
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : "Failed to fetch versions",
			},
			{ status: 502 },
		);
	}
}
