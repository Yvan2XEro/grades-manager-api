import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "../_shared/errors";

const importRoot = process.env.STORAGE_LOCAL_ROOT
	? path.join(process.env.STORAGE_LOCAL_ROOT, "imports")
	: "./storage/uploads/imports";

/**
 * Uploaded workbooks are kept per institution: a file id only resolves inside
 * the folder of the institution that uploaded it, so an id of another
 * institution is NOT_FOUND. Ids are plain file names (no path separators).
 */
function institutionDir(institutionId: string) {
	return path.join(importRoot, path.basename(institutionId));
}

export async function saveImportFile(
	buffer: Buffer,
	ext: string,
	institutionId: string,
): Promise<string> {
	const dir = institutionDir(institutionId);
	await mkdir(dir, { recursive: true });
	const fileId = `${randomUUID()}${ext}`;
	await writeFile(path.join(dir, fileId), buffer);
	return fileId;
}

export async function readImportFile(
	fileId: string,
	institutionId: string,
): Promise<Buffer> {
	try {
		return await readFile(
			path.join(institutionDir(institutionId), path.basename(fileId)),
		);
	} catch {
		throw notFound("Import file not found");
	}
}

export async function deleteImportFile(
	fileId: string,
	institutionId: string,
): Promise<void> {
	try {
		await unlink(
			path.join(institutionDir(institutionId), path.basename(fileId)),
		);
	} catch {
		// ignore missing file
	}
}
