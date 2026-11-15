import { Loader2, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	type AuthAccount,
	useSendPasswordReset,
	useToggleBan,
} from "../hooks/use-profile-auth";

/** Password reset and suspend / reactivate actions of a linked account. */
export function AccountSecurityCard({
	profileId,
	authAccount,
}: {
	profileId: string;
	authAccount: AuthAccount;
}) {
	const { t } = useTranslation();
	const passwordReset = useSendPasswordReset(profileId);
	const toggleBan = useToggleBan(profileId);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-primary" />
					{t("usersHub.account.security.title")}
				</CardTitle>
				<CardDescription>
					{t("usersHub.account.security.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-1 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
					<div className="space-y-1">
						<p className="font-medium text-sm">
							{t("usersHub.account.security.resetTitle")}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("usersHub.account.security.resetDescription")}{" "}
							<span className="font-mono">{authAccount.email}</span>.
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => passwordReset.mutate()}
						disabled={passwordReset.isPending}
						className="w-full md:w-auto"
					>
						{passwordReset.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 h-4 w-4" />
						)}
						{t("usersHub.account.security.sendEmail")}
					</Button>
				</div>
				<Separator />
				<div className="flex flex-col gap-1 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
					<div className="space-y-1">
						<p className="font-medium text-sm">
							{authAccount.banned
								? t("usersHub.account.security.reactivateTitle")
								: t("usersHub.account.security.suspendTitle")}
						</p>
						<p className="text-muted-foreground text-xs">
							{authAccount.banned
								? t("usersHub.account.security.reactivateDescription")
								: t("usersHub.account.security.suspendDescription")}
						</p>
					</div>
					<Button
						variant={authAccount.banned ? "outline" : "destructive"}
						onClick={() => toggleBan.mutate(!authAccount.banned)}
						disabled={toggleBan.isPending}
						className="w-full md:w-auto"
					>
						{toggleBan.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : authAccount.banned ? (
							<ShieldCheck className="mr-2 h-4 w-4" />
						) : (
							<ShieldOff className="mr-2 h-4 w-4" />
						)}
						{authAccount.banned
							? t("usersHub.account.security.reactivate")
							: t("usersHub.account.security.suspend")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
