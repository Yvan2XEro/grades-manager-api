import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	type ParsedRow,
	parseCSV,
	parseXLSX,
} from "../services/bank-import-parser";
import { BankImportPreview } from "./bank-import-preview";

interface Props {
	onSuccess: () => void;
}

export const BankImportDialog = createCallable<Props, void>(
	({ call, onSuccess }) => {
		const { t } = useTranslation();
		const fileRef = useRef<HTMLInputElement>(null);

		const [csvText, setCsvText] = useState("");
		const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
		const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
		const [batchNotes, setBatchNotes] = useState("");
		const [showPreview, setShowPreview] = useState(false);
		const [forceMatchRefs, setForceMatchRefs] = useState<Set<string>>(
			new Set(),
		);

		// rows: use pre-parsed (XLSX) or parse CSV on-the-fly
		const rows: ParsedRow[] = parsedRows ?? parseCSV(csvText);
		const canPreview = rows.length > 0;

		const previewQuery = useQuery({
			...trpc.feeClearance.previewBankImport.queryOptions({ rows }),
			enabled: showPreview && canPreview,
		});

		const applyMutation = useMutation({
			mutationFn: () =>
				trpcClient.feeClearance.applyBankImport.mutate({
					rows,
					paymentMethod: paymentMethod as never,
					forceMatchRefs: [...forceMatchRefs],
					batchNotes: batchNotes || undefined,
				}),
			onSuccess: (data) => {
				toast.success(
					t("feeClearance.bankImport.applySuccess", {
						applied: data.applied,
						skipped: data.skipped,
					}),
				);
				onSuccess();
				handleClose();
			},
			onError: () => toast.error(t("feeClearance.bankImport.applyError")),
		});

		function handleClose() {
			setCsvText("");
			setParsedRows(null);
			setShowPreview(false);
			setForceMatchRefs(new Set());
			setBatchNotes("");
			call.end();
		}

		function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
			const file = e.target.files?.[0];
			if (!file) return;

			const isXlsx =
				file.name.endsWith(".xlsx") ||
				file.name.endsWith(".xls") ||
				file.type ===
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
				file.type === "application/vnd.ms-excel";

			if (isXlsx) {
				const reader = new FileReader();
				reader.onload = (ev) => {
					const buf = ev.target?.result as ArrayBuffer;
					const rows = parseXLSX(buf);
					setParsedRows(rows);
					setCsvText("");
					setShowPreview(false);
					setForceMatchRefs(new Set());
				};
				reader.readAsArrayBuffer(file);
			} else {
				const reader = new FileReader();
				reader.onload = (ev) => {
					setParsedRows(null);
					setCsvText((ev.target?.result as string) ?? "");
					setShowPreview(false);
					setForceMatchRefs(new Set());
				};
				reader.readAsText(file);
			}
			e.target.value = "";
		}

		function toggleForceMatch(ref: string) {
			setForceMatchRefs((prev) => {
				const next = new Set(prev);
				if (next.has(ref)) next.delete(ref);
				else next.add(ref);
				return next;
			});
		}

		const preview = previewQuery.data;
		const matched = preview?.summary.matched ?? 0;
		const canApply = matched + forceMatchRefs.size > 0;

		return (
			<Dialog open={!call.ended} onOpenChange={handleClose}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>{t("feeClearance.bankImport.title")}</DialogTitle>
					</DialogHeader>

					<DialogBody className="space-y-4">
						{/* File / CSV input */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>{t("feeClearance.bankImport.csvLabel")}</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => fileRef.current?.click()}
								>
									<Upload className="mr-1 h-3 w-3" />
									{t("feeClearance.bankImport.uploadFile")}
								</Button>
								<input
									ref={fileRef}
									type="file"
									accept=".csv,.txt,.xlsx,.xls"
									className="hidden"
									onChange={handleFileUpload}
								/>
							</div>
							{/* XLSX selected: show pill instead of textarea */}
							{parsedRows !== null ? (
								<div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
									<CheckCircle2 className="h-4 w-4 text-green-600" />
									<span>
										{t("feeClearance.bankImport.xlsxLoaded", {
											count: parsedRows.length,
											defaultValue: `${parsedRows.length} lignes chargées depuis le fichier Excel`,
										})}
									</span>
									<button
										type="button"
										className="ml-auto text-muted-foreground hover:text-foreground"
										onClick={() => {
											setParsedRows(null);
											setShowPreview(false);
										}}
									>
										<XCircle className="h-4 w-4" />
									</button>
								</div>
							) : (
								<Textarea
									rows={5}
									placeholder={t("feeClearance.bankImport.csvPlaceholder")}
									value={csvText}
									onChange={(e) => {
										setCsvText(e.target.value);
										setShowPreview(false);
									}}
								/>
							)}
							<p className="text-muted-foreground text-xs">
								{rows.length > 0
									? t("feeClearance.bankImport.rowsParsed", {
											count: rows.length,
										})
									: t("feeClearance.bankImport.csvHint")}
							</p>
						</div>

						{/* Method */}
						<div className="flex items-center gap-3">
							<Label className="shrink-0">
								{t("feeClearance.bankImport.method")}
							</Label>
							<Select value={paymentMethod} onValueChange={setPaymentMethod}>
								<SelectTrigger className="w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="bank_transfer">
										{t("feeClearance.payment.methods.bank_transfer")}
									</SelectItem>
									<SelectItem value="check">
										{t("feeClearance.payment.methods.check")}
									</SelectItem>
									<SelectItem value="cash">
										{t("feeClearance.payment.methods.cash")}
									</SelectItem>
									<SelectItem value="mobile_money">
										{t("feeClearance.payment.methods.mobile_money")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Batch notes */}
						<div className="flex items-center gap-3">
							<Label className="shrink-0">
								{t("feeClearance.bankImport.notes")}
							</Label>
							<Textarea
								rows={2}
								value={batchNotes}
								placeholder={t("feeClearance.bankImport.notesPlaceholder")}
								onChange={(e) => setBatchNotes(e.target.value)}
							/>
						</div>

						{/* Preview table */}
						{showPreview && (
							<BankImportPreview
								preview={previewQuery.data}
								isLoading={previewQuery.isLoading}
								forceMatchRefs={forceMatchRefs}
								onToggleForceMatch={toggleForceMatch}
							/>
						)}
					</DialogBody>

					<DialogFooter>
						<Button variant="outline" onClick={handleClose}>
							{t("common.cancel")}
						</Button>
						{!showPreview ? (
							<Button
								disabled={!canPreview}
								onClick={() => setShowPreview(true)}
							>
								{t("feeClearance.bankImport.preview")}
							</Button>
						) : (
							<Button
								disabled={
									!canApply || applyMutation.isPending || previewQuery.isLoading
								}
								onClick={() => applyMutation.mutate()}
							>
								{applyMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{t("feeClearance.bankImport.confirm", {
									count: matched + forceMatchRefs.size,
								})}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
