import type { Metadata } from "next";
import { PasswordForm } from "@/dashboard/PasswordForm";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function SecurityPage() {
	await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard.settings;

	return (
		<div>
			<div className="mb-8">
				<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
					{d.security_title}
				</h1>
				<p className="mt-0.5 font-body text-[0.9375rem] text-tk-muted">
					{d.security_sub}
				</p>
			</div>
			<div className="max-w-lg">
				<PasswordForm dict={dict} />
			</div>
		</div>
	);
}

export const metadata: Metadata = { title: "Sécurité — TKAMS" };
