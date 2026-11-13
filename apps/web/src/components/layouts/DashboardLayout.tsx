import type React from "react";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { useStore } from "../../store";
import { HelpWidget } from "../help/HelpWidget";
import Header from "../navigation/Header";
import Sidebar from "../navigation/Sidebar";
import { GridWaveFilter } from "../ui/grid-wave-filter";

const DashboardLayout: React.FC = () => {
	const { user, setSidebarOpen } = useStore();

	// Close sidebar on mobile when navigating
	useEffect(() => {
		if (window.innerWidth < 768) {
			setSidebarOpen(false);
		}
	}, [setSidebarOpen]);

	// App only mounts this layout with a session (the `*` route sends guests to
	// login with a return URL); the store user follows the session on the next tick
	if (!user) {
		return null;
	}

	return (
		<div className="relative isolate flex h-dvh overflow-hidden bg-background">
			{/* Définition du filtre SVG d'ondulation — doit précéder le motif */}
			<GridWaveFilter />
			{/* Motif de fond — z:-1 pour rester strictement derrière le contenu */}
			<div className="-z-10 pointer-events-none absolute inset-0 bg-dot-pattern" />
			<Sidebar />

			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<Header />

				<main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
					{/* Bounded on md+ so list pages can keep only their table rows scrolling */}
					<div className="flex min-h-full min-w-0 flex-col px-4 pt-6 *:w-full *:shrink-0 after:block after:h-6 after:shrink-0 md:h-full md:px-8">
						<Outlet />
					</div>
				</main>
			</div>
			<HelpWidget />
		</div>
	);
};

export default DashboardLayout;
