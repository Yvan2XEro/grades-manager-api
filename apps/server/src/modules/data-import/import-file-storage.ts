import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const importRoot = process.env.STORAGE_LOCAL_ROOT
	? path.join(process.env.STORAGE_LOCAL_ROOT, "imports")
	: "./storage/uploads/imports";

async function ensureDir() {
	await mkdir(importRoot, { recursive: true });
}

export async function saveImportFile(
	buffer: Buffer,
	ext: string,
): Promise<string> {
	await ensureDir();
	const fileId = `${randomUUID()}${ext}`;
	await writeFile(path.join(importRoot, fileId), buffer);
	return fileId;
}

export async function readImportFile(fileId: string): Promise<Buffer> {
	const safeName = path.basename(fileId);
	return readFile(path.join(importRoot, safeName));
}

export async function deleteImportFile(fileId: string): Promise<void> {
	try {
		await unlink(path.join(importRoot, path.basename(fileId)));
	} catch {
		// ignore missing file
	}
}
