import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import type { LoginFormData } from "../services/auth-schemas";
import type { Organization } from "../types";

/** Cloud mode: sign in, then list the user's institutions to pick one. */
export function useOrgPickerLogin(callbackURL?: string | null) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	const [step, setStep] = React.useState<"login" | "pick">("login");
	const [orgs, setOrgs] = React.useState<Organization[]>([]);
	const [loadingOrgs, setLoadingOrgs] = React.useState(false);

	// If already authenticated (e.g. back button), skip to org picker
	React.useEffect(() => {
		if (!isPending && session?.user) {
			fetchOrgs();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPending, session?.user?.id]);

	const fetchOrgs = async () => {
		setLoadingOrgs(true);
		const result = await authClient.organization.list();
		setOrgs((result.data as Organization[] | null) ?? []);
		setStep("pick");
		setLoadingOrgs(false);
	};

	const signIn = async (data: LoginFormData, rememberMe: boolean) => {
		const result = await authClient.signIn.email({
			email: data.email,
			password: data.password,
			rememberMe,
		});
		if (result.error) {
			toast.error(result.error.message || t("auth.login.error"));
			return;
		}
		await fetchOrgs();
	};

	const selectOrg = async (org: Organization) => {
		await authClient.organization.setActive({ organizationId: org.id });
		navigate(callbackURL || "/");
	};

	const back = async () => {
		await authClient.signOut();
		setOrgs([]);
		setStep("login");
	};

	return {
		isLoading: isPending || loadingOrgs,
		step,
		orgs,
		signIn,
		selectOrg,
		back,
	};
}
