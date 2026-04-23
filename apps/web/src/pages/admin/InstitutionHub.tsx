import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FacultyManagement from "./FacultyManagement";
import InstitutionSettings from "./InstitutionSettings";
import StudyCycleManagement from "./StudyCycleManagement";

export default function InstitutionHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "institution" });

	return (
		<div className="space-y-6">
			<PageHeader
				title="Institution & Structure"
				description="Gérez le profil de votre institution, les facultés et les cycles académiques"
			/>
			<Tabs value={tab ?? "institution"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="institution">Institution</TabsTrigger>
					<TabsTrigger value="faculties">Facultés</TabsTrigger>
					<TabsTrigger value="cycles">Cycles d'étude</TabsTrigger>
				</TabsList>
				<TabsContent value="institution" className="mt-4">
					<InstitutionSettings />
				</TabsContent>
				<TabsContent value="faculties" className="mt-4">
					<FacultyManagement />
				</TabsContent>
				<TabsContent value="cycles" className="mt-4">
					<StudyCycleManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
