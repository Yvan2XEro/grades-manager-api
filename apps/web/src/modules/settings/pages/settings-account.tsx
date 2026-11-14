import { AccountCard } from "../components/account-card";
import { PasswordCard } from "../components/password-card";
import { SessionsCard } from "../components/sessions-card";

export default function AccountTab() {
	return (
		<div className="space-y-6">
			<AccountCard />
			<PasswordCard />
			<SessionsCard />
		</div>
	);
}
