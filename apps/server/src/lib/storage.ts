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
	/**
	 * Owner folder of the file — the institution id for tenant uploads — so
	 * keys say which institution a file belongs to (`<folder>/<uuid>.<ext>`).
	 */
	folder?: string;
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

/** A folder name or a stored file name: no separators, no dot segments. */
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*(\.[A-Za-z0-9]+)?$/;

/**
 * Whether `key` is a key this storage can have produced (`<file>` or
 * `<folder>/<file>`). Anything else — `..`, absolute paths, deeper paths — is
 * refused before touching the disk.
 */
export function isSafeStorageKey(key: string) {
	const parts = key.split("/");
	return (
		parts.length >= 1 &&
		parts.length <= 2 &&
		parts.every((part) => SAFE_SEGMENT.test(part))
	);
}

/** Absolute path of a local upload, or null when it would leave the uploads root. */
export function resolveLocalUploadPath(relativePath: string): string | null {
	const root = path.resolve(localRoot);
	const resolved = path.resolve(root, relativePath.replace(/^\/+/, ""));
	return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

const localAdapter: StorageAdapter = {
	async save({ buffer, filename, mimeType, folder }) {
		if (folder !== undefined && !SAFE_SEGMENT.test(folder))
			throw new Error("Invalid storage folder");
		const dir = folder ? path.join(localRoot, folder) : localRoot;
		await mkdir(dir, { recursive: true });
		const ext = path.extname(filename).replace(/[^A-Za-z0-9.]/g, "") || "";
		const name = `${randomUUID()}${ext}`;
		const key = folder ? `${folder}/${name}` : name;
		await writeFile(path.join(localRoot, key), buffer);
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
		if (!isSafeStorageKey(key)) return;
		const filePath = resolveLocalUploadPath(key);
		if (!filePath) return;
		try {
			await unlink(filePath);
		} catch {
			// ignore missing file
		}
	},
};

export function getStorageAdapter(): StorageAdapter {
	switch ((process.env.STORAGE_DRIVER ?? "local").toLowerCase()) {
		default:
			return localAdapter;
	}
}
