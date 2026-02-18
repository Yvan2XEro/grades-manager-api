import { motion } from "framer-motion";
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
			navigate(`/auth/login?return=${location.pathname}`, { replace: true });
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
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar />

			<div className="flex flex-1 flex-col overflow-hidden">
				<Header />

				<main className="flex-1 overflow-y-auto">
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="mx-auto max-w-7xl px-4 py-6 md:px-8"
					>
						<Outlet />
					</motion.div>
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
