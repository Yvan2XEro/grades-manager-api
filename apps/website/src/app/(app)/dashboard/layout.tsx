import type React from "react";
import { DashboardShell } from "@/dashboard/DashboardShell";
import { getDict, getLocale } from "@/i18n";
import { getMeUser } from "@/utilities/getMeUser";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = await getMeUser({ nullUserRedirect: "/login" });
	const locale = await getLocale();
	const dict = getDict(locale);
	return (
		<DashboardShell user={user} dict={dict}>
			{children}
		</DashboardShell>
	);
}
