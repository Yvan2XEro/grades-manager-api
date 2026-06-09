import configPromise from "@payload-config";
import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function BillingPage() {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard.billing;

	const payload = await getPayload({ config: configPromise });
	const { docs: invoices } = await payload.find({
		collection: "invoices",
		where: { client: { equals: user.id } },
		sort: "-createdAt",
		limit: 50,
	});

	const statusStyles: Record<string, string> = {
		paid: "bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
		unpaid:
			"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
		cancelled: "bg-tk-bg-deep text-tk-muted border-tk-border",
	};

	return (
		<div>
			<div className="mb-8 flex items-start justify-between gap-4">
				<div>
					<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
						{d.title}
					</h1>
					<p className="mt-0.5 font-body text-[0.9375rem] text-tk-muted">
						{d.sub}
					</p>
				</div>
				<Link
					href="/dashboard/billing/subscriptions"
					className="tk-btn-outline flex-shrink-0 text-[0.875rem]"
				>
					{d.subscriptions_title}
				</Link>
			</div>

			<h2 className="mb-4 font-display font-semibold text-[1rem] text-tk-ink">
				{d.invoices_title}
			</h2>

			{invoices.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-tk-border border-dashed py-16 text-center">
					<svg
						width="36"
						height="36"
						viewBox="0 0 36 36"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.25"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="mb-4 text-tk-muted"
					>
						<rect x="6" y="3" width="24" height="30" rx="2" />
						<path d="M13 12h10M13 18h10M13 24h6" />
					</svg>
					<p className="font-body text-[0.9375rem] text-tk-muted">
						{d.invoices_empty}
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-[1rem] border border-tk-border bg-tk-surface">
					<div className="divide-y divide-tk-border">
						{invoices.map((inv) => {
							const status = (inv.status ?? "unpaid") as string;
							const style = statusStyles[status] ?? statusStyles.unpaid;
							return (
								<div
									key={String(inv.id)}
									className="flex items-center gap-4 px-5 py-4"
								>
									<div className="min-w-0 flex-1">
										<p className="font-body font-semibold text-[0.9375rem] text-tk-ink">
											{d.invoice_number} {inv.invoiceNumber}
										</p>
										{inv.period && (
											<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted">
												{inv.period}
											</p>
										)}
									</div>
									<div className="flex-shrink-0 text-right">
										<p className="font-body font-semibold text-[0.9375rem] text-tk-ink">
											{inv.amount?.toLocaleString()} {inv.currency}
										</p>
										{inv.dueDate && (
											<p className="mt-0.5 font-code text-[0.75rem] text-tk-muted">
												{d.due_label}:{" "}
												{new Date(inv.dueDate).toLocaleDateString("fr-FR", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</p>
										)}
									</div>
									<span
										className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 font-code font-semibold text-[0.75rem] ${style}`}
									>
										{d.status[status as keyof typeof d.status] ?? status}
									</span>
									{inv.pdfUrl && (
										<a
											href={inv.pdfUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex-shrink-0 font-body text-[0.8125rem] text-tk-primary no-underline hover:underline"
										>
											{d.download_pdf}
										</a>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

export const metadata: Metadata = { title: "Facturation — TKAMS" };
