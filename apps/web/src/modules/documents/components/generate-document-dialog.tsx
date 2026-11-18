import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { Trans, useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
	documentErrorMessage,
	ineligibilityLabel,
} from "@/lib/document-errors";
import { downloadBase64 } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

export type StudentDocumentKind =
	| "enrollment_certificate"
	| "attestation"
	| "transcript"
	| "diploma";

/** Kinds offered from a student's file, in display order. */
export const STUDENT_DOCUMENT_KINDS: StudentDocumentKind[] = [
	"enrollment_certificate",
	"attestation",
	"transcript",
	"diploma",
];

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
 * Issues an official document for one student: enrollment certificate (for
 * one of their enrollments), pass certificate, transcript or diploma. Shows
 * up front whether the document may be issued and why not; previews as HTML
 * or downloads the numbered PDF.
 */
export const GenerateDocumentDialog = createCallable<{
	studentId: string;
	studentName: string;
	initialKind?: StudentDocumentKind;
}>(({ call, studentId, studentName, initialKind }) => {
	const { t } = useTranslation();
	const [kind, setKind] = useState<StudentDocumentKind>(
		initialKind ?? "enrollment_certificate",
	);
	const [classId, setClassId] = useState<string>("");

	const { data: options, isLoading } = useQuery({
		queryKey: ["academic-documents", "student-options", studentId],
		queryFn: () =>
			trpcClient.academicDocuments.studentOptions.query({ studentId }),
	});

	const enrollments = options?.enrollments ?? [];
	// Default to the most recent enrollment that can get a certificate.
	const selectedClassId =
		classId || enrollments.find((e) => e.eligible)?.classId || "";
	const selectedEnrollment = enrollments.find(
		(e) => e.classId === selectedClassId,
	);

	const verdict =
		kind === "enrollment_certificate"
			? selectedEnrollment
				? {
						eligible: selectedEnrollment.eligible,
						reason: selectedEnrollment.reason,
						decision: null,
					}
				: { eligible: false, reason: "not_enrolled", decision: null }
			: kind === "attestation"
				? options?.attestation
				: kind === "diploma"
					? options?.diploma
					: { eligible: true, reason: null, decision: null };
	const canIssue = !!verdict?.eligible;

	const generate = useMutation({
		mutationFn: async (format: "pdf" | "html") =>
			await trpcClient.academicDocuments.generate.mutate({
				kind,
				studentId,
				format,
				...(kind === "enrollment_certificate" && selectedClassId
					? { classId: selectedClassId }
					: {}),
			}),
		onSuccess: (result) => {
			if (result.mimeType === "text/html") {
				DocumentPreviewDialog.call({
					title: t("admin.documents.generate.htmlPreviewTitle", {
						kind: t(`admin.documents.kinds.${kind}.label`),
					}),
					description: studentName,
					html: result.data,
					paper: true,
				});
				return;
			}
			downloadBase64(result.data, result.filename, result.mimeType);
			toast.success(
				result.referenceNumber
					? t("admin.documents.generate.toast.issued", {
							reference: result.referenceNumber,
						})
					: t("admin.documents.generate.toast.success"),
			);
			call.end();
		},
		onError: (err) => toast.error(documentErrorMessage(t, err)),
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
							onValueChange={(v) => setKind(v as StudentDocumentKind)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{STUDENT_DOCUMENT_KINDS.map((k) => (
									<SelectItem key={k} value={k}>
										{t(`admin.documents.kinds.${k}.label`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-xs">
							{t(`admin.documents.kinds.${kind}.description`)}
						</p>
					</div>
					{kind === "enrollment_certificate" && enrollments.length > 0 && (
						<div className="space-y-1">
							<Label>{t("admin.documents.generate.enrollment")}</Label>
							<Select value={selectedClassId} onValueChange={setClassId}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{enrollments.map((e) => (
										<SelectItem key={e.classId} value={e.classId}>
											{e.academicYearName} — {e.className}
											{!e.eligible && ` (${ineligibilityLabel(t, e.reason)})`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					{isLoading ? (
						<Spinner />
					) : (
						!canIssue && (
							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									{t("admin.documents.generate.cannotIssue", {
										reason: ineligibilityLabel(
											t,
											verdict?.reason,
											verdict?.decision,
										),
									})}
								</AlertDescription>
							</Alert>
						)
					)}
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
						variant="outline"
						disabled={generate.isPending || !canIssue}
						onClick={() => generate.mutate("html")}
					>
						<Eye className="mr-1 h-4 w-4" />
						{t("admin.documents.generate.preview")}
					</Button>
					<Button
						onClick={() => generate.mutate("pdf")}
						disabled={generate.isPending || !canIssue}
					>
						{generate.isPending ? (
							<Spinner className="mr-2" />
						) : (
							<Download className="mr-1 h-4 w-4" />
						)}
						{t("admin.documents.generate.submit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
