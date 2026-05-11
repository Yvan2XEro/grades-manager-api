import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
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
	classId,
	programId,
	academicYearId,
	studentIds,
	label = "Exporter (template)",
}: Props) {
	const [open, setOpen] = useState(false);
	const [templateId, setTemplateId] = useState<string>("");
	const [format, setFormat] = useState<"pdf" | "html">("pdf");
	const [demoMode, setDemoMode] = useState(false);
	const [previewHtml, setPreviewHtml] = useState<string | null>(null);

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
		enabled: open,
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
				setPreviewHtml(result.data);
				return;
			}
			const byteChars = atob(result.data);
			const byteNumbers = new Array(byteChars.length);
			for (let i = 0; i < byteChars.length; i++) {
				byteNumbers[i] = byteChars.charCodeAt(i);
			}
			const blob = new Blob([new Uint8Array(byteNumbers)], {
				type: result.mimeType,
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.filename;
			a.click();
			URL.revokeObjectURL(url);
			setOpen(false);
		},
		onError: (err: any) => toast.error(err.message || "Échec de la génération"),
	});

	const hasFilter =
		classId ||
		programId ||
		academicYearId ||
		(studentIds && studentIds.length > 0);

	return (
		<>
			<Button
				size="sm"
				variant="outline"
				onClick={() => setOpen(true)}
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

			<Dialog open={open} onOpenChange={setOpen}>
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
						<Button variant="outline" onClick={() => setOpen(false)}>
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

			<Dialog
				open={!!previewHtml}
				onOpenChange={(o) => !o && setPreviewHtml(null)}
			>
				<DialogContent className="flex h-[85vh] max-w-6xl flex-col">
					<DialogHeader>
						<DialogTitle>Aperçu HTML — Liste d'étudiants</DialogTitle>
					</DialogHeader>
					<div className="mx-6 mb-6 flex-1 overflow-hidden rounded border">
						{previewHtml && (
							<iframe
								title="Aperçu"
								className="h-full w-full bg-white"
								srcDoc={previewHtml}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
