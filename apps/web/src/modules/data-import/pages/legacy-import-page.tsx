import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportSection } from "../components/import-section";

export default function LegacyImportPage() {
	const { t } = useTranslation();

	return (
		<div className="container max-w-3xl py-8">
			<Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
				<Link to="/import">
					<ArrowLeft className="mr-1 h-4 w-4" />
					Import guidé
				</Link>
			</Button>
			<div className="mb-6">
				<h1 className="font-bold text-2xl">Import avancé</h1>
				<p className="mt-1 text-muted-foreground">
					Ancien format, un fichier par type de données. Préférez l'import guidé
					: il vérifie chaque ligne et respecte l'ordre des données.
				</p>
			</div>

			<Tabs defaultValue="structure">
				<TabsList className="mb-6 grid w-full grid-cols-4">
					<TabsTrigger value="structure">
						{t("admin.dataImport.tabs.structure")}
					</TabsTrigger>
					<TabsTrigger value="people">
						{t("admin.dataImport.tabs.people")}
					</TabsTrigger>
					<TabsTrigger value="enrollments">
						{t("admin.dataImport.tabs.enrollments")}
					</TabsTrigger>
					<TabsTrigger value="grades">
						{t("admin.dataImport.tabs.grades")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="structure">
					<ImportSection type="academic-structure" />
				</TabsContent>
				<TabsContent value="people">
					<ImportSection
						type="people"
						prereqHint={t("admin.dataImport.prereqHint.people")}
					/>
				</TabsContent>
				<TabsContent value="enrollments">
					<ImportSection
						type="enrollments"
						prereqHint={t("admin.dataImport.prereqHint.enrollments")}
					/>
				</TabsContent>
				<TabsContent value="grades">
					<ImportSection
						type="grades-bulk"
						prereqHint={t("admin.dataImport.prereqHint.grades")}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
