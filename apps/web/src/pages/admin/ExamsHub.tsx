import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExamManagement from "./ExamManagement";
import ExamScheduler from "./ExamScheduler";
import ExamTypes from "./ExamTypes";

export default function ExamsHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "exams" });

	return (
		<div className="space-y-6">
			<PageHeader
				title="Examens"
				description="Gérez les examens, les types d'examen et la programmation"
			/>
			<Tabs value={tab ?? "exams"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="exams">Examens</TabsTrigger>
					<TabsTrigger value="types">Types d'examen</TabsTrigger>
					<TabsTrigger value="scheduler">Programmation</TabsTrigger>
				</TabsList>
				<TabsContent value="exams" className="mt-4">
					<ExamManagement />
				</TabsContent>
				<TabsContent value="types" className="mt-4">
					<ExamTypes />
				</TabsContent>
				<TabsContent value="scheduler" className="mt-4">
					<ExamScheduler />
				</TabsContent>
			</Tabs>
		</div>
	);
}
