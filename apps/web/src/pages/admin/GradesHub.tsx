import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GradeAccessGrants from "./GradeAccessGrants";
import GradeExport from "./GradeExport";
import RetakeEligibility from "./RetakeEligibility";

export default function GradesHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "export" });

	return (
		<div className="space-y-6">
			<PageHeader
				title="Gestion des notes"
				description="Exportez les notes, déléguez l'accès et gérez l'éligibilité aux rattrapages"
			/>
			<Tabs value={tab ?? "export"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="export">Export</TabsTrigger>
					<TabsTrigger value="access">Délégation d'accès</TabsTrigger>
					<TabsTrigger value="retake">Éligibilité rattrapage</TabsTrigger>
				</TabsList>
				<TabsContent value="export" className="mt-4">
					<GradeExport />
				</TabsContent>
				<TabsContent value="access" className="mt-4">
					<GradeAccessGrants />
				</TabsContent>
				<TabsContent value="retake" className="mt-4">
					<RetakeEligibility />
				</TabsContent>
			</Tabs>
		</div>
	);
}
