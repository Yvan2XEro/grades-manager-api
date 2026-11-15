import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ClassTemplateKindCard } from "../components/class-template-kind-card";
import { ClassTemplateThemeView } from "../components/class-template-theme-view";
import { DocumentPreviewView } from "../components/document-preview-view";
import { useClassDocumentTemplates } from "../hooks/use-class-document-templates";
import { KINDS } from "../services/class-template-kinds";

export default function ClassDocumentTemplates() {
	const { t } = useTranslation();
	const state = useClassDocumentTemplates();
	const {
		classes,
		classesLoading,
		selectedClassId,
		setSelectedClassId,
		selectedClassLabel,
		totalTemplates,
		editingKind,
		previewHtml,
		setPreviewHtml,
		seedSystemDefaultsMutation,
	} = state;

	if (editingKind) return <ClassTemplateThemeView state={state} />;

	if (previewHtml) {
		return (
			<DocumentPreviewView
				html={previewHtml}
				subtitle={t("admin.documents.classTemplates.previewSubtitle", {
					classLabel: selectedClassLabel,
				})}
				onBack={() => setPreviewHtml(null)}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("admin.documents.classTemplates.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.documents.classTemplates.subtitle")}
					</p>
				</div>
				<Button
					variant={totalTemplates === 0 ? "default" : "outline"}
					size="sm"
					onClick={() => seedSystemDefaultsMutation.mutate()}
					disabled={seedSystemDefaultsMutation.isPending}
				>
					{seedSystemDefaultsMutation.isPending ? (
						<Spinner className="mr-2 h-4 w-4" />
					) : null}
					{totalTemplates === 0
						? t("admin.documents.classTemplates.seedCreate")
						: t("admin.documents.classTemplates.seedReset")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("admin.documents.classTemplates.targetClass.title")}
					</CardTitle>
					<CardDescription>
						{t("admin.documents.classTemplates.targetClass.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Select
						value={selectedClassId}
						onValueChange={setSelectedClassId}
						disabled={classesLoading}
					>
						<SelectTrigger className="max-w-md">
							<SelectValue
								placeholder={t(
									"admin.documents.classTemplates.targetClass.placeholder",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{(classes ?? []).map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.code} — {c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedClassId && (
				<div className="grid gap-4 md:grid-cols-3">
					{KINDS.map((k) => (
						<ClassTemplateKindCard key={k.value} kind={k} state={state} />
					))}
				</div>
			)}
		</div>
	);
}
