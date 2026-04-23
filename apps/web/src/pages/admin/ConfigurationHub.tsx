import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExportTemplatesManagement from "./ExportTemplatesManagement";
import RegistrationNumberFormats from "./RegistrationNumberFormats";
import RuleManagement from "./RuleManagement";

export default function ConfigurationHub() {
	const [tab, setTab] = useQueryState("tab", {
		defaultValue: "reg-numbers",
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Configuration"
				description="Formats de matricules, modèles d'exportation et moteur de règles"
			/>
			<Tabs value={tab ?? "reg-numbers"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="reg-numbers">Formats de matricule</TabsTrigger>
					<TabsTrigger value="templates">Modèles d'export</TabsTrigger>
					<TabsTrigger value="rules">Moteur de règles</TabsTrigger>
				</TabsList>
				<TabsContent value="reg-numbers" className="mt-4">
					<RegistrationNumberFormats />
				</TabsContent>
				<TabsContent value="templates" className="mt-4">
					<ExportTemplatesManagement />
				</TabsContent>
				<TabsContent value="rules" className="mt-4">
					<RuleManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
