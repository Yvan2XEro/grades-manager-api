import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

/** Shown once the password is reset; redirects to login after 3 s. */
export function ResetPasswordSuccess() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [countdown, setCountdown] = useState(3);

	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((c) => {
				if (c <= 1) {
					clearInterval(timer);
					navigate("/auth/login");
					return 0;
				}
				return c - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [navigate]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			animate={{ opacity: 1, y: 0 }}
			className="space-y-4 text-center"
		>
			<div className="flex justify-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
					<CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
				</div>
			</div>
			<div>
				<h2 className="font-semibold text-foreground text-xl">
					{t("auth.reset.successTitle", {
						defaultValue: "Mot de passe mis à jour",
					})}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.reset.successMessage", {
						defaultValue: `Redirection vers la connexion dans ${countdown} secondes...`,
						countdown,
					})}
				</p>
			</div>
			<Link
				to="/auth/login"
				className="inline-flex items-center gap-1.5 font-medium text-primary text-sm hover:underline"
			>
				{t("auth.reset.signInNow", {
					defaultValue: "Se connecter maintenant",
				})}
				<ArrowRight className="h-4 w-4" />
			</Link>
		</motion.div>
	);
}
