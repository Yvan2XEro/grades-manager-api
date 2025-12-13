import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredFile = {
	key: string;
	url: string;
	size: number;
	contentType: string;
};

type StorageInput = {
	buffer: Buffer;
	filename: string;
	mimeType: string;
};

export interface StorageAdapter {
	save(input: StorageInput): Promise<StoredFile>;
	delete(key: string): Promise<void>;
}

const localRoot = process.env.STORAGE_LOCAL_ROOT ?? "./storage/uploads";
const localPublicPath = process.env.STORAGE_LOCAL_PUBLIC_PATH ?? "/uploads";
const serverPublicUrl = process.env.SERVER_PUBLIC_URL
	? process.env.SERVER_PUBLIC_URL.replace(/\/$/, "")
	: "";

async function ensureLocalDir() {
	await mkdir(localRoot, { recursive: true });
}

const localAdapter: StorageAdapter = {
	async save({ buffer, filename, mimeType }) {
		await ensureLocalDir();
		const ext = path.extname(filename) || "";
		const key = `${randomUUID()}${ext}`;
		const filePath = path.join(localRoot, key);
		await writeFile(filePath, buffer);
		const relativeUrl = `${localPublicPath}/${key}`;
		const normalizedRelative = relativeUrl.replace(/^\/+/, "/");
		const publicUrl =
			serverPublicUrl !== ""
				? `${serverPublicUrl}${normalizedRelative}`
				: normalizedRelative;
		return {
			key,
			url: publicUrl,
			size: buffer.length,
			contentType: mimeType,
		};
	},
	async delete(key) {
		try {
			await unlink(path.join(localRoot, key));
		} catch {
			// ignore missing file
		}
	},
};

export function getStorageAdapter(): StorageAdapter {
	switch ((process.env.STORAGE_DRIVER ?? "local").toLowerCase()) {
		case "local":
		default:
			return localAdapter;
	}
}
