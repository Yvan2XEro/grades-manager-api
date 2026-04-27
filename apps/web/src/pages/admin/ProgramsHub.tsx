import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgramManagement from "../teacher/ProgramManagement";
import CourseManagement from "./CourseManagement";
import TeachingUnitManagement from "./TeachingUnitManagement";

export default function ProgramsHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "programs" });

	return (
		<div className="space-y-6">
			<PageHeader
				title="Programmes & Curriculum"
				description="Gérez les programmes, les unités d'enseignement et les cours"
			/>
			<Tabs value={tab ?? "programs"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="programs">Programmes</TabsTrigger>
					<TabsTrigger value="teaching-units">
						Unités d'enseignement
					</TabsTrigger>
					<TabsTrigger value="courses">Cours</TabsTrigger>
				</TabsList>
				<TabsContent value="programs" className="mt-4">
					<ProgramManagement />
				</TabsContent>
				<TabsContent value="teaching-units" className="mt-4">
					<TeachingUnitManagement />
				</TabsContent>
				<TabsContent value="courses" className="mt-4">
					<CourseManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
