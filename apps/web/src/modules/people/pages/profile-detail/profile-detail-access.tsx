import { Loader2 } from "lucide-react";
import { AccountOverviewCard } from "../../components/account-overview-card";
import { AccountProvisioningCard } from "../../components/account-provisioning-card";
import { AccountSecurityCard } from "../../components/account-security-card";
import { useProfileAuthAccount } from "../../hooks/use-profile-auth";
import { useProfileContext } from "../../hooks/use-profile-context";

export default function ProfileAccessTab() {
	const { profileId } = useProfileContext();
	const { data: authAccount, isLoading } = useProfileAuthAccount(profileId);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 pt-6">
			<AccountOverviewCard authAccount={authAccount} />
			{authAccount ? (
				<AccountSecurityCard profileId={profileId} authAccount={authAccount} />
			) : (
				<AccountProvisioningCard profileId={profileId} />
			)}
		</div>
	);
}
