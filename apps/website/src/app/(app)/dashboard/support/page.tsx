import type { Metadata } from "next";
import { SupportForm } from "@/dashboard/SupportForm";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function SupportPage() {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard.support;

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

			<div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_280px]">
				<div>
					<h2 className="mb-4 font-display font-semibold text-[1rem] text-tk-ink">
						{d.form_title}
					</h2>
					<SupportForm user={user} dict={dict} />
				</div>
				<div className="rounded-[1rem] border border-tk-border bg-tk-surface p-5">
					<h3 className="mb-3 font-display font-semibold text-[0.875rem] text-tk-ink">
						{d.faq_title}
					</h3>
					<div className="flex items-center gap-2.5">
						<svg
							width="14"
							height="14"
							viewBox="0 0 14 14"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							className="flex-shrink-0 text-tk-primary"
						>
							<path d="M2 3h10M2 7h7M2 11h5" />
						</svg>
						<span className="font-body text-[0.8125rem] text-tk-muted">
							{d.email_label}
						</span>
					</div>
					<a
						href="mailto:contact@tkams.com"
						className="mt-1 block font-body text-[0.875rem] text-tk-primary no-underline hover:underline"
					>
						contact@tkams.com
					</a>
				</div>
			</div>
		</div>
	);
}

export const metadata: Metadata = { title: "Support — TKAMS" };
