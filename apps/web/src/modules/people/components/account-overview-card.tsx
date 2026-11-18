import { format } from "date-fns";
import {
	AlertTriangle,
	Ban,
	CheckCircle2,
	MailCheck,
	UserCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AuthAccount } from "../hooks/use-profile-auth";
import { roleLabel } from "../services/profile-access";

const successBadge =
	"gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";

/** Status of the login account linked to a profile, or a warning when none. */
export function AccountOverviewCard({
	authAccount,
}: {
	authAccount: AuthAccount | null | undefined;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UserCheck className="h-4 w-4 text-primary" />
					{t("usersHub.account.overview.title")}
				</CardTitle>
				<CardDescription>
					{t("usersHub.account.overview.description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{authAccount ? (
					<div className="space-y-4">
						<div className="flex flex-wrap items-center gap-3">
							<span className="font-medium text-sm">{authAccount.email}</span>
							{authAccount.emailVerified ? (
								<Badge variant="secondary" className={successBadge}>
									<MailCheck className="h-3 w-3" />
									{t("usersHub.account.overview.emailVerified")}
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="gap-1 text-muted-foreground"
								>
									<AlertTriangle className="h-3 w-3" />
									{t("usersHub.account.overview.emailNotVerified")}
								</Badge>
							)}
							{authAccount.banned ? (
								<Badge variant="destructive" className="gap-1">
									<Ban className="h-3 w-3" />
									{t("usersHub.account.overview.suspended")}
								</Badge>
							) : (
								<Badge variant="secondary" className={successBadge}>
									<CheckCircle2 className="h-3 w-3" />
									{t("usersHub.account.overview.active")}
								</Badge>
							)}
						</div>
						<Separator />
						<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
							<div className="space-y-1">
								<p className="text-muted-foreground text-xs">
									{t("usersHub.account.overview.role")}
								</p>
								<p className="font-medium capitalize">
									{roleLabel(t, authAccount.memberRole) ?? "—"}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground text-xs">
									{t("usersHub.account.overview.memberSince")}
								</p>
								<p className="font-medium">
									{authAccount.memberSince
										? format(new Date(authAccount.memberSince), "dd/MM/yyyy")
										: "—"}
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
						<div>
							<p className="font-medium text-amber-800 text-sm dark:text-amber-200">
								{t("usersHub.account.overview.noAccountTitle")}
							</p>
							<p className="text-amber-700 text-xs dark:text-amber-300">
								{t("usersHub.account.overview.noAccountDescription")}
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
