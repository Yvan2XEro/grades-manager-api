import { motion } from "framer-motion";
import logo from "/logo.png";
import logoBg from "/logo-bg.png";
import { useQueryState } from "nuqs";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router";
import { useStore } from "../../store";
import { roleLayoutMap } from "../navigation/Redirector";

const AuthLayout: React.FC = () => {
	const { user } = useStore();
	const { t } = useTranslation();

	const [callbackURL] = useQueryState("return", {});
	// Redirect if already authenticated
	if (user) {
		if (callbackURL) return <Navigate to={callbackURL} replace />;

		return roleLayoutMap[user.role];
	}

	return (
		<div className="flex min-h-screen">
			{/* Left panel - Branding */}
			<div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 lg:flex lg:w-1/2">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
				<div className="relative z-10">
					<img src={logoBg} alt="TKAMS" className="h-10 w-auto" />
				</div>
				<div className="relative z-10 space-y-4">
					<h1 className="font-heading font-bold text-4xl leading-tight text-white">
						{t("auth.layout.title")}
					</h1>
					<p className="max-w-md text-lg text-white/70">
						{t("auth.layout.subtitle")}
					</p>
				</div>
				<div className="relative z-10 text-sm text-white/50">
					&copy; {new Date().getFullYear()} TKAMS
				</div>
			</div>

			{/* Right panel - Form */}
			<div className="relative flex flex-1 items-center justify-center bg-background p-6 lg:p-10">
				<div
					className="pointer-events-none absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="relative z-10 w-full max-w-md"
				>
					{/* Mobile logo */}
					<div className="mb-8 flex items-center justify-center lg:hidden">
						<img src={logo} alt="TKAMS" className="h-10 w-auto" />
					</div>
					<Outlet />
				</motion.div>
			</div>
		</div>
	);
};

export default AuthLayout;
