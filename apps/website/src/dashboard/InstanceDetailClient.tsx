"use client";

import {
	AlertTriangle,
	ChevronLeft,
	ExternalLink,
	HelpCircle,
	Play,
	RotateCcw,
	Square,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import type { Dict } from "@/i18n";
import { cn } from "@/utilities/ui";
import {
	CopyButton,
	EmptyState,
	EventRow,
	type InstanceStatus,
	SectionCard,
	StatusBadge,
} from "./ui";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_TKAMS_BASE_DOMAIN ?? "tkams.com";

export type InstanceData = {
	id: string;
	orgName: string | null;
	subdomain: string | null;
	institutionType: string | null;
	country: string | null;
	status: string;
	progressStep: number | null;
	instanceUrl: string | null;
	errorMessage: string | null;
	adminName: string | null;
	adminEmail: string | null;
	createdAt: string | null;
	seedMode: string | null;
	seedFoundationYaml: string | null;
	seedAcademicsYaml: string | null;
	seedUsersYaml: string | null;
	dokployAppId: string | null;
	dokployPostgresId: string | null;
	dokployProjectId: string | null;
};

type EventData = {
	id: string;
	eventType: string;
	actorEmail?: string;
	createdAt: string;
};

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({
	label,
	icon,
	loading = false,
	disabled = false,
	variant = "default",
	onClick,
}: {
	label: string;
	icon: React.ReactNode;
	loading?: boolean;
	disabled?: boolean;
	variant?: "default" | "primary";
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			className={cn(
				"inline-flex items-center gap-2 rounded-[0.625rem] border px-3.5 py-2 font-body font-medium text-[0.875rem] transition-all duration-150",
				disabled || loading
					? "cursor-not-allowed border-tk-border text-tk-muted opacity-50"
					: variant === "primary"
						? "border-transparent bg-tk-primary text-white shadow-sm hover:bg-tk-primary/90"
						: "border-tk-border bg-tk-surface text-tk-ink hover:border-tk-ink/20 hover:bg-tk-bg-deep",
			)}
		>
			{loading ? (
				<RotateCcw size={14} strokeWidth={1.75} className="animate-spin" />
			) : (
				icon
			)}
			{label}
		</button>
	);
}

// ─── Provisioning progress ────────────────────────────────────────────────────

function ProvisioningCard({
	step,
	steps,
	title,
	sub,
}: {
	step: number;
	steps: readonly string[];
	title: string;
	sub: string;
}) {
	const pct = Math.round((step / steps.length) * 100);
	return (
		<div className="mb-6 rounded-[1rem] border border-tk-primary/20 bg-tk-primary/3 p-5">
			<div className="mb-4 flex items-center justify-between gap-4">
				<div>
					<p className="font-display font-semibold text-[0.9375rem] text-tk-ink">
						{title}
					</p>
					<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted">
						{sub}
					</p>
				</div>
				<span className="flex-shrink-0 font-code text-[0.75rem] text-tk-primary">
					{step}/{steps.length}
				</span>
			</div>
			{/* Progress bar */}
			<div className="mb-4 h-1.5 overflow-hidden rounded-full bg-tk-primary/12">
				<div
					className="h-full rounded-full bg-tk-primary transition-all duration-700"
					style={{ width: `${pct}%` }}
				/>
			</div>
			{/* Steps */}
			<div className="flex flex-col gap-1.5">
				{steps.map((label, i) => {
					const done = i < step;
					const active = i === step;
					return (
						<div key={label} className="flex items-center gap-2.5">
							<div
								className={cn(
									"flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full",
									done
										? "bg-[oklch(0.58_0.17_149)]"
										: active
											? "border-2 border-tk-primary"
											: "border border-tk-border bg-tk-bg",
								)}
							>
								{done && (
									<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
										<path
											d="M1 4l2 2 4-4"
											stroke="white"
											strokeWidth="1.75"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
								{active && (
									<div className="h-1.5 w-1.5 animate-pulse rounded-full bg-tk-primary" />
								)}
							</div>
							<span
								className={cn(
									"font-body text-[0.8125rem]",
									done
										? "text-[oklch(0.42_0.14_149)]"
										: active
											? "font-medium text-tk-ink"
											: "text-tk-muted",
								)}
							>
								{label}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Danger zone ──────────────────────────────────────────────────────────────

function DangerZone({
	instance,
	dict: d,
	onDeleted,
}: {
	instance: InstanceData;
	dict: Dict;
	onDeleted: () => void;
}) {
	const dd = d.dashboard.detail;
	const [confirm, setConfirm] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");
	const match = confirm === instance.subdomain;

	const handleDelete = async () => {
		if (!match) return;
		setDeleting(true);
		setError("");
		try {
			const res = await fetch(`/api/provision/${instance.id}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (res.ok) {
				onDeleted();
			} else {
				const data = await res.json();
				setError(data.error ?? dd.action_error);
			}
		} catch {
			setError(dd.action_error);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="rounded-[1rem] border border-[oklch(0.65_0.2_25/0.2)] bg-[oklch(0.65_0.2_25/0.02)] p-5">
			<div className="mb-4 flex items-start gap-3">
				<div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[0.5rem] bg-[oklch(0.65_0.2_25/0.1)]">
					<AlertTriangle
						size={13}
						strokeWidth={1.75}
						className="text-[oklch(0.5_0.18_25)]"
					/>
				</div>
				<div>
					<p className="font-display font-semibold text-[0.875rem] text-[oklch(0.45_0.18_25)]">
						{dd.danger_delete_title}
					</p>
					<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted leading-relaxed">
						{dd.danger_delete_desc}
					</p>
				</div>
			</div>

			<div className="flex flex-col items-start gap-2.5 sm:flex-row">
				<div className="min-w-0 flex-1">
					<label className="mb-1 block font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.07em]">
						{dd.danger_delete_confirm}:{" "}
						<span className="font-semibold text-tk-ink">
							{instance.subdomain}
						</span>
					</label>
					<input
						type="text"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						placeholder={instance.subdomain ?? ""}
						className="w-full rounded-[0.5rem] border border-tk-border bg-tk-bg px-3 py-2 font-code text-[0.875rem] text-tk-ink outline-none transition-colors focus:border-[oklch(0.65_0.2_25/0.5)]"
						disabled={deleting}
					/>
				</div>
				<button
					type="button"
					onClick={handleDelete}
					disabled={!match || deleting}
					className={cn(
						"inline-flex flex-shrink-0 items-center gap-2 rounded-[0.625rem] border px-4 py-2 font-body font-semibold text-[0.8125rem] transition-all duration-150",
						match && !deleting
							? "border-transparent bg-[oklch(0.65_0.2_25)] text-white hover:bg-[oklch(0.55_0.2_25)]"
							: "cursor-not-allowed border-[oklch(0.65_0.2_25/0.3)] bg-transparent text-[oklch(0.5_0.18_25)] opacity-40",
					)}
				>
					<Trash2 size={13} strokeWidth={1.75} />
					{deleting ? dd.danger_deleting : dd.danger_delete_btn}
				</button>
			</div>
			{error && (
				<p className="mt-2.5 font-body text-[0.8125rem] text-[oklch(0.5_0.18_25)]">
					{error}
				</p>
			)}
		</div>
	);
}

// ─── Sidebar detail row ───────────────────────────────────────────────────────

function DetailRow({
	label,
	value,
	copyable = false,
}: {
	label: string;
	value?: string | null;
	copyable?: boolean;
}) {
	if (!value) return null;
	return (
		<div className="py-2.5 [&:not(:last-child)]:border-tk-border [&:not(:last-child)]:border-b">
			<p className="mb-0.5 font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
				{label}
			</p>
			<div className="flex items-center justify-between gap-2">
				<p className="break-all font-body text-[0.875rem] text-tk-ink">
					{value}
				</p>
				{copyable && <CopyButton value={value} />}
			</div>
		</div>
	);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function InstanceDetailClient({
	instance: initial,
	dict: d,
	events: initialEvents,
}: {
	instance: InstanceData;
	dict: Dict;
	events: EventData[];
}) {
	const dd = d.dashboard.detail;
	const ev = d.dashboard.events;
	const router = useRouter();
	const [instance, setInstance] = useState(initial);
	const [actionLoading, setActionLoading] = useState<
		"restart" | "stop" | "start" | null
	>(null);
	const [actionError, setActionError] = useState("");
	const [events] = useState(initialEvents);

	useEffect(() => {
		if (instance.status !== "provisioning" && instance.status !== "pending")
			return;
		let cancelled = false;
		let delay = 2500;
		async function poll() {
			if (cancelled) return;
			try {
				const res = await fetch(`/api/provision/${instance.id}`);
				if (res.ok && !cancelled) {
					const data = await res.json();
					setInstance((prev) => ({
						...prev,
						status: data.status,
						progressStep: data.progressStep,
						instanceUrl: data.instanceUrl,
						errorMessage: data.errorMessage,
					}));
					if (data.status === "provisioning" || data.status === "pending") {
						delay = Math.min(delay * 1.4, 10000);
						setTimeout(poll, delay);
					}
				}
			} catch {
				if (!cancelled) setTimeout(poll, delay);
			}
		}
		void poll();
		return () => {
			cancelled = true;
		};
	}, [instance.id, instance.status]);

	const handleAction = async (action: "restart" | "stop" | "start") => {
		setActionLoading(action);
		setActionError("");
		try {
			const res = await fetch(`/api/provision/${instance.id}/action`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action }),
			});
			if (res.ok) {
				const data = await res.json();
				if (data.status)
					setInstance((prev) => ({ ...prev, status: data.status }));
			} else {
				const data = await res.json();
				setActionError(data.error ?? dd.action_error);
			}
		} catch {
			setActionError(dd.action_error);
		} finally {
			setActionLoading(null);
		}
	};

	const status = instance.status as InstanceStatus;
	const isProvisioning = status === "provisioning" || status === "pending";
	const isReady = status === "ready";
	const isFailed = status === "failed";
	const isStopped = status === "stopped";

	const statusBadgeLabel = isReady
		? dd.ready_badge
		: isProvisioning
			? dd.provisioning_badge
			: isFailed
				? dd.failed_badge
				: isStopped
					? dd.stopped_badge
					: status;

	const institutionTypes: Record<string, string> = {
		university: "Université",
		school: "Grande École",
		institute: "Institut",
		secondary: "Lycée / Secondaire",
		other: "Autre",
	};

	const instanceUrl =
		instance.instanceUrl ?? `https://${instance.subdomain}.${BASE_DOMAIN}`;

	return (
		<div>
			{/* ── Page header ─────────────────────────────────────────────── */}
			<div className="mb-6">
				<Link
					href="/dashboard/instances"
					className="mb-4 inline-flex items-center gap-1.5 font-body text-[0.8125rem] text-tk-muted no-underline transition-colors hover:text-tk-ink"
				>
					<ChevronLeft size={14} strokeWidth={1.5} />
					{dd.back}
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-4">
					{/* Identity */}
					<div>
						<p className="font-body text-[0.8125rem] text-tk-muted">
							{instance.orgName}
						</p>
						<div className="mt-1 flex flex-wrap items-center gap-3">
							<h1 className="font-bold font-display text-[1.5rem] text-tk-ink leading-none tracking-[-0.025em]">
								{instance.subdomain}
								<span className="font-normal text-tk-muted">
									.{BASE_DOMAIN}
								</span>
							</h1>
							<StatusBadge status={status} label={statusBadgeLabel} size="md" />
						</div>
						{/* URL line */}
						<div className="mt-2 flex min-w-0 items-center gap-2">
							{isReady && (
								<span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[oklch(0.58_0.17_149)]" />
							)}
							<span className="min-w-0 truncate font-code text-[0.8125rem] text-tk-muted">
								{instanceUrl}
							</span>
							<CopyButton value={instanceUrl} />
							{instance.instanceUrl && (
								<a
									href={instance.instanceUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex h-5 w-5 items-center justify-center rounded text-tk-muted transition-colors hover:text-tk-primary"
								>
									<ExternalLink size={12} strokeWidth={1.75} />
								</a>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex flex-wrap items-center gap-2">
						{isReady && instance.instanceUrl && (
							<a
								href={instance.instanceUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="tk-btn-primary inline-flex items-center gap-2"
							>
								<ExternalLink size={14} strokeWidth={1.75} />
								{dd.open_instance}
							</a>
						)}
						{isReady && (
							<>
								<ActionButton
									label={dd.action_restart}
									icon={<RotateCcw size={14} strokeWidth={1.75} />}
									loading={actionLoading === "restart"}
									disabled={actionLoading !== null}
									onClick={() => handleAction("restart")}
								/>
								<ActionButton
									label={dd.action_stop}
									icon={<Square size={14} strokeWidth={1.75} />}
									loading={actionLoading === "stop"}
									disabled={actionLoading !== null}
									onClick={() => handleAction("stop")}
								/>
							</>
						)}
						{(isStopped || isFailed) && (
							<ActionButton
								label={dd.action_start}
								icon={<Play size={14} strokeWidth={1.75} />}
								loading={actionLoading === "start"}
								disabled={actionLoading !== null}
								variant="primary"
								onClick={() => handleAction("start")}
							/>
						)}
					</div>
				</div>

				{/* Action error */}
				{actionError && (
					<p className="mt-3 font-body text-[0.875rem] text-[oklch(0.5_0.18_25)]">
						{actionError}
					</p>
				)}
			</div>

			{/* ── Error message (inline, no card overhead) ────────────────── */}
			{isFailed && (
				<div className="mb-5 flex gap-3 rounded-[0.75rem] border border-[oklch(0.65_0.2_25/0.2)] bg-[oklch(0.65_0.2_25/0.04)] px-4 py-3">
					<AlertTriangle
						size={14}
						strokeWidth={1.75}
						className="mt-0.5 flex-shrink-0 text-[oklch(0.55_0.2_25)]"
					/>
					<p className="min-w-0 flex-1 font-body text-[0.8125rem] text-[oklch(0.45_0.18_25)] leading-relaxed">
						{dd.failed_sub}
					</p>
				</div>
			)}

			{/* ── Provisioning progress ────────────────────────────────────── */}
			{isProvisioning && (
				<ProvisioningCard
					step={instance.progressStep ?? 0}
					steps={dd.progress_steps}
					title={dd.provisioning_title}
					sub={dd.provisioning_sub}
				/>
			)}

			{/* ── Body: activity + sidebar ─────────────────────────────────── */}
			<div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_240px]">
				{/* Activity log */}
				<SectionCard title={dd.events_title}>
					{events.length === 0 ? (
						<EmptyState title={dd.events_empty} dashed={false} />
					) : (
						<div className="pt-1">
							{events.map((event, i) => {
								const eventLabel =
									ev.types[event.eventType as keyof typeof ev.types] ??
									event.eventType;
								return (
									<EventRow
										key={event.id}
										label={eventLabel}
										actor={event.actorEmail}
										date={new Date(event.createdAt).toLocaleDateString(
											"fr-FR",
											{
												day: "numeric",
												month: "short",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											},
										)}
										isLast={i === events.length - 1}
									/>
								);
							})}
						</div>
					)}
				</SectionCard>

				{/* Sidebar */}
				<div className="flex flex-col gap-4">
					<div className="rounded-[1rem] border border-tk-border bg-tk-surface px-5 py-1">
						<DetailRow label={dd.admin_name_label} value={instance.adminName} />
						<DetailRow
							label={dd.admin_email_label}
							value={instance.adminEmail}
							copyable
						/>
						<DetailRow
							label={dd.institution_type_label}
							value={
								institutionTypes[instance.institutionType ?? ""] ??
								instance.institutionType
							}
						/>
						<DetailRow label={dd.country_label} value={instance.country} />
						<DetailRow
							label={dd.created_label}
							value={
								instance.createdAt
									? new Date(instance.createdAt).toLocaleDateString("fr-FR", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})
									: null
							}
						/>
					</div>

					<Link
						href="/dashboard/support"
						className="flex items-center gap-3 rounded-[1rem] border border-tk-border bg-tk-surface px-4 py-3 no-underline transition-colors hover:border-tk-primary/30"
					>
						<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[0.5rem] bg-tk-primary/8">
							<HelpCircle
								size={14}
								strokeWidth={1.75}
								className="text-tk-primary"
							/>
						</div>
						<div>
							<p className="font-body font-medium text-[0.875rem] text-tk-ink">
								{dd.support_cta}
							</p>
							<p className="font-body text-[0.75rem] text-tk-muted">
								{dd.support_sub}
							</p>
						</div>
					</Link>
				</div>
			</div>

			{/* ── Danger zone ──────────────────────────────────────────────── */}
			<div className="mt-8">
				<div className="mb-3 flex items-center gap-3">
					<div className="h-px flex-1 bg-[oklch(0.65_0.2_25/0.15)]" />
					<span className="flex-shrink-0 font-code text-[0.6875rem] text-[oklch(0.6_0.15_25)] uppercase tracking-[0.12em]">
						{dd.danger_title}
					</span>
					<div className="h-px flex-1 bg-[oklch(0.65_0.2_25/0.15)]" />
				</div>
				<DangerZone
					instance={instance}
					dict={d}
					onDeleted={() => router.push("/dashboard/instances")}
				/>
			</div>
		</div>
	);
}
