import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import type { TFunction } from "i18next";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { errorMsg, staggerContainer, staggerItem } from "../../lib/animations";
import { authClient } from "../../lib/auth-client";

const buildSchema = (t: TFunction) =>
	z.object({
		email: z.string().email(t("auth.validation.email")),
	});

type FormData = z.infer<ReturnType<typeof buildSchema>>;

const ForgotPassword: React.FC = () => {
	const { t } = useTranslation();
	const [callbackURL] = useQueryState("return", {});
	const schema = React.useMemo(() => buildSchema(t), [t]);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	const onSubmit = async (data: FormData) => {
		const result = await authClient.forgetPassword({
			email: data.email,
			redirectTo: `${window.location.origin}/auth/reset?return=${callbackURL}`,
		});

		if (result.error) {
			toast.error(result.error.message || t("auth.forgot.error"));
		} else {
			toast.success(t("auth.forgot.success"));
		}
	};

	return (
		<motion.div variants={staggerContainer} initial="hidden" animate="visible">
			<motion.div variants={staggerItem} className="mb-8">
				<motion.div
					className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
					whileHover={{ scale: 1.05 }}
					transition={{ duration: 0.2 }}
				>
					<Mail className="h-6 w-6 text-primary" />
				</motion.div>
				<h2 className="text-foreground">
					{t("auth.forgot.title")}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.forgot.subtitle", {
						defaultValue:
							"Enter your email and we'll send you a link to reset your password.",
					})}
				</p>
			</motion.div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.forgot.emailPlaceholder")}
					/>
					{errors.email && (
						<motion.p
							variants={errorMsg}
							initial="hidden"
							animate="visible"
							className="text-destructive text-sm"
						>
							{errors.email.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={staggerItem}>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="h-11 w-full font-semibold"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("auth.forgot.submitting")}
							</>
						) : (
							t("auth.forgot.submit")
						)}
					</Button>
				</motion.div>

				<motion.div variants={staggerItem} className="text-center">
					<Link
						to={`/auth/login?return=${callbackURL}`}
						className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("auth.forgot.backToLogin")}
					</Link>
				</motion.div>
			</form>
		</motion.div>
	);
};

export default ForgotPassword;
