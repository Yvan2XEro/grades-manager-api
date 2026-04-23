import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassCourseManagement from "./ClassCourseManagement";
import ClassManagement from "./ClassManagement";
import EnrollmentManagement from "./EnrollmentManagement";

export default function ClassesHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "classes" });

	return (
		<div className="space-y-6">
			<PageHeader
				title="Classes & Inscriptions"
				description="Gérez les classes, les affectations de cours et les inscriptions étudiantes"
			/>
			<Tabs value={tab ?? "classes"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="classes">Classes</TabsTrigger>
					<TabsTrigger value="assignments">Affectations de cours</TabsTrigger>
					<TabsTrigger value="enrollments">Inscriptions</TabsTrigger>
				</TabsList>
				<TabsContent value="classes" className="mt-4">
					<ClassManagement />
				</TabsContent>
				<TabsContent value="assignments" className="mt-4">
					<ClassCourseManagement />
				</TabsContent>
				<TabsContent value="enrollments" className="mt-4">
					<EnrollmentManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
