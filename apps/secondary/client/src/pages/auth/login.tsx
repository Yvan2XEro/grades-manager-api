import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = handleSubmit(async (values) => {
		const result = await signIn.email({
			email: values.email,
			password: values.password,
		});
		if (result.error) {
			setError("root", { message: t("auth.invalid_credentials") });
		} else {
			navigate("/");
		}
	});

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
				<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
				<p className="mb-6 text-muted-foreground text-sm">{t("app.tagline")}</p>

				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="email">{t("auth.email")}</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							{...register("email")}
						/>
						{errors.email && (
							<p className="text-destructive text-xs">{errors.email.message}</p>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">{t("auth.password")}</Label>
							<Link
								to="/forgot-password"
								className="text-primary text-xs hover:underline"
							>
								{t("auth.forgot_password")}
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							{...register("password")}
						/>
						{errors.password && (
							<p className="text-destructive text-xs">
								{errors.password.message}
							</p>
						)}
					</div>

					{errors.root && (
						<p className="text-destructive text-sm">{errors.root.message}</p>
					)}

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? t("common.loading") : t("auth.sign_in")}
					</Button>
				</form>
			</div>
		</div>
	);
}
