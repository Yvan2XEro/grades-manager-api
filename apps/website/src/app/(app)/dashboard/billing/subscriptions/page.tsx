import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function SubscriptionsPage() {
	await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard.billing;

	return (
		<div>
			<div className="mb-8">
				<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
					{d.subscriptions_title}
				</h1>
				<p className="mt-0.5 font-body text-[0.9375rem] text-tk-muted">
					{d.sub}
				</p>
			</div>

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
					<circle cx="18" cy="18" r="15" />
					<path d="M18 10v8l4 4" />
				</svg>
				<p className="font-body text-[0.9375rem] text-tk-muted">
					{d.subscriptions_empty}
				</p>
			</div>
		</div>
	);
}

export const metadata: Metadata = { title: "Abonnements — TKAMS" };
