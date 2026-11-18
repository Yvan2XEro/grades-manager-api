/** Saves a Blob through a temporary link. */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

/** Decodes a base64 payload (as returned by document-generating procedures) and saves it. */
export function downloadBase64(
	data: string,
	filename: string,
	mimeType: string,
) {
	const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
	downloadBlob(new Blob([bytes], { type: mimeType }), filename);
}

/** `2026-11-13`, for file names. */
export const fileDateStamp = () => new Date().toISOString().split("T")[0];
