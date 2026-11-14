import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { useStore } from "@/store";

/** Current email + request a change (sends a verification email). */
export function EmailChangeField() {
	const { t } = useTranslation();
	const { user } = useStore();
	const { data: session } = authClient.useSession();
	const [newEmail, setNewEmail] = useState("");
	const [changing, setChanging] = useState(false);
	const currentEmail = session?.user?.email ?? user?.email;

	const changeEmail = async () => {
		setChanging(true);
		try {
			await authClient.changeEmail({
				newEmail: newEmail.trim(),
				callbackURL: "/settings",
			});
			toast.success(t("settings.account.email.verificationSent"));
			setNewEmail("");
		} catch {
			toast.error(t("settings.account.email.error"));
		} finally {
			setChanging(false);
		}
	};

	return (
		<div className="space-y-3">
			<label className="font-medium text-sm">
				{t("settings.account.fields.email")}
			</label>
			<p className="text-muted-foreground text-xs">{currentEmail}</p>
			<div className="flex items-end gap-2">
				<div className="max-w-sm flex-1">
					<label className="font-medium text-sm" htmlFor="new-email-input">
						{t("settings.account.email.newLabel")}
					</label>
					<Input
						id="new-email-input"
						type="email"
						placeholder="new@example.com"
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
					/>
				</div>
				<Button
					variant="outline"
					disabled={
						!newEmail.trim() || changing || newEmail.trim() === currentEmail
					}
					onClick={changeEmail}
				>
					{changing ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Mail className="mr-2 h-4 w-4" />
					)}
					{t("settings.account.email.change")}
				</Button>
			</div>
		</div>
	);
}
