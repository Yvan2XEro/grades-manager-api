import { motion } from "framer-motion";
import logo from "/logo.png";
import logoBg from "/logo-bg.png";
import { useQueryState } from "nuqs";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router";
import LoadingScreen from "../ui/LoadingScreen";
import { useStore } from "../../store";
import { roleLayoutMap } from "../navigation/Redirector";

const AuthLayout: React.FC = () => {
	const { user } = useStore();
	const { t } = useTranslation();

	const [callbackURL] = useQueryState("return", {});
	if (user) {
		// Intermediate state: user is authenticated but org is still being activated
		if (user.role === "guest") return <LoadingScreen />;
		if (callbackURL) return <Navigate to={callbackURL} replace />;
		return roleLayoutMap[user.role];
	}

	return (
		<div className="flex min-h-screen">
			{/* Left panel - Branding */}
			<div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 lg:flex lg:w-1/2">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />

				{/* Floating orbs */}
				<motion.div
					className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/8 blur-3xl"
					animate={{ y: [0, -24, 0], scale: [1, 1.06, 1] }}
					transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
				/>
				<motion.div
					className="pointer-events-none absolute bottom-16 -left-24 h-56 w-56 rounded-full bg-white/6 blur-3xl"
					animate={{ y: [0, 18, 0], scale: [1, 1.09, 1] }}
					transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 1.5 }}
				/>
				<motion.div
					className="pointer-events-none absolute top-1/2 left-1/3 h-36 w-36 rounded-full bg-white/5 blur-2xl"
					animate={{ y: [0, -14, 0], x: [0, 10, 0] }}
					transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.8 }}
				/>

				<motion.div
					initial={{ opacity: 0, y: -16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="relative z-10"
				>
					<img src={logoBg} alt="TKAMS" className="h-10 w-auto" />
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 32 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
					className="relative z-10 space-y-4"
				>
					<h1 className="font-heading font-bold text-4xl leading-tight text-white">
						{t("auth.layout.title")}
					</h1>
					<p className="max-w-md text-lg text-white/70">
						{t("auth.layout.subtitle")}
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className="relative z-10 text-sm text-white/50"
				>
					&copy; {new Date().getFullYear()} TKAMS
				</motion.div>
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
					initial={{ opacity: 0, y: 16, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.45, ease: "easeOut" }}
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
