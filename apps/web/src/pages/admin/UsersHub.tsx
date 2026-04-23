import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiKeysManagement from "./ApiKeysManagement";
import UserManagement from "./UserManagement";

export default function UsersHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "users" });

	return (
		<div className="space-y-6">
			<PageHeader
				title="Utilisateurs & Accès"
				description="Gérez les utilisateurs, les rôles et les clés d'API"
			/>
			<Tabs value={tab ?? "users"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="users">Utilisateurs</TabsTrigger>
					<TabsTrigger value="api-keys">Clés API</TabsTrigger>
				</TabsList>
				<TabsContent value="users" className="mt-4">
					<UserManagement />
				</TabsContent>
				<TabsContent value="api-keys" className="mt-4">
					<ApiKeysManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
