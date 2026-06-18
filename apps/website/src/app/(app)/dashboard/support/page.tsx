import configPromise from "@payload-config";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { SupportForm } from "@/dashboard/SupportForm";
import { PageHeader } from "@/dashboard/ui";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function SupportPage() {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard.support;

	const payload = await getPayload({ config: configPromise });

	const [{ docs: instances }, { docs: tickets }] = await Promise.all([
		payload.find({
			collection: "instance-requests",
			where: {
				client: { equals: user.id },
				status: { in: ["ready", "stopped", "failed"] },
			},
			sort: "-createdAt",
			limit: 20,
		}),
		payload.find({
			collection: "support-tickets",
			where: { from: { equals: user.id } },
			sort: "-createdAt",
			limit: 10,
		}),
	]);

	return (
		<div>
			<PageHeader title={d.title} sub={d.sub} />

			<div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_280px]">
				<div>
					<h2 className="mb-4 font-display font-semibold text-[1rem] text-tk-ink">
						{d.form_title}
					</h2>
					<SupportForm
						user={user}
						dict={dict}
						instances={instances.map((i) => ({
							id: String(i.id),
							subdomain: i.subdomain,
							orgName: i.orgName,
						}))}
						tickets={tickets.map((t) => ({
							id: String(t.id),
							subject: t.subject,
							status: t.status ?? "open",
							createdAt: t.createdAt,
						}))}
					/>
				</div>

				{/* Contact info */}
				<div className="rounded-[1rem] border border-tk-border bg-tk-surface p-5">
					<h3 className="mb-4 font-display font-semibold text-[0.9375rem] text-tk-ink">
						{d.faq_title}
					</h3>
					<div className="flex flex-col gap-3">
						<div>
							<p className="mb-0.5 font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
								{d.email_label}
							</p>
							<a
								href="mailto:contact@tkams.com"
								className="font-body text-[0.875rem] text-tk-primary no-underline hover:underline"
							>
								contact@tkams.com
							</a>
						</div>
						<div>
							<p className="mb-0.5 font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
								Délai de réponse
							</p>
							<p className="font-body text-[0.875rem] text-tk-ink">
								24h ouvrables
							</p>
						</div>
						<div>
							<p className="mb-0.5 font-code text-[0.6875rem] text-tk-muted uppercase tracking-[0.08em]">
								Localisation
							</p>
							<p className="font-body text-[0.875rem] text-tk-ink">
								Douala · Yaoundé
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export const metadata: Metadata = { title: "Support — TKAMS" };
