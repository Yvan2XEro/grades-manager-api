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
			navigate("/auth/login", { replace: true });
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
		<div className="flex h-screen overflow-hidden bg-gray-50">
			<Sidebar />

			<div className="flex flex-1 flex-col overflow-hidden">
				<Header />

				<main className="flex-1 overflow-y-auto p-4 md:p-6">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="container mx-auto"
					>
						<Outlet />
					</motion.div>
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
