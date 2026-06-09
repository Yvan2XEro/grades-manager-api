import { type NextRequest, NextResponse } from "next/server";
import { parseUpload, type TemplateType } from "@/lib/seed-templates";

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const type = formData.get("type") as string;
	const file = formData.get("file") as File | null;

	if (!["structure", "programmes", "equipe"].includes(type)) {
		return NextResponse.json(
			{ error: "Invalid template type" },
			{ status: 400 },
		);
	}
	if (!file) {
		return NextResponse.json({ error: "No file received" }, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const result = parseUpload(buffer, type as TemplateType);

	// Return a lightweight preview: sheet summaries + first 5 rows per sheet
	const preview = result.sheets.map((s) => ({
		name: s.name,
		rowCount: s.rowCount,
		headers: s.headers,
		sample: s.rows.slice(0, 5),
	}));

	return NextResponse.json({
		valid: result.errors.length === 0,
		errors: result.errors,
		preview,
		// Full data for later YAML generation
		sheets: result.sheets,
	});
}
