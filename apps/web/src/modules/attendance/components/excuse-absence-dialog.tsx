import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

/**
 * Excuses an absence with a reason, an optional category and justification
 * document (per the institution policy); resolves `true` once excused.
 */
export const ExcuseAbsenceDialog = createCallable<
	{
		recordId: string;
		studentName: string;
		acceptedCategories: string[];
		requiresDocument: boolean;
		onExcused: () => void;
	},
	boolean
>(
	({
		call,
		recordId,
		studentName,
		acceptedCategories,
		requiresDocument,
		onExcused,
	}) => {
		const { t } = useTranslation();
		const [excuseReason, setExcuseReason] = useState("");
		const [excuseCategory, setExcuseCategory] = useState("");
		const [justificationDocumentUrl, setJustificationDocumentUrl] =
			useState("");

		const uploadJustification = useMutation({
			mutationFn: async (file: File) => {
				const base64 = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => {
						const result = String(reader.result ?? "");
						resolve(result.includes(",") ? result.split(",")[1] : result);
					};
					reader.onerror = () => reject(reader.error);
					reader.readAsDataURL(file);
				});
				return trpcClient.files.uploadAttendanceJustification.mutate({
					filename: file.name,
					mimeType: file.type || "application/octet-stream",
					base64,
				});
			},
			onSuccess: (stored) => {
				setJustificationDocumentUrl(stored.url);
				toast.success(t("teacher.attendanceManagement.toast.documentUploaded"));
			},
			onError: (err) => toast.error(err.message),
		});

		const excuse = useMutationFlow(call, async (call) => {
			try {
				await trpcClient.attendance.excuseAbsence.mutate({
					attendanceRecordId: recordId,
					excuseReason,
					excuseCategory: excuseCategory || undefined,
					justificationDocumentUrl: justificationDocumentUrl || undefined,
					approve: true,
				});
				toast.success(t("teacher.attendanceManagement.toast.excused"));
				onExcused();
				call.end(true);
			} catch (err) {
				toast.error((err as Error).message);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={excuse.pending}
				className="sm:max-w-sm"
				title={t("teacher.attendanceManagement.excuse")}
			>
				<div className="space-y-3">
					<p className="text-muted-foreground text-sm">
						{t("teacher.attendanceManagement.student")}:{" "}
						<span className="font-medium text-foreground">{studentName}</span>
					</p>
					{acceptedCategories.length > 0 && (
						<div>
							<Label>{t("teacher.attendanceManagement.excuseCategory")}</Label>
							<Select value={excuseCategory} onValueChange={setExcuseCategory}>
								<SelectTrigger className="mt-1">
									<SelectValue
										placeholder={t(
											"teacher.attendanceManagement.excuseCategoryPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{acceptedCategories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					<div>
						<Label>{t("teacher.attendanceManagement.excuseReason")}</Label>
						<Textarea
							className="mt-1"
							placeholder={t("teacher.attendanceManagement.excusePlaceholder")}
							value={excuseReason}
							onChange={(e) => setExcuseReason(e.target.value)}
							rows={3}
						/>
					</div>
					<div className="space-y-2">
						<Label>
							{t("teacher.attendanceManagement.justificationDocument")}
							{requiresDocument ? " *" : ""}
						</Label>
						<Input
							type="file"
							onChange={(event) => {
								const file = event.target.files?.[0];
								if (file) uploadJustification.mutate(file);
							}}
						/>
						<Input
							value={justificationDocumentUrl}
							onChange={(event) =>
								setJustificationDocumentUrl(event.target.value)
							}
							placeholder={t(
								"teacher.attendanceManagement.justificationDocumentPlaceholder",
							)}
						/>
						{uploadJustification.isPending && (
							<p className="text-muted-foreground text-xs">
								{t("teacher.attendanceManagement.uploadingDocument")}
							</p>
						)}
					</div>
				</div>
				<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						disabled={excuse.pending}
						onClick={() => call.end(false)}
					>
						{t("common.cancel")}
					</Button>
					<Button
						onClick={() => excuse()}
						disabled={
							!excuseReason.trim() ||
							(acceptedCategories.length > 0 && !excuseCategory) ||
							(requiresDocument && !justificationDocumentUrl.trim()) ||
							excuse.pending ||
							uploadJustification.isPending
						}
					>
						{t("teacher.attendanceManagement.submitExcuse")}
					</Button>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
