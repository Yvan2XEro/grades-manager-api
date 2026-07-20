import configPromise from "@payload-config";
import { CheckCircle2, Clock, Download, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { PayButton } from "@/dashboard/PayButton";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

type PaymentState = "success" | "failed" | "pending" | null;

const statusStyles: Record<string, string> = {
	paid: "bg-[oklch(0.58_0.17_149/0.1)] text-[oklch(0.42_0.14_149)] border-[oklch(0.58_0.17_149/0.3)]",
	unpaid:
		"bg-[oklch(0.72_0.16_86/0.12)] text-[oklch(0.52_0.14_86)] border-[oklch(0.72_0.16_86/0.3)]",
	cancelled: "bg-tk-bg-deep text-tk-muted border-tk-border",
};

export default async function BillingPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const params = await searchParams;
	const paymentState = (params.payment ?? null) as PaymentState;

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

	return (
		<div>
			<div className="mb-8">
				<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
					{d.title}
				</h1>
				<p className="mt-0.5 font-body text-[0.9375rem] text-tk-muted">
					{d.sub}
				</p>
			</div>

			{/* Payment status banners */}
			{paymentState === "success" && (
				<div className="mb-6 flex items-start gap-3 rounded-[0.875rem] border border-[oklch(0.58_0.17_149/0.3)] bg-[oklch(0.58_0.17_149/0.06)] px-5 py-4">
					<CheckCircle2
						size={18}
						strokeWidth={1.75}
						className="mt-0.5 flex-shrink-0 text-[oklch(0.42_0.14_149)]"
					/>
					<div>
						<p className="font-body font-semibold text-[0.9375rem] text-[oklch(0.35_0.12_149)]">
							{d.payment_success_title}
						</p>
						<p className="mt-0.5 font-body text-[0.875rem] text-[oklch(0.42_0.14_149)]">
							{d.payment_success_sub}
						</p>
					</div>
				</div>
			)}
			{paymentState === "failed" && (
				<div className="mb-6 flex items-start gap-3 rounded-[0.875rem] border border-[oklch(0.65_0.2_25/0.3)] bg-[oklch(0.65_0.2_25/0.05)] px-5 py-4">
					<XCircle
						size={18}
						strokeWidth={1.75}
						className="mt-0.5 flex-shrink-0 text-[oklch(0.5_0.18_25)]"
					/>
					<div>
						<p className="font-body font-semibold text-[0.9375rem] text-[oklch(0.45_0.18_25)]">
							{d.payment_failed_title}
						</p>
						<p className="mt-0.5 font-body text-[0.875rem] text-[oklch(0.5_0.18_25)]">
							{d.payment_failed_sub}
						</p>
					</div>
				</div>
			)}
			{paymentState === "pending" && (
				<div className="mb-6 flex items-start gap-3 rounded-[0.875rem] border border-[oklch(0.72_0.16_86/0.3)] bg-[oklch(0.72_0.16_86/0.06)] px-5 py-4">
					<Clock
						size={18}
						strokeWidth={1.75}
						className="mt-0.5 flex-shrink-0 text-[oklch(0.52_0.14_86)]"
					/>
					<div>
						<p className="font-body font-semibold text-[0.9375rem] text-[oklch(0.45_0.12_86)]">
							{d.payment_pending_title}
						</p>
						<p className="mt-0.5 font-body text-[0.875rem] text-[oklch(0.52_0.14_86)]">
							{d.payment_pending_sub}
						</p>
					</div>
				</div>
			)}

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
							const isPaid = status === "paid";
							const isCancelled = status === "cancelled";
							const canPay = !isPaid && !isCancelled;

							return (
								<div key={String(inv.id)} className="px-5 py-4">
									{/* Top row: info + badge */}
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="font-body font-semibold text-[0.9375rem] text-tk-ink">
												{d.invoice_number} {inv.invoiceNumber}
											</p>
											{inv.period && (
												<p className="mt-0.5 font-body text-[0.8125rem] text-tk-muted">
													{inv.period}
												</p>
											)}
										</div>
										<span
											className={`mt-0.5 inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 font-code font-semibold text-[0.75rem] ${style}`}
										>
											{d.status[status as keyof typeof d.status] ?? status}
										</span>
									</div>

									{/* Bottom row: amount + actions */}
									<div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
										<div>
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
										<div className="flex items-center gap-2">
											{isPaid && (
												<a
													href={`/api/invoices/${inv.id}/receipt`}
													className="inline-flex flex-shrink-0 items-center gap-1.5 font-body text-[0.8125rem] text-tk-primary no-underline hover:underline"
												>
													<Download size={13} strokeWidth={1.75} />
													{d.download_receipt}
												</a>
											)}
											{!isPaid && inv.pdfUrl && (
												<a
													href={inv.pdfUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="flex-shrink-0 font-body text-[0.8125rem] text-tk-primary no-underline hover:underline"
												>
													{d.download_pdf}
												</a>
											)}
											{canPay && (
												<PayButton
													invoiceId={String(inv.id)}
													label={d.pay_now}
													errorLabel={d.pay_error}
												/>
											)}
										</div>
									</div>
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
