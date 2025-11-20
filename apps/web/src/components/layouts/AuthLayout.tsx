import { motion } from "framer-motion";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "../../store";

const AuthLayout: React.FC = () => {
	const { user } = useStore();
	const { t } = useTranslation();

	// Redirect if already authenticated
	if (user) {
		return user.role === "admin" ? (
			<Navigate to="/admin" replace />
		) : (
			<Navigate to="/teacher" replace />
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 p-4">
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="w-full max-w-md"
			>
				<div className="rounded-xl bg-white p-8 shadow-xl">
					<div className="mb-6 flex flex-col items-center">
						<h1 className="font-bold text-2xl text-primary-900">
							{t("auth.layout.title")}
						</h1>
						<p className="mt-2 text-center text-gray-600">
							{t("auth.layout.subtitle")}
						</p>
					</div>
					<Outlet />
				</div>
			</motion.div>
		</div>
	);
};

export default AuthLayout;
