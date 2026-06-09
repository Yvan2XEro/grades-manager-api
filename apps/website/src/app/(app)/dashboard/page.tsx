import configPromise from "@payload-config";
import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";
import { InstanceCard } from "@/dashboard/InstanceCard";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function DashboardHomePage() {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard;

	const payload = await getPayload({ config: configPromise });
	const { docs: instances } = await payload.find({
		collection: "instance-requests",
		where: { client: { equals: user.id } },
		sort: "-createdAt",
		limit: 50,
	});

	const activeCount = instances.filter((i) => i.status === "ready").length;
	const total = instances.length;

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

			{/* Metrics */}
			<div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
				{[
					{ label: d.home.active_label, value: activeCount },
					{ label: d.home.total_label, value: total },
				].map(({ label, value }) => (
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

			{/* Recent instances */}
			{instances.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-tk-border border-dashed py-20 text-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[0.875rem] bg-tk-primary/8">
						<svg
							width="22"
							height="22"
							viewBox="0 0 22 22"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-tk-primary"
						>
							<rect x="2" y="3" width="18" height="13" rx="2" />
							<path d="M7 19h8M11 16v3" />
						</svg>
					</div>
					<h2 className="mb-1.5 font-bold font-display text-[1rem] text-tk-ink">
						{d.home.no_instances}
					</h2>
					<p className="mb-5 max-w-xs font-body text-[0.875rem] text-tk-muted">
						{d.home.no_instances_sub}
					</p>
					<Link href="/dashboard/instances/new" className="tk-btn-primary">
						{d.home.create_cta}
					</Link>
				</div>
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
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
		</div>
	);
}

export const metadata: Metadata = { title: "Tableau de bord — TKAMS" };
