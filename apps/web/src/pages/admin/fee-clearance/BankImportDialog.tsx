import { useMutation, useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
	HelpCircle,
	Loader2,
	Upload,
	XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

type PreviewResult =
	RouterOutputs["feeClearance"]["previewBankImport"]["results"][number];

type ImportStatus = PreviewResult["status"];

const STATUS_BADGE: Record<
	ImportStatus,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
		icon: React.ReactNode;
	}
> = {
	matched: {
		label: "Correspondance",
		variant: "default",
		icon: <CheckCircle2 className="h-3 w-3" />,
	},
	duplicate: {
		label: "Doublon",
		variant: "secondary",
		icon: <AlertCircle className="h-3 w-3" />,
	},
	unknown_ref: {
		label: "Référence inconnue",
		variant: "destructive",
		icon: <XCircle className="h-3 w-3" />,
	},
	amount_mismatch: {
		label: "Montant incorrect",
		variant: "outline",
		icon: <HelpCircle className="h-3 w-3" />,
	},
};

type ParsedRow = { reference: string; amount: number; date: string };

function parseCSV(raw: string): ParsedRow[] {
	return raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter(
			(line) =>
				!line.startsWith("#") && !line.toLowerCase().startsWith("reference"),
		)
		.map((line) => {
			const parts = line.split(/[,;\t]/);
			const reference = parts[0]?.trim() ?? "";
			const amount = Number.parseFloat(
				(parts[1] ?? "").trim().replace(/\s/g, ""),
			);
			const date = (parts[2] ?? "").trim();
			return { reference, amount, date };
		})
		.filter(
			(r) =>
				r.reference.length > 0 &&
				!Number.isNaN(r.amount) &&
				r.amount > 0 &&
				/^\d{4}-\d{2}-\d{2}$/.test(r.date),
		);
}

function xlsxDateToISO(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	if (typeof value === "number") {
		// Excel serial date
		const d = XLSX.SSF.parse_date_code(value);
		if (d) {
			const month = String(d.m).padStart(2, "0");
			const day = String(d.d).padStart(2, "0");
			return `${d.y}-${month}-${day}`;
		}
	}
	if (typeof value === "string") {
		// Try ISO or DD/MM/YYYY
		const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (iso) return value;
		const fr = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
		if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
	}
	return "";
}

function parseXLSX(buffer: ArrayBuffer): ParsedRow[] {
	const wb = XLSX.read(buffer, { type: "array", cellDates: true });
	const ws = wb.Sheets[wb.SheetNames[0]];
	if (!ws) return [];
	const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
		header: 1,
		defval: "",
	}) as unknown[][];

	return rows
		.slice(1) // skip header
		.map((row) => {
			const reference = String(row[0] ?? "").trim();
			const rawAmount = row[1];
			const amount = Number.parseFloat(
				String(rawAmount ?? "")
					.trim()
					.replace(/\s/g, ""),
			);
			const date = xlsxDateToISO(row[2]);
			return { reference, amount, date };
		})
		.filter(
			(r) =>
				r.reference.length > 0 &&
				!Number.isNaN(r.amount) &&
				r.amount > 0 &&
				/^\d{4}-\d{2}-\d{2}$/.test(r.date),
		);
}

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onSuccess: () => void;
}

export default function BankImportDialog({
	open,
	onOpenChange,
	onSuccess,
}: Props) {
	const { t } = useTranslation();
	const fileRef = useRef<HTMLInputElement>(null);

	const [csvText, setCsvText] = useState("");
	const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
	const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
	const [showPreview, setShowPreview] = useState(false);
	const [forceMatchRefs, setForceMatchRefs] = useState<Set<string>>(new Set());

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
		onOpenChange(false);
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
		<Dialog open={open} onOpenChange={handleClose}>
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

					{/* Preview table */}
					{showPreview && (
						<div className="space-y-2">
							{previewQuery.isLoading ? (
								<div className="flex items-center justify-center py-6">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							) : preview ? (
								<>
									{/* Summary chips */}
									<div className="flex flex-wrap gap-2">
										{(
											[
												["matched", preview.summary.matched],
												["duplicate", preview.summary.duplicate],
												["unknown_ref", preview.summary.unknownRef],
												["amount_mismatch", preview.summary.amountMismatch],
											] as [ImportStatus, number][]
										)
											.filter(([, n]) => n > 0)
											.map(([status, n]) => {
												const cfg = STATUS_BADGE[status];
												return (
													<Badge
														key={status}
														variant={cfg.variant}
														className="gap-1"
													>
														{cfg.icon}
														{cfg.label}: {n}
													</Badge>
												);
											})}
									</div>

									<div className="max-h-64 overflow-y-auto rounded border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														{t("feeClearance.bankImport.col.reference")}
													</TableHead>
													<TableHead className="text-right">
														{t("feeClearance.bankImport.col.amount")}
													</TableHead>
													<TableHead>
														{t("feeClearance.bankImport.col.date")}
													</TableHead>
													<TableHead>
														{t("feeClearance.bankImport.col.student")}
													</TableHead>
													<TableHead>
														{t("feeClearance.bankImport.col.status")}
													</TableHead>
													<TableHead />
												</TableRow>
											</TableHeader>
											<TableBody>
												{preview.results.map((r, i) => {
													const cfg = STATUS_BADGE[r.status];
													const isForced = forceMatchRefs.has(r.reference);
													return (
														<TableRow key={`${r.reference}-${i}`}>
															<TableCell className="font-mono text-xs">
																{r.reference}
															</TableCell>
															<TableCell className="text-right text-xs">
																{r.amount.toLocaleString()}
																{r.orderAmount &&
																	r.orderAmount !== r.amount && (
																		<span className="ml-1 text-muted-foreground">
																			(attendu: {r.orderAmount.toLocaleString()}
																			)
																		</span>
																	)}
															</TableCell>
															<TableCell className="text-xs">
																{r.date}
															</TableCell>
															<TableCell className="text-xs">
																{r.studentName ?? "—"}
															</TableCell>
															<TableCell>
																<Badge
																	variant={isForced ? "default" : cfg.variant}
																	className="gap-1 text-xs"
																>
																	{isForced ? (
																		<CheckCircle2 className="h-3 w-3" />
																	) : (
																		cfg.icon
																	)}
																	{isForced
																		? t("feeClearance.bankImport.forced", {
																				defaultValue: "Forcé",
																			})
																		: cfg.label}
																</Badge>
															</TableCell>
															<TableCell>
																{r.status === "amount_mismatch" && (
																	<label className="flex cursor-pointer items-center gap-1.5 text-xs">
																		<Checkbox
																			checked={isForced}
																			onCheckedChange={() =>
																				toggleForceMatch(r.reference)
																			}
																		/>
																		{t("feeClearance.bankImport.forceMatch", {
																			defaultValue: "Forcer",
																		})}
																	</label>
																)}
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</div>
								</>
							) : null}
						</div>
					)}
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.cancel")}
					</Button>
					{!showPreview ? (
						<Button disabled={!canPreview} onClick={() => setShowPreview(true)}>
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
}
