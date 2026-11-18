import { downloadBase64, downloadBlob } from "@/lib/download";

export type GeneratedDocument = {
	studentId: string;
	ok: boolean;
	filename?: string;
	pdfBase64?: string;
	error?: string;
};

/** Saves the generated PDFs: one ZIP (`zipName`), or one download per file. */
export async function saveGeneratedDocuments(
	results: GeneratedDocument[],
	{ zip: asZip, zipName }: { zip: boolean; zipName: () => string },
) {
	const okCount = results.filter((r) => r.ok).length;
	if (asZip && okCount > 0) {
		const JSZip = (await import("jszip")).default;
		const zip = new JSZip();
		for (const r of results) {
			if (r.ok && r.pdfBase64 && r.filename) {
				zip.file(r.filename, r.pdfBase64, { base64: true });
			}
		}
		const blob = await zip.generateAsync({ type: "blob" });
		downloadBlob(blob, zipName());
	} else if (!asZip) {
		for (const r of results) {
			if (!r.ok || !r.pdfBase64 || !r.filename) continue;
			downloadBase64(r.pdfBase64, r.filename, "application/pdf");
			await new Promise((res) => setTimeout(res, 200));
		}
	}
}
