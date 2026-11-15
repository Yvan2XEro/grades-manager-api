import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
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

export function ExportStudentListButton({ label, ...filters }: Props) {
	const { t } = useTranslation();
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
					? t("admin.documents.studentList.triggerHint")
					: t("admin.documents.studentList.triggerDisabledHint")
			}
		>
			<FileText className="mr-1 h-4 w-4" />
			{label ?? t("admin.documents.studentList.trigger")}
		</Button>
	);
}

/**
 * Exports a student list with an official template: downloads the PDF, or
 * opens an HTML preview on top of the dialog.
 */
export const ExportStudentListDialog = createCallable<Omit<Props, "label">>(
	({ call, classId, programId, academicYearId, studentIds }) => {
		const { t } = useTranslation();
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
				const used = result.usedTemplate;
				toast.success(
					used.variant === "center"
						? t("admin.documents.studentList.toast.templateUsedCenter", {
								name: used.name,
							})
						: t("admin.documents.studentList.toast.templateUsed", {
								name: used.name,
							}),
				);
				if (result.mimeType === "text/html") {
					DocumentPreviewDialog.call({
						title: t("admin.documents.studentList.previewTitle"),
						html: result.data,
					});
					return;
				}
				downloadBase64(result.data, result.filename, result.mimeType);
				call.end();
			},
			onError: (err: any) =>
				toast.error(
					err.message || t("admin.documents.studentList.toast.error"),
				),
		});

		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(o) => !o && !generate.isPending && call.end()}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.documents.studentList.title")}</DialogTitle>
						<DialogDescription>
							{classId
								? t("admin.documents.studentList.forClass")
								: programId
									? t("admin.documents.studentList.forProgram")
									: studentIds
										? t("admin.documents.studentList.forStudents", {
												count: studentIds.length,
											})
										: t("admin.documents.studentList.forFilters")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 px-6 py-2">
						<div className="space-y-1">
							<Label>{t("admin.documents.studentList.template")}</Label>
							<Select value={templateId} onValueChange={setTemplateId}>
								<SelectTrigger>
									<SelectValue
										placeholder={
											templates && templates.length > 0
												? t("admin.documents.studentList.templateDefault")
												: t("admin.documents.studentList.noTemplate")
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{(templates ?? []).map((tpl) => (
										<SelectItem key={tpl.id} value={tpl.id}>
											{tpl.name}
											{tpl.isDefault
												? t("admin.documents.studentList.defaultSuffix")
												: ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>{t("admin.documents.generate.format")}</Label>
							<Select
								value={format}
								onValueChange={(v) => setFormat(v as "pdf" | "html")}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pdf">
										{t("admin.documents.generate.formatPdf")}
									</SelectItem>
									<SelectItem value="html">
										{t("admin.documents.generate.formatHtml")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center justify-between">
							<Label className="flex flex-col gap-0.5">
								<span>{t("admin.documents.generate.demoMode")}</span>
								<span className="font-normal text-muted-foreground text-xs">
									{t("admin.documents.studentList.demoModeHint")}
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
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => generate.mutate()}
							disabled={generate.isPending}
						>
							{generate.isPending && <Spinner className="mr-2" />}
							<Download className="mr-1 h-4 w-4" />
							{t("admin.documents.generate.submit")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
