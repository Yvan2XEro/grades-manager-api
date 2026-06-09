"use client";

import type React from "react";
import { useCallback, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import type { TemplateType } from "@/lib/seed-templates";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SheetPreview = {
	name: string;
	rowCount: number;
	headers: string[];
	sample: Record<string, string>[];
};

export type FileData = {
	type: TemplateType;
	sheets: { name: string; rowCount: number; rows: Record<string, string>[] }[];
};

type CardStatus =
	| { kind: "idle" }
	| { kind: "dragging" }
	| { kind: "validating" }
	| { kind: "valid"; preview: SheetPreview[]; totalRows: number }
	| { kind: "error"; messages: string[] };

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconStructure() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="2" y="2" width="7" height="7" rx="1" />
			<rect x="11" y="2" width="7" height="7" rx="1" />
			<rect x="2" y="11" width="7" height="7" rx="1" />
			<rect x="11" y="11" width="7" height="7" rx="1" />
		</svg>
	);
}

function IconBook() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M4 3h9a1 1 0 0 1 1 1v13l-5-2-5 2V4a1 1 0 0 1 1-1z" />
			<path d="M13 3a1 1 0 0 1 1 1v13" />
			<path d="M7 8h4" />
			<path d="M7 11h3" />
		</svg>
	);
}

function IconTeam() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="7" cy="7" r="3" />
			<path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
			<circle cx="14" cy="6" r="2.5" />
			<path d="M17 17c0-2.8-1.8-5.1-4-5.8" />
		</svg>
	);
}

function IconDownload() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M7 1v8M4 6l3 3 3-3" />
			<path d="M2 11h10" />
		</svg>
	);
}

function IconCheck() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M2 7l3.5 3.5L12 3" />
		</svg>
	);
}

function IconX() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
		>
			<path d="M2 2l8 8M10 2l-8 8" />
		</svg>
	);
}

// ─── Single template card ─────────────────────────────────────────────────────

const ICONS: Record<TemplateType, React.ReactNode> = {
	structure: <IconStructure />,
	programmes: <IconBook />,
	equipe: <IconTeam />,
};

function TemplateCard({
	type,
	dict: d,
	onValidated,
	onRemoved,
}: {
	type: TemplateType;
	dict: Dict;
	onValidated: (data: FileData) => void;
	onRemoved: () => void;
}) {
	const sd = d.register.seed;
	const tpl = sd.templates[type];
	const [status, setStatus] = useState<CardStatus>({ kind: "idle" });
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		async (file: File) => {
			if (!file.name.endsWith(".xlsx")) {
				setStatus({ kind: "error", messages: [sd.validation_error] });
				return;
			}
			setStatus({ kind: "validating" });

			const body = new FormData();
			body.append("type", type);
			body.append("file", file);

			try {
				const res = await fetch("/api/seed-validate", { method: "POST", body });
				const data = await res.json();

				if (!res.ok || !data.valid) {
					setStatus({
						kind: "error",
						messages: data.errors ?? [sd.validation_error],
					});
					return;
				}

				const totalRows = (data.preview as SheetPreview[]).reduce(
					(s, sh) => s + sh.rowCount,
					0,
				);
				setStatus({ kind: "valid", preview: data.preview, totalRows });
				onValidated({ type, sheets: data.sheets });
			} catch {
				setStatus({ kind: "error", messages: [d.register.errors.server] });
			}
		},
		[type, sd, d.register.errors.server, onValidated],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setStatus({ kind: "idle" });
			const file = e.dataTransfer.files[0];
			if (file) void handleFile(file);
		},
		[handleFile],
	);

	const handleRemove = useCallback(() => {
		setStatus({ kind: "idle" });
		if (inputRef.current) inputRef.current.value = "";
		onRemoved();
	}, [onRemoved]);

	const isValid = status.kind === "valid";
	const isError = status.kind === "error";

	return (
		<div
			className={`overflow-hidden rounded-[1rem] border transition-all duration-200 ${
				isValid
					? "border-[oklch(0.58_0.17_149/0.35)] bg-[oklch(0.58_0.17_149/0.03)]"
					: isError
						? "border-[oklch(0.65_0.2_25/0.35)] bg-[oklch(0.65_0.2_25/0.03)]"
						: "border-tk-border bg-tk-surface"
			}`}
		>
			{/* Header */}
			<div className="flex items-center gap-3 px-5 py-4">
				<div
					className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[0.5rem] transition-colors duration-200 ${
						isValid
							? "bg-[oklch(0.58_0.17_149/0.12)] text-tk-accent-emerald"
							: isError
								? "bg-[oklch(0.65_0.2_25/0.1)] text-[oklch(0.55_0.2_25)]"
								: "bg-tk-primary/8 text-tk-primary"
					}`}
				>
					{isValid ? <IconCheck /> : ICONS[type]}
				</div>

				<div className="min-w-0 flex-1">
					<p className="font-display font-semibold text-[0.9rem] text-tk-ink leading-tight">
						{tpl.title}
					</p>
					<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted leading-tight">
						{isValid && status.kind === "valid"
							? `${status.totalRows} ${status.totalRows > 1 ? sd.rows_many : sd.rows_one}`
							: tpl.desc}
					</p>
				</div>

				<div className="flex flex-shrink-0 items-center gap-2">
					{isValid ? (
						<button
							type="button"
							onClick={handleRemove}
							className="flex items-center gap-1.5 px-3 py-1.5 font-body text-[0.8125rem] text-tk-muted transition-colors duration-150 hover:text-[oklch(0.55_0.2_25)]"
						>
							<IconX />
							{sd.remove}
						</button>
					) : (
						<a
							href={`/api/seed-template/${type}`}
							download
							className="flex items-center gap-1.5 rounded-[0.5rem] border border-tk-primary/25 px-3 py-1.5 font-body font-medium text-[0.8125rem] text-tk-primary no-underline transition-colors duration-150 hover:bg-tk-primary/6"
						>
							<IconDownload />
							{sd.download}
						</a>
					)}
				</div>
			</div>

			{/* Upload zone — hidden when validated */}
			{!isValid && (
				<div className="px-4 pb-4">
					<div
						onDragEnter={(e) => {
							e.preventDefault();
							setStatus({ kind: "dragging" });
						}}
						onDragOver={(e) => e.preventDefault()}
						onDragLeave={() => setStatus({ kind: "idle" })}
						onDrop={handleDrop}
						onClick={() => inputRef.current?.click()}
						className={`relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[0.75rem] border-2 border-dashed py-6 transition-all duration-200 ${
							status.kind === "dragging"
								? "scale-[0.99] border-tk-primary bg-tk-primary/6"
								: isError
									? "border-[oklch(0.65_0.2_25/0.35)] hover:border-[oklch(0.65_0.2_25/0.6)] hover:bg-[oklch(0.65_0.2_25/0.03)]"
									: "border-tk-border hover:border-tk-primary/40 hover:bg-tk-primary/4"
						}`}
					>
						{status.kind === "validating" ? (
							<div className="flex items-center gap-2 font-body text-[0.875rem] text-tk-muted">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-tk-primary border-t-transparent" />
								{sd.validating}
							</div>
						) : (
							<>
								<p className="font-body font-medium text-[0.875rem] text-tk-ink">
									{sd.drop_idle}
								</p>
								<p className="font-body text-[0.8125rem] text-tk-muted">
									{sd.drop_or}
								</p>
								<p className="mt-0.5 font-code text-[0.75rem] text-tk-muted/70">
									{sd.accepted}
								</p>
							</>
						)}
						<input
							ref={inputRef}
							type="file"
							accept=".xlsx"
							className="sr-only"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) void handleFile(file);
							}}
						/>
					</div>

					{/* Error messages */}
					{isError && status.kind === "error" && status.messages.length > 0 && (
						<div className="mt-2.5 rounded-[0.625rem] border border-[oklch(0.65_0.2_25/0.2)] bg-[oklch(0.65_0.2_25/0.06)] px-3 py-2.5">
							<ul className="space-y-1">
								{status.messages.slice(0, 3).map((msg, i) => (
									<li
										key={i}
										className="flex items-start gap-1.5 font-body text-[0.8125rem] text-[oklch(0.5_0.18_25)]"
									>
										<span className="mt-[3px] h-1 w-1 flex-shrink-0 rounded-full bg-current" />
										{msg}
									</li>
								))}
								{status.messages.length > 3 && (
									<li className="pl-3 font-body text-[0.75rem] text-tk-muted">
										+{status.messages.length - 3} erreur
										{status.messages.length - 3 > 1 ? "s" : ""}
									</li>
								)}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Main export ──────────────────────────────────────────────────────────────

const TEMPLATE_TYPES: TemplateType[] = ["structure", "programmes", "equipe"];

export function SeedUploadStep({
	dict: d,
	onNext,
	onSkip,
	onBack,
	hideBackButton = false,
}: {
	dict: Dict;
	onNext: (files: FileData[]) => void;
	onSkip: () => void;
	onBack: () => void;
	hideBackButton?: boolean;
}) {
	const [loaded, setLoaded] = useState<Map<TemplateType, FileData>>(new Map());

	const handleValidated = useCallback((data: FileData) => {
		setLoaded((prev) => new Map(prev).set(data.type, data));
	}, []);

	const handleRemoved = useCallback((type: TemplateType) => {
		setLoaded((prev) => {
			const next = new Map(prev);
			next.delete(type);
			return next;
		});
	}, []);

	const sd = d.register.seed;
	const loadedCount = loaded.size;

	return (
		<div className="flex flex-col gap-5">
			{/* Optional notice */}
			<div className="flex items-start gap-3 rounded-[0.75rem] border border-tk-primary/15 bg-tk-primary/6 px-4 py-3">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					className="mt-[1px] flex-shrink-0 text-tk-primary"
				>
					<circle cx="8" cy="8" r="6" />
					<path d="M8 7v4M8 5.5v.5" />
				</svg>
				<p className="font-body text-[0.8125rem] text-tk-primary leading-relaxed">
					{sd.optional_notice}
				</p>
			</div>

			{/* Template cards */}
			<div className="flex flex-col gap-3">
				{TEMPLATE_TYPES.map((type) => (
					<TemplateCard
						key={type}
						type={type}
						dict={d}
						onValidated={handleValidated}
						onRemoved={() => handleRemoved(type)}
					/>
				))}
			</div>

			{/* Actions */}
			<div className="flex gap-3 pt-2">
				{!hideBackButton && (
					<button
						type="button"
						onClick={onBack}
						className="tk-btn-outline flex-1 justify-center"
					>
						{d.register.back}
					</button>
				)}
				{loadedCount === 0 ? (
					<button
						type="button"
						onClick={onSkip}
						className="tk-btn-ghost flex-[2] justify-center"
					>
						{sd.skip}
					</button>
				) : (
					<button
						type="button"
						onClick={() => onNext(Array.from(loaded.values()))}
						className="tk-btn-primary flex-[2] justify-center"
					>
						{sd.continue_n.replace("{n}", String(loadedCount))}
					</button>
				)}
			</div>
		</div>
	);
}
