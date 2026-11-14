import { KeyRound, Link2 } from "lucide-react";
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
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<KeyRound className="h-4 w-4 text-primary" />
					Provisionnement
				</CardTitle>
				<CardDescription>
					Créez un nouveau compte ou liez un compte existant à ce profil.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="create">
					<TabsList className="mb-6">
						<TabsTrigger value="create" className="gap-2">
							<KeyRound className="h-3.5 w-3.5" />
							Créer un compte
						</TabsTrigger>
						<TabsTrigger value="link" className="gap-2">
							<Link2 className="h-3.5 w-3.5" />
							Lier un compte existant
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
