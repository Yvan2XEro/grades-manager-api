import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportSection } from "./ImportSection";

export default function DataImportHub() {
	const { t } = useTranslation();

	return (
		<div className="container max-w-3xl py-8">
			<div className="mb-6">
				<h1 className="font-bold text-2xl">{t("admin.dataImport.title")}</h1>
				<p className="mt-1 text-muted-foreground">
					{t("admin.dataImport.subtitle")}
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
