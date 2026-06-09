import Link from "next/link";
import type { Dict } from "@/i18n";

type InstanceStatus = "pending" | "provisioning" | "ready" | "failed";

type Instance = {
	id: string;
	orgName?: string | null;
	subdomain?: string | null;
	status?: string | null;
	progressStep?: number | null;
	instanceUrl?: string | null;
	createdAt?: string | null;
};

const STATUS_STYLES: Record<InstanceStatus, string> = {
	pending:
		"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
	provisioning: "bg-tk-primary/8 text-tk-primary border-tk-primary/25",
	ready:
		"bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
	failed:
		"bg-[oklch(0.65_0.2_25/0.06)] text-[oklch(0.5_0.18_25)] border-[oklch(0.65_0.2_25/0.25)]",
};

const BASE_DOMAIN = process.env.NEXT_PUBLIC_TKAMS_BASE_DOMAIN ?? "tkams.com";

export function InstanceCard({
	instance,
	dict: d,
}: {
	instance: Instance;
	dict: Dict;
}) {
	const dd = d.dashboard.instances;
	const status = (instance.status ?? "pending") as InstanceStatus;
	const statusLabel = d.dashboard.status[status] ?? status;
	const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

	const isProvisioning = status === "provisioning" || status === "pending";
	const isReady = status === "ready";

	return (
		<Link
			href={`/dashboard/instances/${instance.id}`}
			className="group block rounded-[1rem] border border-tk-border bg-tk-surface p-5 no-underline transition-all duration-200 hover:border-tk-primary/30 hover:shadow-[0_4px_20px_oklch(0.48_0.2_277/0.08)]"
		>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate font-bold font-display text-[1rem] text-tk-ink transition-colors duration-150 group-hover:text-tk-primary">
						{instance.subdomain}
						<span className="font-normal text-tk-muted">.{BASE_DOMAIN}</span>
					</p>
					<p className="mt-0.5 truncate font-body text-[0.8125rem] text-tk-muted">
						{instance.orgName ?? "—"}
					</p>
				</div>
				<span
					className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 font-code font-semibold text-[0.75rem] ${statusStyle}`}
				>
					{isProvisioning && (
						<span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
					)}
					{statusLabel}
				</span>
			</div>

			{isProvisioning && typeof instance.progressStep === "number" && (
				<div className="mb-3">
					<div className="h-1 overflow-hidden rounded-full bg-tk-bg-deep">
						<div
							className="h-full rounded-full bg-tk-primary transition-all duration-700"
							style={{
								width: `${Math.round((instance.progressStep / 5) * 100)}%`,
							}}
						/>
					</div>
					<p className="mt-1 font-body text-[0.75rem] text-tk-muted">
						{instance.progressStep}/5 étapes
					</p>
				</div>
			)}

			<div className="flex items-center justify-between">
				<p className="font-code text-[0.75rem] text-tk-muted">
					{dd.created}{" "}
					{instance.createdAt
						? new Date(instance.createdAt).toLocaleDateString("fr-FR", {
								day: "numeric",
								month: "short",
								year: "numeric",
							})
						: "—"}
				</p>
				{isReady && (
					<span className="font-body font-medium text-[0.8125rem] text-tk-primary group-hover:underline">
						{dd.open_instance}
					</span>
				)}
			</div>
		</Link>
	);
}
