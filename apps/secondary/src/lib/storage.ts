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

// ─── Local adapter ────────────────────────────────────────────────────────────

const localRoot = process.env.STORAGE_LOCAL_ROOT ?? "./storage/uploads";
const localPublicPath = process.env.STORAGE_LOCAL_PUBLIC_PATH ?? "/uploads";
const serverPublicUrl = (process.env.SERVER_PUBLIC_URL ?? "").replace(
	/\/$/,
	"",
);

const localAdapter: StorageAdapter = {
	async save({ buffer, filename, mimeType }) {
		await mkdir(localRoot, { recursive: true });
		const ext = path.extname(filename) || "";
		const key = `${randomUUID()}${ext}`;
		await writeFile(path.join(localRoot, key), buffer);
		const url = serverPublicUrl
			? `${serverPublicUrl}${localPublicPath}/${key}`
			: `${localPublicPath}/${key}`;
		return { key, url, size: buffer.length, contentType: mimeType };
	},
	async delete(key) {
		try {
			await unlink(path.join(localRoot, key));
		} catch {
			// ignore missing file
		}
	},
};

// ─── S3 / Rustfs adapter ──────────────────────────────────────────────────────
// Compatible with AWS S3 and any S3-compatible store (Rustfs, MinIO, etc.)
// Required env vars for S3 driver:
//   S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
// Optional:
//   S3_ENDPOINT — custom endpoint for Rustfs/MinIO (e.g. http://localhost:9000)
//   S3_PUBLIC_URL — base URL for public access (falls back to S3 virtual-hosted URL)
//   S3_PATH_STYLE — "true" for path-style URLs (required for Rustfs/MinIO)

let _s3Adapter: StorageAdapter | null = null;

async function getS3Adapter(): Promise<StorageAdapter> {
	if (_s3Adapter) return _s3Adapter;

	const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
	const { Upload } = await import("@aws-sdk/lib-storage");

	const bucket = process.env.S3_BUCKET ?? "";
	const region = process.env.S3_REGION ?? "us-east-1";
	const endpoint = process.env.S3_ENDPOINT;
	const publicUrl = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
	const pathStyle = process.env.S3_PATH_STYLE === "true";

	const client = new S3Client({
		region,
		endpoint,
		forcePathStyle: pathStyle,
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
		},
	});

	_s3Adapter = {
		async save({ buffer, filename, mimeType }) {
			const ext = path.extname(filename) || "";
			const key = `uploads/${randomUUID()}${ext}`;

			const upload = new Upload({
				client,
				params: {
					Bucket: bucket,
					Key: key,
					Body: buffer,
					ContentType: mimeType,
				},
			});
			await upload.done();

			const url = publicUrl
				? `${publicUrl}/${key}`
				: endpoint
					? `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`
					: `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

			return { key, url, size: buffer.length, contentType: mimeType };
		},
		async delete(key) {
			try {
				await client.send(
					new DeleteObjectCommand({ Bucket: bucket, Key: key }),
				);
			} catch {
				// ignore
			}
		},
	};
	return _s3Adapter;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export async function getStorageAdapter(): Promise<StorageAdapter> {
	const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
	if (driver === "s3" || driver === "rustfs") {
		return getS3Adapter();
	}
	return localAdapter;
}
