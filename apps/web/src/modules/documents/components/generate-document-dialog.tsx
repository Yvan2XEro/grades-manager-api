import { useMutation } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { Trans, useTranslation } from "react-i18next";
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

type DocumentKind = "diploma" | "transcript" | "attestation";

interface Props {
	studentId: string;
	studentName: string;
	/** Optional renderer for the trigger — defaults to a small ghost button. */
	renderTrigger?: (open: () => void) => React.ReactNode;
}

export function GenerateDocumentButton({
	studentId,
	studentName,
	renderTrigger,
}: Props) {
	const { t } = useTranslation();
	const open = () => GenerateDocumentDialog.call({ studentId, studentName });
	return renderTrigger ? (
		renderTrigger(open)
	) : (
		<Button
			size="sm"
			variant="ghost"
			onClick={open}
			title={t("admin.documents.generate.trigger")}
		>
			<FileText className="h-4 w-4" />
		</Button>
	);
}

/**
 * Generates a diploma / transcript / attestation for a student: downloads the
 * PDF, or opens an HTML preview on top of the dialog.
 */
export const GenerateDocumentDialog = createCallable<{
	studentId: string;
	studentName: string;
}>(({ call, studentId, studentName }) => {
	const { t } = useTranslation();
	const [kind, setKind] = useState<DocumentKind>("transcript");
	const [format, setFormat] = useState<"pdf" | "html">("pdf");
	const [demoMode, setDemoMode] = useState(false);

	const generate = useMutation({
		mutationFn: async () => {
			const result = await trpcClient.academicDocuments.generate.mutate({
				kind,
				studentId,
				format,
				demoMode,
			});
			return result as {
				data: string;
				filename: string;
				mimeType: string;
			};
		},
		onSuccess: (result) => {
			if (result.mimeType === "text/html") {
				DocumentPreviewDialog.call({
					title: t("admin.documents.generate.htmlPreviewTitle", {
						kind: t(`admin.documents.kinds.${kind}.label`),
					}),
					description: studentName,
					html: result.data,
				});
				return;
			}
			downloadBase64(result.data, result.filename, result.mimeType);
			toast.success(t("admin.documents.generate.toast.success"));
			call.end();
		},
		onError: (err: any) =>
			toast.error(err.message || t("admin.documents.generate.toast.error")),
	});

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !generate.isPending && call.end()}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("admin.documents.generate.title")}</DialogTitle>
					<DialogDescription>
						<Trans
							i18nKey="admin.documents.generate.description"
							values={{ name: studentName }}
							components={{ strong: <strong /> }}
						/>
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 px-6 py-2">
					<div className="space-y-1">
						<Label>{t("admin.documents.generate.kind")}</Label>
						<Select
							value={kind}
							onValueChange={(v) => setKind(v as DocumentKind)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="diploma">
									{t("admin.documents.kinds.diploma.label")}
								</SelectItem>
								<SelectItem value="transcript">
									{t("admin.documents.kinds.transcript.label")}
								</SelectItem>
								<SelectItem value="attestation">
									{t("admin.documents.kinds.attestation.label")}
								</SelectItem>
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
								{t("admin.documents.generate.demoModeHint")}
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
}, DIALOG_EXIT_MS);
