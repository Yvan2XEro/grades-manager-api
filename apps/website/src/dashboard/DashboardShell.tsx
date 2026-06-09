import type React from "react";
import type { Dict } from "@/i18n";
import type { User } from "@/payload-types";
import { Sidebar } from "./Sidebar";

export function DashboardShell({
	user,
	dict,
	children,
}: {
	user: User;
	dict: Dict;
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen bg-tk-bg">
			<Sidebar user={user} dict={dict} />
			<main className="ml-[240px] min-h-screen flex-1 overflow-y-auto">
				<div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
			</main>
		</div>
	);
}
