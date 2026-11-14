import { useQueryState } from "nuqs";
import type React from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { detectOrganizationSlug } from "@/lib/organization";
import { toast } from "@/lib/toast";
import { LoginForm } from "../components/login-form";
import { LoginWithOrgPicker } from "../components/login-with-org-picker";
import type { LoginFormData } from "../services/auth-schemas";

/** Scoped mode (on-premise or subdomain); cloud mode picks the institution. */
const Login: React.FC = () => {
	const { t } = useTranslation();
	const orgSlug = detectOrganizationSlug();
	const [callbackURL] = useQueryState("return", {});

	if (!orgSlug) {
		return <LoginWithOrgPicker callbackURL={callbackURL} />;
	}

	const onSubmit = async (data: LoginFormData, rememberMe: boolean) => {
		const result = await authClient.signIn.email({
			email: data.email,
			password: data.password,
			rememberMe,
			callbackURL: callbackURL || undefined,
			fetchOptions: { headers: { "X-Organization-Slug": orgSlug } },
		});
		if (result.error) {
			toast.error(result.error.message || t("auth.login.error"));
			return;
		}
		toast.success(t("auth.login.success"));
	};

	return (
		<LoginForm
			subtitle={t("auth.login.subtitle", {
				defaultValue: "Connectez-vous à votre espace.",
			})}
			forgotPasswordHref={`/auth/forgot?return=${callbackURL}`}
			onSubmit={onSubmit}
		/>
	);
};

export default Login;
