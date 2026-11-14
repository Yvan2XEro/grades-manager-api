import { useQueryState } from "nuqs";
import { HubLayout } from "@/components/layouts/ListLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluatePromotionPage } from "./promotion-hub-evaluate";
import { ExecutePromotionPage } from "./promotion-hub-execute";
import { ExecutionHistoryPage } from "./promotion-hub-history";
import { PromotionRulesDashboard } from "./promotion-hub-overview";
import { RulesListPage } from "./promotion-hub-rules";

export default function PromotionHub() {
	const [tab, setTab] = useQueryState("tab", { defaultValue: "overview" });

	return (
		<HubLayout>
			<PageHeader
				title="Promotion"
				description="Définissez les règles de passage, évaluez et exécutez les promotions"
			/>
			<Tabs
				value={tab ?? "overview"}
				onValueChange={setTab}
				// The history tab is a list page: bound it so only its rows scroll
				className={tab === "history" ? "min-h-0 flex-1" : undefined}
			>
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
				<TabsContent value="history" className="mt-4 flex min-h-0 flex-col">
					<ExecutionHistoryPage />
				</TabsContent>
			</Tabs>
		</HubLayout>
	);
}
