import { type NextRequest, NextResponse } from "next/server";
import { generateTemplate, type TemplateType } from "@/lib/seed-templates";

const FILENAMES: Record<TemplateType, string> = {
	structure: "tkams-academic-structure.xlsx",
	programmes: "tkams-programmes.xlsx",
	equipe: "tkams-team.xlsx",
};

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ type: string }> },
) {
	const { type } = await params;

	const VALID_TYPES: TemplateType[] = ["structure", "programmes", "equipe"];
	if (!VALID_TYPES.includes(type as TemplateType)) {
		return NextResponse.json(
			{ error: "Unknown template type" },
			{ status: 400 },
		);
	}

	const buffer = generateTemplate(type as TemplateType);

	return new NextResponse(new Uint8Array(buffer), {
		status: 200,
		headers: {
			"Content-Type":
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"Content-Disposition": `attachment; filename="${FILENAMES[type as TemplateType]}"`,
			"Cache-Control": "no-store",
		},
	});
}
