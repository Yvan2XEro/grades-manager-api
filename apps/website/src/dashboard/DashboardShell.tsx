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
		<div className="min-h-screen bg-tk-bg">
			<Sidebar user={user} dict={dict} />
			<main className="min-h-screen md:ml-[240px]">
				<div className="mx-auto max-w-5xl px-4 pt-[4.5rem] pb-10 sm:px-6 md:px-8 md:pt-10">
					{children}
				</div>
			</main>
		</div>
	);
}
