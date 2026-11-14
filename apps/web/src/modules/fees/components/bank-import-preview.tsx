import {
	AlertCircle,
	CheckCircle2,
	HelpCircle,
	Loader2,
	XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { BankImportResult, BankImportStatus } from "../types";

type ImportStatus = BankImportStatus;

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

/** Summary chips and per-row results of a bank statement preview. */
export function BankImportPreview({
	preview,
	isLoading,
	forceMatchRefs,
	onToggleForceMatch,
}: {
	preview?: {
		summary: {
			matched: number;
			duplicate: number;
			unknownRef: number;
			amountMismatch: number;
		};
		results: BankImportResult[];
	};
	isLoading: boolean;
	forceMatchRefs: Set<string>;
	onToggleForceMatch: (reference: string) => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="space-y-2">
			{isLoading ? (
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
									<Badge key={status} variant={cfg.variant} className="gap-1">
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
									<TableHead>{t("feeClearance.bankImport.col.date")}</TableHead>
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
												{r.orderAmount && r.orderAmount !== r.amount && (
													<span className="ml-1 text-muted-foreground">
														(attendu: {r.orderAmount.toLocaleString()})
													</span>
												)}
											</TableCell>
											<TableCell className="text-xs">{r.date}</TableCell>
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
																onToggleForceMatch(r.reference)
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
	);
}
