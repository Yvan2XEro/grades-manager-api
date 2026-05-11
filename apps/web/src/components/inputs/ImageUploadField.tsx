import { UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";

const fileToBase64 = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			const base64 = result.includes(",")
				? (result.split(",").pop() ?? "")
				: result;
			resolve(base64);
		};
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});

type ImageUploadFieldProps = {
	label: string;
	description: string;
	value?: string;
	onChange: (url: string) => void;
	onClear: () => void;
	placeholder: string;
};

export function ImageUploadField({
	label,
	description,
	value,
	onChange,
	onClear,
	placeholder,
}: ImageUploadFieldProps) {
	const { t } = useTranslation();
	const [preview, setPreview] = useState(value ?? "");
	const [isUploading, setIsUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setPreview(value ?? "");
	}, [value]);

	const handleUpload = async (file?: File) => {
		if (!file) return;
		setIsUploading(true);
		try {
			const base64 = await fileToBase64(file);
			const upload = await trpcClient.files.upload.mutate({
				filename: file.name,
				mimeType: file.type || "application/octet-stream",
				base64,
			});
			onChange(upload.url);
			setPreview(upload.url);
			toast.success(
				t("admin.institution.form.uploadSuccess", {
					defaultValue: "Image uploaded",
				}),
			);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: t("admin.institution.form.uploadError", {
							defaultValue: "Upload failed",
						});
			toast.error(message);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		const file = event.dataTransfer.files?.[0];
		void handleUpload(file);
	};

	return (
		<div className="space-y-3 rounded-lg border bg-card p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="font-medium text-foreground">{label}</p>
					<p className="text-muted-foreground text-xs">{description}</p>
				</div>
				{preview && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => {
							onClear();
							setPreview("");
						}}
					>
						{t("admin.institution.form.clearImage", {
							defaultValue: "Remove image",
						})}
					</Button>
				)}
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="flex h-48 items-center justify-center rounded-md border bg-muted/30">
					{preview ? (
						<img
							src={preview}
							alt={label}
							className="h-full w-full rounded-md object-contain"
						/>
					) : (
						<p className="text-muted-foreground text-xs">
							{t("admin.institution.form.previewPlaceholder", {
								defaultValue: "No image yet",
							})}
						</p>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<div
						onClick={() => inputRef.current?.click()}
						onDragOver={(event) => {
							event.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={(event) => {
							event.preventDefault();
							setIsDragging(false);
						}}
						onDrop={handleDrop}
						className={cn(
							"flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center font-medium text-foreground text-sm transition hover:border-primary focus:outline-none",
							isDragging && "border-primary bg-primary/5",
						)}
					>
						<UploadIcon className="h-6 w-6 text-primary" />
						<p>
							{t("admin.institution.form.uploadCta", {
								defaultValue: "Select or drop an image",
							})}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("admin.institution.form.uploadHint", {
								defaultValue: "PNG/JPG up to 5 MB",
							})}
						</p>
						{isUploading && (
							<p className="text-primary text-xs">
								{t("admin.institution.form.uploading", {
									defaultValue: "Uploading…",
								})}
							</p>
						)}
					</div>
					<p className="text-muted-foreground text-xs">
						{t("admin.institution.form.uploadDescription", {
							defaultValue:
								"You can still paste a public URL below if you host assets elsewhere.",
						})}
					</p>
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(event) => {
							const file = event.target.files?.[0];
							void handleUpload(file);
							event.target.value = "";
						}}
					/>
				</div>
			</div>
			<Input
				value={value ?? ""}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
			/>
		</div>
	);
}
