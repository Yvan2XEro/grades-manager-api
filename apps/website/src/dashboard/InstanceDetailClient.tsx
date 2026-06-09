"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import type { Dict } from "@/i18n";

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

const STATUS_STYLES: Record<string, string> = {
	pending:
		"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
	provisioning: "bg-tk-primary/8 text-tk-primary border-tk-primary/25",
	ready:
		"bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
	failed:
		"bg-[oklch(0.65_0.2_25/0.06)] text-[oklch(0.5_0.18_25)] border-[oklch(0.65_0.2_25/0.25)]",
};

function CopyButton({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			title="Copier"
			onClick={async () => {
				await navigator.clipboard.writeText(value);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}}
			className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-tk-muted transition-all duration-150 hover:bg-tk-bg-deep hover:text-tk-primary"
		>
			{copied ? (
				<svg
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M1.5 6l3 3 6-6" />
				</svg>
			) : (
				<svg
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="4" y="4" width="7" height="7" rx="1" />
					<path d="M8 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" />
				</svg>
			)}
		</button>
	);
}

function InfoRow({
	label,
	value,
	copyable = false,
	mono = false,
	link,
}: {
	label: string;
	value: string;
	copyable?: boolean;
	mono?: boolean;
	link?: string;
}) {
	return (
		<div className="flex items-center justify-between gap-4 border-tk-border border-b py-3 last:border-0">
			<span className="w-32 flex-shrink-0 font-code text-[0.75rem] text-tk-muted uppercase tracking-[0.07em]">
				{label}
			</span>
			<div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
				{link ? (
					<a
						href={link}
						target="_blank"
						rel="noopener noreferrer"
						className={`truncate text-[0.875rem] text-tk-primary no-underline hover:underline ${mono ? "font-code" : "font-body"}`}
					>
						{value}
					</a>
				) : (
					<span
						className={`truncate text-[0.875rem] text-tk-ink ${mono ? "font-code" : "font-body"}`}
					>
						{value}
					</span>
				)}
				{copyable && <CopyButton value={value} />}
			</div>
		</div>
	);
}

function SectionCard({
	title,
	sub,
	children,
}: {
	title: string;
	sub?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-[1rem] border border-tk-border bg-tk-surface p-6">
			<div className="mb-4">
				<h2 className="font-display font-semibold text-[0.9375rem] text-tk-ink">
					{title}
				</h2>
				{sub && (
					<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted">
						{sub}
					</p>
				)}
			</div>
			{children}
		</div>
	);
}

function ActionButton({
	label,
	icon,
	variant = "outline",
	loading = false,
	disabled = false,
	danger = false,
	onClick,
}: {
	label: string;
	icon: React.ReactNode;
	variant?: "outline" | "ghost";
	loading?: boolean;
	disabled?: boolean;
	danger?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			className={`flex items-center gap-2 rounded-[0.625rem] border px-3.5 py-2 font-body font-medium text-[0.8125rem] transition-all duration-150 ${
				disabled || loading
					? "cursor-not-allowed border-tk-border text-tk-muted opacity-50"
					: danger
						? "border-[oklch(0.65_0.2_25/0.3)] text-[oklch(0.5_0.18_25)] hover:border-[oklch(0.65_0.2_25/0.5)] hover:bg-[oklch(0.65_0.2_25/0.06)]"
						: "border-tk-border text-tk-ink-soft hover:border-tk-ink/20 hover:bg-tk-bg-deep hover:text-tk-ink"
			}`}
		>
			{loading ? (
				<svg
					width="13"
					height="13"
					viewBox="0 0 13 13"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.75"
					className="animate-spin"
				>
					<path
						d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2M2.6 2.6l1.4 1.4M9 9l1.4 1.4M2.6 10.4l1.4-1.4M9 4l1.4-1.4"
						strokeLinecap="round"
					/>
				</svg>
			) : (
				icon
			)}
			{label}
		</button>
	);
}

// ─── Delete zone with confirmation input ─────────────────────────────────────
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
		<div className="rounded-[1rem] border-2 border-[oklch(0.65_0.2_25/0.2)] bg-[oklch(0.65_0.2_25/0.02)] p-6">
			<div className="mb-5 flex items-start gap-3">
				<div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.5rem] bg-[oklch(0.65_0.2_25/0.1)]">
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.75"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-[oklch(0.5_0.18_25)]"
					>
						<path d="M7 1L1 12h12L7 1z" />
						<path d="M7 5v3M7 10v.5" />
					</svg>
				</div>
				<div>
					<h3 className="font-display font-semibold text-[0.9375rem] text-[oklch(0.45_0.18_25)]">
						{dd.danger_delete_title}
					</h3>
					<p className="mt-1 font-body text-[0.8125rem] text-tk-muted leading-relaxed">
						{dd.danger_delete_desc}
					</p>
				</div>
			</div>

			<div className="flex flex-col items-start gap-3 sm:flex-row">
				<div className="min-w-0 flex-1">
					<label className="mb-1.5 block font-code text-[0.75rem] text-tk-muted uppercase tracking-[0.07em]">
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
						className="w-full rounded-[0.5rem] border border-tk-border bg-tk-bg px-3.5 py-2.5 font-code text-[0.875rem] text-tk-ink outline-none transition-colors focus:border-[oklch(0.65_0.2_25/0.5)]"
						disabled={deleting}
					/>
				</div>
				<button
					type="button"
					onClick={handleDelete}
					disabled={!match || deleting}
					className={`flex flex-shrink-0 items-center gap-2 rounded-[0.625rem] border px-4 py-2.5 font-body font-semibold text-[0.8125rem] transition-all duration-150 ${
						match && !deleting
							? "border-transparent bg-[oklch(0.65_0.2_25)] text-white hover:bg-[oklch(0.55_0.2_25)]"
							: "cursor-not-allowed border-[oklch(0.65_0.2_25/0.3)] bg-transparent text-[oklch(0.5_0.18_25)] opacity-40"
					}`}
				>
					<svg
						width="13"
						height="13"
						viewBox="0 0 13 13"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.75"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M2 3h9M5 3V2h3v1M3 3l.7 8h5.6L10 3" />
					</svg>
					{deleting ? dd.danger_deleting : dd.danger_delete_btn}
				</button>
			</div>
			{error && (
				<p className="mt-3 font-body text-[0.8125rem] text-[oklch(0.5_0.18_25)]">
					{error}
				</p>
			)}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InstanceDetailClient({
	instance: initial,
	dict: d,
}: {
	instance: InstanceData;
	dict: Dict;
}) {
	const dd = d.dashboard.detail;
	const router = useRouter();
	const [instance, setInstance] = useState(initial);
	const [actionLoading, setActionLoading] = useState<
		"restart" | "stop" | "start" | null
	>(null);
	const [actionError, setActionError] = useState("");

	// Poll provisioning status
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
			if (!res.ok) {
				const data = await res.json();
				setActionError(data.error ?? dd.action_error);
			}
		} catch {
			setActionError(dd.action_error);
		} finally {
			setActionLoading(null);
		}
	};

	const isProvisioning =
		instance.status === "provisioning" || instance.status === "pending";
	const isReady = instance.status === "ready";
	const isFailed = instance.status === "failed";
	const statusStyle = STATUS_STYLES[instance.status] ?? STATUS_STYLES.pending;
	const statusBadge = isReady
		? dd.ready_badge
		: isProvisioning
			? dd.provisioning_badge
			: isFailed
				? dd.failed_badge
				: instance.status;

	const institutionTypes: Record<string, string> = {
		university: "Université",
		school: "Grande École",
		institute: "Institut",
		secondary: "Lycée / Secondaire",
		other: "Autre",
	};

	return (
		<div className="max-w-3xl">
			<Link
				href="/dashboard/instances"
				className="mb-6 inline-flex items-center gap-1.5 font-body text-[0.8125rem] text-tk-muted no-underline transition-colors hover:text-tk-ink"
			>
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
					<path d="M9 3L5 7l4 4" />
				</svg>
				{dd.back}
			</Link>

			{/* ── Header ── */}
			<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
						{instance.subdomain}
						<span className="font-normal text-tk-muted">.{BASE_DOMAIN}</span>
					</h1>
					<p className="mt-0.5 font-body text-[0.9375rem] text-tk-muted">
						{instance.orgName}
					</p>
				</div>
				<span
					className={`inline-flex items-center rounded-full border px-3 py-1.5 font-code font-semibold text-[0.8125rem] ${statusStyle}`}
				>
					{isProvisioning && (
						<span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-current" />
					)}
					{statusBadge}
				</span>
			</div>

			{/* ── Action bar (ready only) ── */}
			{isReady && (
				<div className="mb-7 flex flex-wrap items-center gap-2">
					{instance.instanceUrl && (
						<a
							href={instance.instanceUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="tk-btn-primary flex items-center gap-2"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.75"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M7 3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8" />
								<path d="M10 1h3v3M7 7l6-6" />
							</svg>
							{dd.open_instance}
						</a>
					)}
					<ActionButton
						label={dd.action_restart}
						icon={
							<svg
								width="13"
								height="13"
								viewBox="0 0 13 13"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.75"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M11 6.5A4.5 4.5 0 1 1 8.5 2.3" />
								<path d="M11 1v3H8" />
							</svg>
						}
						loading={actionLoading === "restart"}
						disabled={actionLoading !== null}
						onClick={() => handleAction("restart")}
					/>
					<ActionButton
						label={dd.action_stop}
						icon={
							<svg
								width="13"
								height="13"
								viewBox="0 0 13 13"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.75"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="3" width="7" height="7" rx="1" />
							</svg>
						}
						loading={actionLoading === "stop"}
						disabled={actionLoading !== null}
						onClick={() => handleAction("stop")}
					/>
				</div>
			)}

			{/* Start button when stopped */}
			{isFailed && (
				<div className="mb-7 flex flex-wrap items-center gap-2">
					<ActionButton
						label={dd.action_start}
						icon={
							<svg
								width="13"
								height="13"
								viewBox="0 0 13 13"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.75"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M3 2l8 4.5L3 11V2z" />
							</svg>
						}
						loading={actionLoading === "start"}
						disabled={actionLoading !== null}
						onClick={() => handleAction("start")}
					/>
				</div>
			)}

			{actionError && (
				<div className="mb-5 rounded-[0.625rem] border border-[oklch(0.65_0.2_25/0.2)] bg-[oklch(0.65_0.2_25/0.05)] px-4 py-3 font-body text-[0.875rem] text-[oklch(0.5_0.18_25)]">
					{actionError}
				</div>
			)}

			{/* ── Provisioning progress ── */}
			{isProvisioning && (
				<SectionCard title={dd.provisioning_title} sub={dd.provisioning_sub}>
					<div className="flex flex-col gap-2">
						{dd.progress_steps.map((label, i) => {
							const step = instance.progressStep ?? 0;
							const done = i < step;
							const active = i === step;
							return (
								<div
									key={i}
									className={`flex items-center gap-3 rounded-[0.625rem] border px-4 py-2.5 transition-all duration-300 ${done ? "border-[oklch(0.58_0.17_149/0.2)] bg-[oklch(0.58_0.17_149/0.03)]" : active ? "border-tk-primary/30 bg-tk-primary/4" : "border-tk-border bg-tk-bg"}`}
								>
									<div
										className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${done ? "bg-tk-accent-emerald" : active ? "border-2 border-tk-primary" : "border border-tk-border bg-tk-bg-deep"}`}
									>
										{done ? (
											<svg
												width="10"
												height="10"
												viewBox="0 0 10 10"
												fill="none"
											>
												<path
													d="M1.5 5l2.5 2.5 4.5-4.5"
													stroke="white"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										) : active ? (
											<div className="h-2 w-2 animate-pulse rounded-full bg-tk-primary" />
										) : null}
									</div>
									<span
										className={`font-body text-[0.875rem] ${done ? "text-tk-ink" : active ? "font-medium text-tk-ink" : "text-tk-muted"}`}
									>
										{label}
									</span>
								</div>
							);
						})}
					</div>
				</SectionCard>
			)}

			<div className="mt-1 flex flex-col gap-5">
				{/* ── General info ── */}
				<SectionCard title={dd.overview_title}>
					<InfoRow
						label={dd.url_label}
						value={
							instance.instanceUrl ??
							`https://${instance.subdomain}.${BASE_DOMAIN}`
						}
						copyable
						link={instance.instanceUrl ?? undefined}
						mono
					/>
					<InfoRow
						label={dd.subdomain_label}
						value={`${instance.subdomain}.${BASE_DOMAIN}`}
						copyable
						mono
					/>
					<InfoRow label={dd.status_label} value={statusBadge} />
					<InfoRow
						label={dd.institution_type_label}
						value={
							institutionTypes[instance.institutionType ?? ""] ??
							instance.institutionType ??
							"—"
						}
					/>
					<InfoRow label={dd.country_label} value={instance.country ?? "—"} />
					<InfoRow
						label={dd.admin_name_label}
						value={instance.adminName ?? "—"}
					/>
					<InfoRow
						label={dd.admin_email_label}
						value={instance.adminEmail ?? "—"}
						copyable
					/>
					<InfoRow
						label={dd.created_label}
						value={
							instance.createdAt
								? new Date(instance.createdAt).toLocaleDateString("fr-FR", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})
								: "—"
						}
					/>
				</SectionCard>

				{/* ── Infrastructure ── */}
				{(instance.dokployAppId ||
					instance.dokployPostgresId ||
					instance.dokployProjectId) && (
					<SectionCard title={dd.infra_title} sub={dd.infra_sub}>
						{instance.dokployAppId && (
							<InfoRow
								label={dd.app_id_label}
								value={instance.dokployAppId}
								copyable
								mono
							/>
						)}
						{instance.dokployPostgresId && (
							<InfoRow
								label={dd.db_id_label}
								value={instance.dokployPostgresId}
								copyable
								mono
							/>
						)}
						{instance.dokployProjectId && (
							<InfoRow
								label={dd.project_id_label}
								value={instance.dokployProjectId}
								copyable
								mono
							/>
						)}
					</SectionCard>
				)}

				{/* ── Seed data ── */}
				<SectionCard title={dd.seed_title} sub={dd.seed_sub}>
					<div className="flex items-center justify-between border-tk-border border-b py-2.5">
						<span className="font-code text-[0.75rem] text-tk-muted uppercase tracking-[0.07em]">
							{dd.seed_mode_label}
						</span>
						<span className="font-body font-medium text-[0.875rem] text-tk-ink">
							{initial.seedMode === "demo"
								? dd.seed_mode_demo
								: initial.seedMode === "custom"
									? dd.seed_mode_custom
									: dd.seed_mode_empty}
						</span>
					</div>
					{initial.seedMode !== "empty" && (
						<div className="flex flex-col gap-0">
							{(
								[
									[
										d.register.seed.templates.structure.title,
										initial.seedFoundationYaml,
									],
									[
										d.register.seed.templates.programmes.title,
										initial.seedAcademicsYaml,
									],
									[
										d.register.seed.templates.equipe.title,
										initial.seedUsersYaml,
									],
								] as [string, string | null][]
							).map(([title, yaml]) => (
								<div
									key={title}
									className="flex items-center justify-between border-tk-border border-b py-2.5 last:border-0"
								>
									<span className="font-body text-[0.875rem] text-tk-ink">
										{title}
									</span>
									<span
										className={`font-code font-semibold text-[0.75rem] ${yaml ? "text-tk-accent-emerald" : "text-tk-muted"}`}
									>
										{yaml ? `✓ ${dd.seed_loaded}` : dd.seed_empty}
									</span>
								</div>
							))}
						</div>
					)}
				</SectionCard>

				{/* ── Error detail ── */}
				{isFailed && instance.errorMessage && (
					<div className="rounded-[1rem] border border-[oklch(0.65_0.2_25/0.2)] bg-[oklch(0.65_0.2_25/0.04)] p-5">
						<h2 className="mb-2 font-display font-semibold text-[0.9375rem] text-[oklch(0.45_0.18_25)]">
							{dd.failed_title}
						</h2>
						<pre className="whitespace-pre-wrap break-all font-code text-[0.8125rem] text-tk-muted leading-relaxed">
							{instance.errorMessage}
						</pre>
					</div>
				)}

				{/* ── Danger zone ── */}
				<div>
					<h2 className="mb-3 font-code font-semibold text-[0.875rem] text-[oklch(0.5_0.18_25)] uppercase tracking-[0.08em]">
						{dd.danger_title}
					</h2>
					<DangerZone
						instance={instance}
						dict={d}
						onDeleted={() => router.push("/dashboard/instances")}
					/>
				</div>
			</div>
		</div>
	);
}
