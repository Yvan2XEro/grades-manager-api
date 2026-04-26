import type React from "react";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useStore } from "../../store";
import { HelpWidget } from "../help/HelpWidget";
import Header from "../navigation/Header";
import Sidebar from "../navigation/Sidebar";
import { GridWaveFilter } from "../ui/grid-wave-filter";

const DashboardLayout: React.FC = () => {
	const { user, setSidebarOpen } = useStore();
	const navigate = useNavigate();
	const location = useLocation();

	// Redirect if not authenticated
	useEffect(() => {
		if (!user) {
			navigate(`/auth/login?return=${location.pathname}`, {
				replace: true,
			});
		}
	}, [user, navigate, location.pathname]);

	// Close sidebar on mobile when navigating
	useEffect(() => {
		if (window.innerWidth < 768) {
			setSidebarOpen(false);
		}
	}, [setSidebarOpen]);

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
					<div className="min-w-0 px-4 py-6 md:px-8">
						<Outlet />
					</div>
				</main>
			</div>
			<HelpWidget />
		</div>
	);
};

export default DashboardLayout;
