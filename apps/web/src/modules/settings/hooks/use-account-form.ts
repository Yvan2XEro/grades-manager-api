import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

const buildAccountSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(1, t("settings.account.validation.name")),
	});

type AccountFormValues = z.infer<ReturnType<typeof buildAccountSchema>>;

/** Display name of the auth account, synced from the session. */
export function useAccountForm() {
	const { t } = useTranslation();
	const { data: session, refetch: refetchSession } = authClient.useSession();
	const accountSchema = useMemo(() => buildAccountSchema(t), [t]);

	const form = useForm<AccountFormValues>({
		resolver: zodResolver(accountSchema),
		defaultValues: { name: "" },
	});

	useEffect(() => {
		if (!session?.user) return;
		form.reset({ name: session.user.name ?? "" });
	}, [form, session?.user]);

	const mutation = useMutation({
		mutationFn: async (values: AccountFormValues) =>
			authClient.updateUser({ name: values.name.trim() }),
		onSuccess: async () => {
			// The header shows the institutional profile's name: nothing to sync here.
			await refetchSession();
			toast.success(t("settings.account.toast.success"));
		},
		onError: () => toast.error(t("settings.account.toast.error")),
	});

	const submit = form.handleSubmit((values) => mutation.mutate(values));

	return { form, submit, isPending: mutation.isPending };
}
