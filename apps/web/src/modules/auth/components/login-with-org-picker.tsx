import type React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import { useOrgPickerLogin } from "../hooks/use-org-picker-login";
import { LoginForm } from "./login-form";
import { OrgPicker } from "./org-picker";

type LoginWithOrgPickerProps = { callbackURL?: string | null };

/** Cloud mode (no institution in the URL): login then pick institution. */
export const LoginWithOrgPicker: React.FC<LoginWithOrgPickerProps> = ({
	callbackURL,
}) => {
	const { t } = useTranslation();
	const { isLoading, step, orgs, signIn, selectOrg, back } =
		useOrgPickerLogin(callbackURL);

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<Spinner className="h-8 w-8 text-primary" />
			</div>
		);
	}

	if (step === "pick") {
		return <OrgPicker orgs={orgs} onSelect={selectOrg} onBack={back} />;
	}

	return (
		<LoginForm
			subtitle={t("auth.login.subtitle", {
				defaultValue: "Connectez-vous pour accéder à vos établissements.",
			})}
			onSubmit={signIn}
		/>
	);
};
