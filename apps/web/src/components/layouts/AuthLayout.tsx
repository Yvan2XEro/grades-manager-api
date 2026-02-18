import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
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
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
							<GraduationCap className="h-6 w-6 text-white" />
						</div>
						<span className="font-heading font-bold text-lg text-white">
							AcadManager
						</span>
					</div>
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
					&copy; {new Date().getFullYear()} AcadManager
				</div>
			</div>

			{/* Right panel - Form */}
			<div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-10">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="w-full max-w-md"
				>
					{/* Mobile logo */}
					<div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
							<GraduationCap className="h-6 w-6 text-primary-foreground" />
						</div>
						<span className="font-heading font-bold text-lg text-foreground">
							AcadManager
						</span>
					</div>
					<Outlet />
				</motion.div>
			</div>
		</div>
	);
};

export default AuthLayout;
