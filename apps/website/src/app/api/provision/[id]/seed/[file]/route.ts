import configPromise from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

const VALID_FILES = ["foundation", "academics", "users"] as const;
type SeedFile = (typeof VALID_FILES)[number];

const FIELD_MAP: Record<SeedFile, string> = {
	foundation: "seedFoundationYaml",
	academics: "seedAcademicsYaml",
	users: "seedUsersYaml",
};

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; file: string }> },
) {
	const { id, file } = await params;
	const token = req.nextUrl.searchParams.get("token");

	if (!VALID_FILES.includes(file as SeedFile)) {
		return NextResponse.json({ error: "Unknown seed file" }, { status: 400 });
	}
	if (!token) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const payload = await getPayload({ config: configPromise });

	let record: Record<string, unknown>;
	try {
		record = (await payload.findByID({
			collection: "instance-requests",
			id,
		})) as unknown as Record<string, unknown>;
	} catch {
		return new NextResponse("Not found", { status: 404 });
	}

	if (record.seedToken !== token) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const yaml = record[FIELD_MAP[file as SeedFile]] as string | null | undefined;
	if (!yaml) {
		return new NextResponse("", { status: 204 });
	}

	return new NextResponse(yaml, {
		status: 200,
		headers: {
			"Content-Type": "application/yaml; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}
