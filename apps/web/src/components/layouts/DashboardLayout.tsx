import type React from "react";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useStore } from "../../store";
import Header from "../navigation/Header";
import Sidebar from "../navigation/Sidebar";

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
	}, [user, navigate]);

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
		<div className="flex h-dvh overflow-hidden bg-background">
			<Sidebar />

			<div className="flex min-h-0 flex-1 flex-col">
				<Header />

				<main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
					<div className="px-4 py-6 md:px-8">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
