import { KeyRound, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateAccountForm } from "./create-account-form";
import { LinkAccountForm } from "./link-account-form";

/** Creates a login account for a profile, or links an existing one. */
export function AccountProvisioningCard({ profileId }: { profileId: string }) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<KeyRound className="h-4 w-4 text-primary" />
					{t("usersHub.account.provisioning.title")}
				</CardTitle>
				<CardDescription>
					{t("usersHub.account.provisioning.description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="create">
					<TabsList className="mb-6">
						<TabsTrigger value="create" className="gap-2">
							<KeyRound className="h-3.5 w-3.5" />
							{t("usersHub.account.provisioning.createTab")}
						</TabsTrigger>
						<TabsTrigger value="link" className="gap-2">
							<Link2 className="h-3.5 w-3.5" />
							{t("usersHub.account.provisioning.linkTab")}
						</TabsTrigger>
					</TabsList>
					<TabsContent value="create">
						<CreateAccountForm profileId={profileId} />
					</TabsContent>
					<TabsContent value="link">
						<LinkAccountForm profileId={profileId} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
