import configPromise from "@payload-config";
import { Monitor } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";
import { InstanceCard } from "@/dashboard/InstanceCard";
import { AlertBanner, EmptyState } from "@/dashboard/ui";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function DashboardHomePage() {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard;

	const payload = await getPayload({ config: configPromise });

	const [{ docs: instances }, { docs: invoices }] = await Promise.all([
		payload.find({
			collection: "instance-requests",
			where: { client: { equals: user.id } },
			sort: "-createdAt",
			limit: 50,
		}),
		payload.find({
			collection: "invoices",
			where: { client: { equals: user.id } },
			sort: "-createdAt",
			limit: 3,
		}),
	]);

	const activeCount = instances.filter((i) => i.status === "ready").length;
	const stoppedCount = instances.filter((i) => i.status === "stopped").length;
	const failedCount = instances.filter((i) => i.status === "failed").length;
	const total = instances.length;

	const metrics = [
		{ label: d.home.active_label, value: activeCount },
		{ label: d.home.total_label, value: total },
		{ label: d.home.stopped_label, value: stoppedCount },
		{ label: d.home.failed_label, value: failedCount },
	];

	const statusStyles: Record<string, string> = {
		paid: "bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
		unpaid:
			"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
		cancelled: "bg-tk-bg-deep text-tk-muted border-tk-border",
	};

	return (
		<div>
			<div className="mb-8">
				<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
					{d.greeting} {user.name?.split(" ")[0] ?? user.email}
				</h1>
				<p className="mt-0.5 font-body text-[0.9375rem] text-tk-muted">
					{d.home.sub}
				</p>
			</div>

			{/* Alerts */}
			{(failedCount > 0 || stoppedCount > 0) && (
				<div className="mb-6 flex flex-col gap-2">
					{failedCount > 0 && (
						<AlertBanner
							variant="error"
							action={
								<Link
									href="/dashboard/instances"
									className="font-body font-semibold text-[0.8125rem] text-[oklch(0.45_0.18_25)] no-underline hover:underline"
								>
									{d.home.alert_action}
								</Link>
							}
						>
							<strong>{failedCount}</strong> {d.home.alert_failed}
						</AlertBanner>
					)}
					{stoppedCount > 0 && (
						<AlertBanner
							variant="warning"
							action={
								<Link
									href="/dashboard/instances"
									className="font-body font-semibold text-[0.8125rem] text-[oklch(0.45_0.14_86)] no-underline hover:underline"
								>
									{d.home.alert_action}
								</Link>
							}
						>
							<strong>{stoppedCount}</strong> {d.home.alert_stopped}
						</AlertBanner>
					)}
				</div>
			)}

			{/* Metrics */}
			<div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
				{metrics.map(({ label, value }) => (
					<div
						key={label}
						className="rounded-[1rem] border border-tk-border bg-tk-surface px-5 py-4"
					>
						<p className="font-bold font-display text-[2rem] text-tk-ink leading-none">
							{value}
						</p>
						<p className="mt-1.5 font-body text-[0.8125rem] text-tk-muted">
							{label}
						</p>
					</div>
				))}
			</div>

			{/* Instances */}
			{instances.length === 0 ? (
				<EmptyState
					icon={<Monitor size={22} strokeWidth={1.5} />}
					title={d.home.no_instances}
					sub={d.home.no_instances_sub}
					action={
						<Link href="/dashboard/instances/new" className="tk-btn-primary">
							{d.home.create_cta}
						</Link>
					}
				/>
			) : (
				<>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-display font-semibold text-[1rem] text-tk-ink">
							{d.home.recent_label}
						</h2>
						<Link
							href="/dashboard/instances"
							className="font-body text-[0.875rem] text-tk-primary no-underline hover:underline"
						>
							{d.instances.title} →
						</Link>
					</div>
					<div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{instances.slice(0, 6).map((instance) => (
							<InstanceCard
								key={String(instance.id)}
								instance={{
									id: String(instance.id),
									orgName: instance.orgName,
									subdomain: instance.subdomain,
									status: instance.status,
									progressStep: instance.progressStep,
									instanceUrl: instance.instanceUrl,
									createdAt: instance.createdAt,
								}}
								dict={dict}
							/>
						))}
					</div>
				</>
			)}

			{/* Recent invoices */}
			<div>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-display font-semibold text-[1rem] text-tk-ink">
						{d.home.invoices_title}
					</h2>
					<Link
						href="/dashboard/billing"
						className="font-body text-[0.875rem] text-tk-primary no-underline hover:underline"
					>
						{d.home.invoices_view_all}
					</Link>
				</div>

				{invoices.length === 0 ? (
					<p className="font-body text-[0.875rem] text-tk-muted">
						{d.home.invoices_empty}
					</p>
				) : (
					<div className="overflow-hidden rounded-[1rem] border border-tk-border bg-tk-surface">
						<div className="divide-y divide-tk-border">
							{invoices.map((inv) => {
								const status = (inv.status ?? "unpaid") as string;
								const style = statusStyles[status] ?? statusStyles.unpaid;
								const statusLabel =
									d.billing.status[status as keyof typeof d.billing.status] ??
									status;
								return (
									<div
										key={String(inv.id)}
										className="flex items-center gap-4 px-5 py-4"
									>
										<div className="min-w-0 flex-1">
											<p className="font-body font-semibold text-[0.9375rem] text-tk-ink">
												{d.billing.invoice_number} {inv.invoiceNumber}
											</p>
											{inv.period && (
												<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted">
													{inv.period}
												</p>
											)}
										</div>
										<p className="flex-shrink-0 font-body font-semibold text-[0.9375rem] text-tk-ink">
											{inv.amount?.toLocaleString()} {inv.currency}
										</p>
										<span
											className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 font-code font-semibold text-[0.75rem] ${style}`}
										>
											{statusLabel}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export const metadata: Metadata = { title: "Tableau de bord — TKAMS" };
