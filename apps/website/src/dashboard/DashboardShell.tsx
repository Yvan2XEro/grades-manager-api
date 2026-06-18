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
				<div className="px-5 pt-[4.5rem] pb-12 md:px-8 md:pt-8 xl:px-12">
					{children}
				</div>
			</main>
		</div>
	);
}
