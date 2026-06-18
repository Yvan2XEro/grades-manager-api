"use client";

import {
	Activity,
	AlertCircle,
	AlertTriangle,
	Check,
	Copy,
	Info,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "@/utilities/ui";

// ─── Status badge ─────────────────────────────────────────────────────────────

export type InstanceStatus =
	| "pending"
	| "provisioning"
	| "ready"
	| "stopped"
	| "failed";

const STATUS_CONFIG: Record<
	InstanceStatus,
	{ classes: string; pulse: boolean }
> = {
	pending: {
		classes:
			"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
		pulse: true,
	},
	provisioning: {
		classes: "bg-tk-primary/8 text-tk-primary border-tk-primary/25",
		pulse: true,
	},
	ready: {
		classes:
			"bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
		pulse: false,
	},
	stopped: {
		classes: "bg-tk-bg-deep text-tk-muted border-tk-border",
		pulse: false,
	},
	failed: {
		classes:
			"bg-[oklch(0.65_0.2_25/0.06)] text-[oklch(0.5_0.18_25)] border-[oklch(0.65_0.2_25/0.25)]",
		pulse: false,
	},
};

export function StatusBadge({
	status,
	label,
	size = "sm",
}: {
	status: InstanceStatus;
	label: string;
	size?: "sm" | "md";
}) {
	const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
	return (
		<span
			className={cn(
				"inline-flex flex-shrink-0 items-center rounded-full border font-code font-semibold",
				size === "sm"
					? "px-2.5 py-1 text-[0.75rem]"
					: "px-3 py-1.5 text-[0.8125rem]",
				config.classes,
			)}
		>
			{config.pulse && (
				<span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
			)}
			{label}
		</span>
	);
}

// ─── Copy button ──────────────────────────────────────────────────────────────

export function CopyButton({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			title="Copy"
			onClick={async () => {
				await navigator.clipboard.writeText(value);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}}
			className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-tk-muted transition-all duration-150 hover:bg-tk-bg-deep hover:text-tk-primary"
		>
			{copied ? (
				<Check size={12} strokeWidth={2.5} className="text-tk-accent-emerald" />
			) : (
				<Copy size={12} strokeWidth={1.75} />
			)}
		</button>
	);
}

// ─── Section card ─────────────────────────────────────────────────────────────

export function SectionCard({
	title,
	sub,
	action,
	children,
	className,
}: {
	title?: string;
	sub?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-[1rem] border border-tk-border bg-tk-surface",
				className,
			)}
		>
			{(title || sub || action) && (
				<div className="flex items-start justify-between gap-4 border-tk-border border-b px-6 py-4">
					<div>
						{title && (
							<h2 className="font-display font-semibold text-[0.9375rem] text-tk-ink">
								{title}
							</h2>
						)}
						{sub && (
							<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted">
								{sub}
							</p>
						)}
					</div>
					{action && <div className="flex-shrink-0">{action}</div>}
				</div>
			)}
			<div className="p-6">{children}</div>
		</div>
	);
}

// ─── Info row ─────────────────────────────────────────────────────────────────

export function InfoRow({
	label,
	value,
	copyable = false,
	mono = false,
	link,
	empty = "—",
}: {
	label: string;
	value?: string | null;
	copyable?: boolean;
	mono?: boolean;
	link?: string;
	empty?: string;
}) {
	const display = value || empty;
	return (
		<div className="flex items-center justify-between gap-4 border-tk-border border-b py-3 last:border-0">
			<span className="w-36 flex-shrink-0 font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
				{label}
			</span>
			<div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
				{link && value ? (
					<a
						href={link}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							"truncate text-[0.875rem] text-tk-primary no-underline hover:underline",
							mono ? "font-code" : "font-body",
						)}
					>
						{display}
					</a>
				) : (
					<span
						className={cn(
							"truncate text-[0.875rem]",
							value ? "text-tk-ink" : "text-tk-muted",
							mono ? "font-code" : "font-body",
						)}
					>
						{display}
					</span>
				)}
				{copyable && value && <CopyButton value={value} />}
			</div>
		</div>
	);
}

// ─── Page header ──────────────────────────────────────────────────────────────

export function PageHeader({
	title,
	sub,
	action,
}: {
	title: string;
	sub?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="mb-8 flex items-start justify-between gap-4">
			<div>
				<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
					{title}
				</h1>
				{sub && (
					<p className="mt-0.5 font-body text-[0.9375rem] text-tk-muted">
						{sub}
					</p>
				)}
			</div>
			{action && <div className="flex-shrink-0">{action}</div>}
		</div>
	);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({
	icon,
	title,
	sub,
	action,
	dashed = true,
}: {
	icon?: React.ReactNode;
	title: string;
	sub?: string;
	action?: React.ReactNode;
	dashed?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-[1.5rem] border bg-tk-surface py-16 text-center",
				dashed ? "border-tk-border border-dashed" : "border-tk-border",
			)}
		>
			{icon && (
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[0.875rem] bg-tk-primary/8 text-tk-primary">
					{icon}
				</div>
			)}
			<h2 className="mb-1.5 font-bold font-display text-[1rem] text-tk-ink">
				{title}
			</h2>
			{sub && (
				<p className="mb-5 max-w-xs font-body text-[0.875rem] text-tk-muted leading-relaxed">
					{sub}
				</p>
			)}
			{action}
		</div>
	);
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

type AlertVariant = "error" | "warning" | "info";

const ALERT_CONFIG: Record<
	AlertVariant,
	{ icon: React.ReactNode; classes: string; iconClasses: string }
> = {
	error: {
		icon: <AlertCircle size={15} strokeWidth={2} />,
		classes:
			"border-[oklch(0.65_0.2_25/0.25)] bg-[oklch(0.65_0.2_25/0.05)] text-[oklch(0.45_0.18_25)]",
		iconClasses: "text-[oklch(0.55_0.2_25)]",
	},
	warning: {
		icon: <AlertTriangle size={15} strokeWidth={2} />,
		classes:
			"border-[oklch(0.72_0.16_86/0.3)] bg-[oklch(0.72_0.16_86/0.07)] text-[oklch(0.45_0.14_86)]",
		iconClasses: "text-[oklch(0.55_0.14_86)]",
	},
	info: {
		icon: <Info size={15} strokeWidth={2} />,
		classes: "border-tk-primary/20 bg-tk-primary/5 text-tk-primary-deep",
		iconClasses: "text-tk-primary",
	},
};

export function AlertBanner({
	variant = "warning",
	children,
	action,
}: {
	variant?: AlertVariant;
	children: React.ReactNode;
	action?: React.ReactNode;
}) {
	const config = ALERT_CONFIG[variant];
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3 rounded-[0.75rem] border px-4 py-3",
				config.classes,
			)}
		>
			<div className="flex items-center gap-2.5">
				<span className={cn("flex-shrink-0", config.iconClasses)}>
					{config.icon}
				</span>
				<span className="font-body text-[0.875rem]">{children}</span>
			</div>
			{action && <div className="flex-shrink-0">{action}</div>}
		</div>
	);
}

// ─── Activity event row ───────────────────────────────────────────────────────

export function EventRow({
	label,
	actor,
	date,
	isLast = false,
}: {
	label: string;
	actor?: string;
	date: string;
	isLast?: boolean;
}) {
	return (
		<div className="flex gap-4">
			<div className="flex flex-col items-center">
				<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-tk-border bg-tk-bg-deep">
					<Activity size={12} strokeWidth={1.75} className="text-tk-muted" />
				</div>
				{!isLast && <div className="mt-1 h-full w-px flex-1 bg-tk-border" />}
			</div>
			<div className={cn("min-w-0 flex-1 pb-4", isLast && "pb-0")}>
				<p className="font-body font-medium text-[0.875rem] text-tk-ink">
					{label}
				</p>
				<div className="mt-0.5 flex items-center gap-2">
					{actor && (
						<span className="font-body text-[0.75rem] text-tk-muted">
							{actor}
						</span>
					)}
					{actor && <span className="text-[0.75rem] text-tk-border">·</span>}
					<span className="font-code text-[0.75rem] text-tk-muted">{date}</span>
				</div>
			</div>
		</div>
	);
}
