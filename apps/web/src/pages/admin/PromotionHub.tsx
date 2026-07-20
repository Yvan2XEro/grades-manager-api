import { useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	EvaluatePromotionPage,
	ExecutePromotionPage,
	ExecutionHistoryPage,
	PromotionRulesDashboard,
	RulesListPage,
} from "./promotion-rules";

export default function PromotionHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "overview" });

	return (
		<div className="space-y-6">
			<PageHeader
				title="Promotion"
				description="Définissez les règles de passage, évaluez et exécutez les promotions"
			/>
			<Tabs value={tab ?? "overview"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
					<TabsTrigger value="rules">Règles</TabsTrigger>
					<TabsTrigger value="evaluate">Évaluer</TabsTrigger>
					<TabsTrigger value="execute">Exécuter</TabsTrigger>
					<TabsTrigger value="history">Historique</TabsTrigger>
				</TabsList>
				<TabsContent value="overview" className="mt-4">
					<PromotionRulesDashboard />
				</TabsContent>
				<TabsContent value="rules" className="mt-4">
					<RulesListPage />
				</TabsContent>
				<TabsContent value="evaluate" className="mt-4">
					<EvaluatePromotionPage />
				</TabsContent>
				<TabsContent value="execute" className="mt-4">
					<ExecutePromotionPage />
				</TabsContent>
				<TabsContent value="history" className="mt-4">
					<ExecutionHistoryPage />
				</TabsContent>
			</Tabs>
		</div>
	);
}
