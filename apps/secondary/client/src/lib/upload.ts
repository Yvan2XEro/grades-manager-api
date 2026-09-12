const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

/** Upload a file and return its absolute URL. */
export async function uploadFile(file: File): Promise<string> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await fetch(`${SERVER_URL}/api/upload`, {
		method: "POST",
		body: fd,
		credentials: "include",
	});
	if (!res.ok) throw new Error("Upload failed");
	const json = (await res.json()) as { url: string };
	// Server may return a relative path (/uploads/…); make it absolute.
	const url = json.url;
	return url.startsWith("/") ? `${SERVER_URL}${url}` : url;
}
