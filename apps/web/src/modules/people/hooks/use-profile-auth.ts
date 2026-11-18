import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import i18n from "@/i18n";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import {
	type CreateAccountValues,
	createAccountErrorMessage,
	type LinkAccountValues,
	linkAccountErrorMessage,
} from "../services/profile-access";

const authKey = (profileId: string) => ["profiles", "auth", profileId];

/** Login account linked to a profile (`null` when none). */
export function useProfileAuthAccount(profileId: string) {
	return useQuery({
		queryKey: authKey(profileId),
		queryFn: () => trpcClient.profiles.getAuthAccount.query({ profileId }),
	});
}

export type AuthAccount = NonNullable<
	ReturnType<typeof useProfileAuthAccount>["data"]
>;

/** Refreshes the auth account and the profile after (un)linking. */
function useInvalidateProfileAuth(profileId: string) {
	const queryClient = useQueryClient();
	return () => {
		void queryClient.invalidateQueries({ queryKey: authKey(profileId) });
		void queryClient.invalidateQueries({ queryKey: ["profiles", profileId] });
	};
}

export function useCreateAuthAccount(profileId: string) {
	const invalidate = useInvalidateProfileAuth(profileId);
	return useMutation({
		mutationFn: (values: CreateAccountValues) =>
			trpcClient.profiles.createAuthForProfile.mutate({
				profileId,
				email: values.email,
				password: values.password,
				memberRole: values.memberRole,
			}),
		onSuccess: () => {
			toast.success(i18n.t("usersHub.account.toast.created"));
			invalidate();
		},
		onError: (err: Error) => toast.error(createAccountErrorMessage(err)),
	});
}

export function useLinkAuthAccount(profileId: string) {
	const invalidate = useInvalidateProfileAuth(profileId);
	return useMutation({
		mutationFn: (values: LinkAccountValues) =>
			trpcClient.profiles.linkAuthAccount.mutate({
				profileId,
				authEmail: values.authEmail,
			}),
		onSuccess: () => {
			toast.success(i18n.t("usersHub.account.toast.linked"));
			invalidate();
		},
		onError: (err: Error) => toast.error(linkAccountErrorMessage(err)),
	});
}

export function useSendPasswordReset(profileId: string) {
	return useMutation({
		mutationFn: () =>
			trpcClient.profiles.sendPasswordReset.mutate({ profileId }),
		onSuccess: () => toast.success(i18n.t("usersHub.account.toast.resetSent")),
		onError: () => toast.error(i18n.t("usersHub.account.toast.resetFailed")),
	});
}

/** Suspends or reactivates the account depending on its current state. */
export function useToggleBan(profileId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (banned: boolean) =>
			trpcClient.profiles.setBanStatus.mutate({ profileId, banned }),
		onSuccess: (_data, banned) => {
			toast.success(
				i18n.t(
					banned
						? "usersHub.account.toast.suspended"
						: "usersHub.account.toast.reactivated",
				),
			);
			void queryClient.invalidateQueries({ queryKey: authKey(profileId) });
		},
		onError: () => toast.error(i18n.t("usersHub.account.toast.statusFailed")),
	});
}
