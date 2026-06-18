import type { Metadata } from "next";
import { ProfileForm } from "@/dashboard/ProfileForm";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function SettingsPage() {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	const d = dict.dashboard.settings;

	return (
		<div>
			<div className="mb-8">
				<h1 className="font-bold font-display text-[1.5rem] text-tk-ink tracking-[-0.03em]">
					{d.title}
				</h1>
			</div>

			<div className="max-w-lg">
				<div className="mb-6">
					<h2 className="mb-0.5 font-display font-semibold text-[1rem] text-tk-ink">
						{d.profile_title}
					</h2>
					<p className="font-body text-[0.875rem] text-tk-muted">
						{d.profile_sub}
					</p>
				</div>
				<ProfileForm user={user} dict={dict} />
			</div>
		</div>
	);
}

export const metadata: Metadata = { title: "Profil — TKAMS" };
