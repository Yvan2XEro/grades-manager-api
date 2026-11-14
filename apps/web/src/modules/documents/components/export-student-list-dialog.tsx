import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { downloadBase64 } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

interface Props {
	/** Filters applied. At least one of classId/programId/academicYearId is recommended. */
	classId?: string;
	programId?: string;
	academicYearId?: string;
	studentIds?: string[];
	/** Optional label shown in the trigger button. */
	label?: string;
}

export function ExportStudentListButton({
	label = "Exporter (template)",
	...filters
}: Props) {
	const { classId, programId, academicYearId, studentIds } = filters;
	const hasFilter =
		classId ||
		programId ||
		academicYearId ||
		(studentIds && studentIds.length > 0);

	return (
		<Button
			size="sm"
			variant="outline"
			onClick={() => ExportStudentListDialog.call(filters)}
			disabled={!hasFilter}
			title={
				hasFilter
					? "Exporter cette liste avec un template officiel"
					: "Sélectionnez d'abord une classe, un programme ou une année"
			}
		>
			<FileText className="mr-1 h-4 w-4" />
			{label}
		</Button>
	);
}

/**
 * Exports a student list with an official template: downloads the PDF, or
 * opens an HTML preview on top of the dialog.
 */
export const ExportStudentListDialog = createCallable<Omit<Props, "label">>(
	({ call, classId, programId, academicYearId, studentIds }) => {
		const [templateId, setTemplateId] = useState<string>("");
		const [format, setFormat] = useState<"pdf" | "html">("pdf");
		const [demoMode, setDemoMode] = useState(false);

		const { data: templates } = useQuery({
			queryKey: ["templates-student-list"],
			queryFn: async () => {
				const res = await trpcClient.exportTemplates.list.query({
					type: "student_list",
					limit: 100,
				});
				return (
					res as {
						items: Array<{ id: string; name: string; isDefault: boolean }>;
					}
				).items;
			},
		});

		const generate = useMutation({
			mutationFn: async () => {
				const result =
					await trpcClient.academicDocuments.generateStudentList.mutate({
						classId,
						programId,
						academicYearId,
						studentIds,
						templateId: templateId || undefined,
						format,
						demoMode,
					});
				return result as {
					data: string;
					filename: string;
					mimeType: string;
					usedTemplate: {
						id: string | null;
						name: string;
						variant: "standard" | "center";
						isSystemDefault: boolean;
					};
				};
			},
			onSuccess: (result) => {
				const t = result.usedTemplate;
				toast.success(
					`Modèle utilisé : ${t.name}${t.variant === "center" ? " (centre)" : ""}`,
				);
				if (result.mimeType === "text/html") {
					DocumentPreviewDialog.call({
						title: "Aperçu HTML — Liste d'étudiants",
						html: result.data,
					});
					return;
				}
				downloadBase64(result.data, result.filename, result.mimeType);
				call.end();
			},
			onError: (err: any) =>
				toast.error(err.message || "Échec de la génération"),
		});

		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(o) => !o && !generate.isPending && call.end()}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Exporter la liste d'étudiants</DialogTitle>
						<DialogDescription>
							{classId
								? "Pour la classe sélectionnée."
								: programId
									? "Pour le programme sélectionné."
									: studentIds
										? `Pour ${studentIds.length} étudiant(s) sélectionné(s).`
										: "Selon les filtres en cours."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 px-6 py-2">
						<div className="space-y-1">
							<Label>Modèle</Label>
							<Select value={templateId} onValueChange={setTemplateId}>
								<SelectTrigger>
									<SelectValue
										placeholder={
											templates && templates.length > 0
												? "(défaut institution)"
												: "Aucun modèle — créez-en via Initialiser modèles officiels"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{(templates ?? []).map((t) => (
										<SelectItem key={t.id} value={t.id}>
											{t.name}
											{t.isDefault ? " (défaut)" : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>Format</Label>
							<Select
								value={format}
								onValueChange={(v) => setFormat(v as "pdf" | "html")}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pdf">PDF</SelectItem>
									<SelectItem value="html">HTML (aperçu)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center justify-between">
							<Label className="flex flex-col gap-0.5">
								<span>Mode démo</span>
								<span className="font-normal text-muted-foreground text-xs">
									Filigrane "DÉMO"
								</span>
							</Label>
							<Switch checked={demoMode} onCheckedChange={setDemoMode} />
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							disabled={generate.isPending}
							onClick={() => call.end()}
						>
							Annuler
						</Button>
						<Button
							onClick={() => generate.mutate()}
							disabled={generate.isPending}
						>
							{generate.isPending && <Spinner className="mr-2" />}
							<Download className="mr-1 h-4 w-4" />
							Générer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
