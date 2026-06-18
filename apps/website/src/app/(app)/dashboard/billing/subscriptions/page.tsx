import configPromise from "@payload-config";
import { CreditCard, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { EmptyState, PageHeader } from "@/dashboard/ui";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

const PLAN_STYLES: Record<string, string> = {
	standard: "bg-tk-primary/8 text-tk-primary border-tk-primary/25",
	pro: "bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
	enterprise:
		"bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
};

const STATUS_STYLES: Record<string, string> = {
	active:
		"bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
	suspended:
		"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
	cancelled: "bg-tk-bg-deep text-tk-muted border-tk-border",
};

export default async function SubscriptionsPage() {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard.subscriptions;

	const payload = await getPayload({ config: configPromise });
	const { docs: subscriptions } = await payload.find({
		collection: "subscriptions",
		where: { client: { equals: user.id } },
		sort: "-createdAt",
		limit: 20,
	});

	return (
		<div>
			<PageHeader title={d.title} sub={d.sub} />

			{subscriptions.length === 0 ? (
				<EmptyState
					icon={<CreditCard size={22} strokeWidth={1.5} />}
					title={d.empty_title}
					sub={d.empty_sub}
					action={
						<a href="mailto:contact@tkams.com" className="tk-btn-primary">
							{d.empty_cta}
						</a>
					}
				/>
			) : (
				<div className="flex flex-col gap-4">
					{subscriptions.map((sub) => {
						const plan = (sub.plan ?? "standard") as string;
						const status = (sub.status ?? "active") as string;
						const planStyle = PLAN_STYLES[plan] ?? PLAN_STYLES.standard;
						const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.active;
						const planLabel = d.plans[plan as keyof typeof d.plans] ?? plan;
						const statusLabel =
							d.status[status as keyof typeof d.status] ?? status;

						const instanceRelation = sub.instance as
							| { subdomain?: string; orgName?: string }
							| string
							| null;
						const instanceLabel =
							typeof instanceRelation === "object" && instanceRelation
								? `${instanceRelation.subdomain ?? ""} — ${instanceRelation.orgName ?? ""}`
								: null;

						return (
							<div
								key={String(sub.id)}
								className="overflow-hidden rounded-[1rem] border border-tk-border bg-tk-surface"
							>
								{/* Header */}
								<div className="flex items-center justify-between gap-4 border-tk-border border-b px-6 py-4">
									<div className="flex items-center gap-3">
										<span
											className={`inline-flex items-center rounded-full border px-3 py-1 font-code font-semibold text-[0.8125rem] ${planStyle}`}
										>
											{planLabel}
										</span>
										{instanceLabel && (
											<span className="font-body text-[0.875rem] text-tk-muted">
												{instanceLabel}
											</span>
										)}
									</div>
									<span
										className={`inline-flex items-center rounded-full border px-2.5 py-1 font-code font-semibold text-[0.75rem] ${statusStyle}`}
									>
										{statusLabel}
									</span>
								</div>

								{/* Details grid */}
								<div className="flex flex-col divide-y divide-tk-border border-tk-border border-t sm:flex-row sm:divide-x sm:divide-y-0">
									{sub.studentCount != null && (
										<div className="px-5 py-4">
											<p className="font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
												{d.students_label}
											</p>
											<p className="mt-1 font-bold font-display text-[1.375rem] text-tk-ink leading-none">
												{sub.studentCount.toLocaleString()}
											</p>
										</div>
									)}

									{sub.annualAmount != null && (
										<div className="px-5 py-4">
											<p className="font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
												{d.amount_label}
											</p>
											<p className="mt-1 font-bold font-display text-[1.375rem] text-tk-ink leading-none">
												{sub.annualAmount.toLocaleString()}
												<span className="ml-1 font-body font-normal text-[0.75rem] text-tk-muted">
													{sub.currency ?? "FCFA"}
												</span>
											</p>
										</div>
									)}

									{sub.renewalDate && (
										<div className="px-5 py-4">
											<p className="font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
												{d.renewal_label}
											</p>
											<p className="mt-1 font-body font-semibold text-[0.9375rem] text-tk-ink">
												{new Date(sub.renewalDate as string).toLocaleDateString(
													"fr-FR",
													{ day: "numeric", month: "long", year: "numeric" },
												)}
											</p>
										</div>
									)}

									{sub.contractUrl && (
										<div className="flex items-center px-5 py-4">
											<a
												href={sub.contractUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 font-body font-medium text-[0.875rem] text-tk-primary no-underline hover:underline"
											>
												<ExternalLink size={13} strokeWidth={1.75} />
												{d.contract_link}
											</a>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export const metadata: Metadata = { title: "Abonnements — TKAMS" };
